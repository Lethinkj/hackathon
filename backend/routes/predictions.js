const express = require('express')
const supabase = require('../supabaseClient')
const { requireAuth } = require('../middleware/auth')
const { v5: uuidv5 } = require('uuid')
const {
  getSupplierPrediction,
  runBulkPredictions,
  runSupplierPrediction,
} = require('../services/predictionService')
const { buildDailySeries, buildFeatureForecast, normalizeDayName } = require('../services/predictionEngine')

const router = express.Router()
const SUPPLIER_UUID_NAMESPACE = '550e8400-e29b-41d4-a716-446655440000'

const BUSINESS_TEMPLATES = {
  'Restaurants and Cafes': [
    { foodName: 'Lunch leftovers', category: 'Meals', availableTime: '1:30 PM - 3:00 PM' },
    { foodName: 'Dinner leftovers', category: 'Meals', availableTime: '9:00 PM - 10:30 PM' },
    { foodName: 'Biryani / snacks', category: 'Snacks', availableTime: '7:00 PM - 9:00 PM' },
  ],
  'Weddings and Parties': [
    { foodName: 'Bulk rice', category: 'Rice', availableTime: '10:00 PM - 12:00 AM' },
    { foodName: 'Curries', category: 'Main', availableTime: '10:00 PM - 12:00 AM' },
    { foodName: 'Sweets', category: 'Dessert', availableTime: '9:30 PM - 11:00 PM' },
  ],
  'Corporate Offices & Canteens': [
    { foodName: 'Canteen lunch remaining', category: 'Meals', availableTime: '2:00 PM - 4:00 PM' },
    { foodName: 'Evening snacks', category: 'Snacks', availableTime: '5:00 PM - 6:30 PM' },
  ],
  'Schools & Institutions': [
    { foodName: 'Afternoon meal remaining', category: 'Meals', availableTime: '3:00 PM - 4:30 PM' },
    { foodName: 'Snack packs', category: 'Snacks', availableTime: '4:00 PM - 5:00 PM' },
  ],
  'Caterers & Hotels': [
    { foodName: 'Buffet remaining', category: 'Buffet', availableTime: '10:00 PM - 11:30 PM' },
    { foodName: 'Event meal packs', category: 'Meals', availableTime: '8:00 PM - 10:00 PM' },
  ],
  default: [
    { foodName: 'Mixed meal packs', category: 'Meals', availableTime: '6:00 PM - 8:00 PM' },
  ],
}

function pickTemplate(businessType) {
  return BUSINESS_TEMPLATES[businessType] || BUSINESS_TEMPLATES.default
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

function normalizePredictionRow(row, fallbackSupplierId) {
  const quantity = Number(row.qty ?? row.quantity ?? row.prepared_qty ?? 0)
  const status = String(row.status || 'available').toLowerCase()
  const createdDateInput = row.created_date || row.createdDate
  const createdAt = row.created_at
    || row.createdAt
    || (createdDateInput ? `${String(createdDateInput).slice(0, 10)}T12:00:00.000Z` : null)
    || new Date().toISOString()
  const createdDate = createdDateInput ? String(createdDateInput).slice(0, 10) : String(createdAt).slice(0, 10)
  const preparedQty = Number.isFinite(quantity) ? quantity : 0
  const soldQty = Number(row.sold_qty ?? (status === 'sold' ? quantity : Math.round(quantity * 0.3)))
  const wasteQty = Number(row.waste_qty ?? (status === 'donated' ? quantity : Math.round(quantity * 0.05)))
  const surplusQty = Number(row.surplus_qty ?? Math.max(0, preparedQty - soldQty - wasteQty))
  const weekdayName = normalizeDayName(row.weekday_name || row.weekday, createdDate)

  return {
    supplier_id: row.supplier_id || fallbackSupplierId,
    food_name: row.food_name || row.name || row.foodName || 'Listing',
    food_category: row.food_category || row.type || row.category || 'meal',
    prepared_qty: preparedQty,
    sold_qty: soldQty,
    surplus_qty: surplusQty,
    price: Number(row.price ?? row.base ?? row.original_price ?? row.current_price ?? 0),
    waste_qty: wasteQty,
    created_date: createdDate,
    weekday_name: weekdayName,
    is_weekend: row.is_weekend ?? ['saturday', 'sunday'].includes(weekdayName),
    festival_name: row.festival_name || '',
    is_festival: row.is_festival ?? false,
    weather: row.weather || 'clear',
    temperature: row.temperature ?? null,
    demand_score: Number(row.demand_score ?? row.demandScore ?? 0.55),
    created_at: createdAt,
  }
}

function getLatestFoodRow(rows) {
  return [...rows].sort((a, b) => String(b.created_date || b.createdAt || b.created_at || '').localeCompare(String(a.created_date || a.createdAt || a.created_at || '')))[0] || null
}

function buildPredictionItemsFromRows(rows, businessType, fallbackSupplierId, options = {}) {
  const normalizedRows = (rows || []).map((row) => normalizePredictionRow(row, fallbackSupplierId))
  if (!normalizedRows.length) {
    return pickTemplate(businessType).map((template, index) => {
      const baseQty = options.baseQty || 20
      return {
        foodName: template.foodName,
        category: template.category,
        qty: Math.max(1, Math.round((baseQty / 3) * (1 + index * 0.1))),
        availableTime: template.availableTime,
        confidence: 60 - index * 3,
        suggestedPrice: 'Rs 0',
        predictedSurplus: 0,
      }
    })
  }

  const grouped = new Map()
  for (const row of normalizedRows) {
    const key = normalizeName(row.food_name || row.food_category || 'listing')
    if (!grouped.has(key)) grouped.set(key, [])
    grouped.get(key).push(row)
  }

  const predictionDate = options.prediction_date || new Date().toISOString().slice(0, 10)
  const items = []

  for (const groupRows of grouped.values()) {
    const latest = getLatestFoodRow(groupRows)
    const series = buildDailySeries(groupRows)
    const forecast = buildFeatureForecast(series, {
      prediction_date: predictionDate,
      weekday_name: options.weekday_name || latest?.weekday_name || new Date(`${predictionDate}T12:00:00Z`).toLocaleDateString('en-US', { weekday: 'long' }),
      festival_name: options.festival_name || latest?.festival_name || '',
      weather: options.weather || latest?.weather || 'clear',
    })

    const averagePrice = groupRows.reduce((sum, row) => sum + Number(row.price || 0), 0) / Math.max(1, groupRows.length)

    items.push({
      foodName: latest?.food_name || 'Listing',
      category: latest?.food_category || 'Predicted',
      qty: Math.max(1, Math.round(Number(forecast.predicted_surplus || 0))),
      availableTime: latest?.created_date ? `Latest: ${latest.created_date}` : 'Today',
      confidence: clamp(Number(forecast.confidence_score || 70), 50, 99),
      suggestedPrice: `Rs ${Math.max(1, Math.round(averagePrice * 0.55 || 0))}`,
      predictedSurplus: Number(forecast.predicted_surplus || 0),
      foodCount: groupRows.length,
    })
  }

  return items.sort((a, b) => Number(b.predictedSurplus || 0) - Number(a.predictedSurplus || 0))
}

function isSchemaCompatibilityError(error) {
  const message = String(error?.message || '').toLowerCase()
  return (
    error?.code === 'PGRST204'
    || error?.code === '42P01'
    || message.includes('does not exist')
    || message.includes('could not find')
    || message.includes('relation')
    || message.includes('column')
  )
}

function normalizeName(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[_\-]+/g, ' ')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

async function getProviderForUser(userId) {
  const providerRes = await supabase.from('providers').select('*').eq('user_id', userId).limit(1).maybeSingle()

  if (providerRes.error && !isSchemaCompatibilityError(providerRes.error)) {
    throw providerRes.error
  }

  if (!providerRes.data) {
    return { id: userId, user_id: userId }
  }

  return providerRes.data
}

async function getUserDetails(userId) {
  const userRes = await supabase
    .from('users')
    .select('id, name, username, source_of_food_provider')
    .eq('id', userId)
    .maybeSingle()

  if (userRes.error && !isSchemaCompatibilityError(userRes.error)) {
    throw userRes.error
  }

  return userRes.data || { id: userId, name: null, username: null, source_of_food_provider: null }
}

async function readListingsByColumn(table, column, id) {
  const res = await supabase
    .from(table)
    .select('*')
    .eq(column, id)
    .order('created_at', { ascending: false })
    .limit(30)

  if (!res.error) return res.data || []
  if (isSchemaCompatibilityError(res.error)) return []
  throw res.error
}

async function getRecentListings(providerId) {
  const tables = ['foods', 'food']
  const columns = ['provider_id', 'supplier_id', 'user_id']

  for (const table of tables) {
    for (const column of columns) {
      const rows = await readListingsByColumn(table, column, providerId)
      if (rows.length) return rows
    }
  }

  return []
}

async function getSupplierIdsForBusinessType(businessType) {
  if (!businessType) return []

  const { data, error } = await supabase
    .from('suppliers')
    .select('supplier_id, supplier_name')
    .eq('category', businessType)

  if (error) {
    if (isSchemaCompatibilityError(error)) return []
    throw error
  }

  const ids = new Set()
  for (const row of (data || [])) {
    if (row?.supplier_id) ids.add(row.supplier_id)
    const name = String(row?.supplier_name || '').trim()
    if (name) ids.add(uuidv5(name, SUPPLIER_UUID_NAMESPACE))
  }
  return Array.from(ids)
}

async function getHistoricalLogsForBusinessType(businessType) {
  const supplierIds = await getSupplierIdsForBusinessType(businessType)
  if (!supplierIds.length) return []

  const { data, error } = await supabase
    .from('food_logs')
    .select('*')
    .in('supplier_id', supplierIds)
    .order('created_date', { ascending: true })

  if (error) {
    if (isSchemaCompatibilityError(error)) return []
    throw error
  }

  return data || []
}

function buildSupplierIdCandidates(mappedSupplier) {
  const ids = new Set()
  if (mappedSupplier?.supplier_id) ids.add(mappedSupplier.supplier_id)
  const supplierName = String(mappedSupplier?.supplier_name || '').trim()
  if (supplierName) ids.add(uuidv5(supplierName, SUPPLIER_UUID_NAMESPACE))
  return Array.from(ids)
}

async function findProviderSuppliers(provider, user) {
  const matched = []
  const matchedIds = new Set()
  const category = String(user?.source_of_food_provider || '').trim()
  const providerName = normalizeName(provider?.business_name || provider?.name || user?.name || user?.username)

  const exactIdCandidates = [provider?.id, provider?.user_id, user?.id].filter(Boolean)
  if (exactIdCandidates.length) {
    const { data, error } = await supabase
      .from('suppliers')
      .select('supplier_id, supplier_name, category')
      .in('supplier_id', exactIdCandidates)

    if (error && !isSchemaCompatibilityError(error)) throw error
    for (const row of data || []) {
      if (row?.supplier_id && !matchedIds.has(row.supplier_id)) {
        matchedIds.add(row.supplier_id)
        matched.push(row)
      }
    }
  }

  if (category) {
    const { data, error } = await supabase
      .from('suppliers')
      .select('supplier_id, supplier_name, category')
      .eq('category', category)

    if (error && !isSchemaCompatibilityError(error)) throw error

    for (const row of data || []) {
      const rowName = normalizeName(row?.supplier_name)
      const rowId = row?.supplier_id
      const nameMatches = !providerName || rowName === providerName || rowName.includes(providerName) || providerName.includes(rowName)
      if (!rowId || matchedIds.has(rowId) || !nameMatches && matched.length) continue
      matchedIds.add(rowId)
      matched.push(row)
    }

    if (!matched.length && data?.length) {
      for (const row of data) {
        if (row?.supplier_id && !matchedIds.has(row.supplier_id)) {
          matchedIds.add(row.supplier_id)
          matched.push(row)
        }
      }
    }
  }

  return matched
}

async function getHistoricalLogsForSupplier(supplierIds) {
  if (!supplierIds?.length) return []

  const { data, error } = await supabase
    .from('food_logs')
    .select('*')
    .in('supplier_id', supplierIds)
    .order('created_date', { ascending: true })

  if (error) {
    if (isSchemaCompatibilityError(error)) return []
    throw error
  }

  return data || []
}

async function getHistoricalLogsForSuppliers(suppliers) {
  const ids = Array.from(new Set((suppliers || []).flatMap((supplier) => buildSupplierIdCandidates(supplier))))
  return getHistoricalLogsForSupplier(ids)
}

async function findProviderSupplier(provider, user) {
  const idCandidates = [provider?.id, provider?.user_id, user?.id].filter(Boolean)

  if (idCandidates.length) {
    const { data, error } = await supabase
      .from('suppliers')
      .select('supplier_id, supplier_name, category')
      .in('supplier_id', idCandidates)
      .limit(1)

    if (error && !isSchemaCompatibilityError(error)) {
      throw error
    }

    if (data?.length) return data[0]
  }

  const providerName = normalizeName(provider?.business_name || provider?.name || user?.name || user?.username)
  if (providerName && user?.source_of_food_provider) {
    const { data, error } = await supabase
      .from('suppliers')
      .select('supplier_id, supplier_name, category')
      .eq('category', user.source_of_food_provider)

    if (error && !isSchemaCompatibilityError(error)) {
      throw error
    }

    const exact = (data || []).find((supplier) => normalizeName(supplier.supplier_name) === providerName)
    if (exact) return exact

    const partial = (data || []).find((supplier) => {
      const a = normalizeName(supplier.supplier_name)
      const b = providerName
      return a.includes(b) || b.includes(a)
    })

    if (partial) return partial
  }

  return null
}

function metricValue(row, qtyKeys, priceKeys) {
  const qty = qtyKeys.reduce((found, key) => {
    if (Number.isFinite(found)) return found
    const value = Number(row[key])
    return Number.isFinite(value) ? value : found
  }, NaN)

  const price = priceKeys.reduce((found, key) => {
    if (Number.isFinite(found)) return found
    const value = Number(row[key])
    return Number.isFinite(value) ? value : found
  }, NaN)

  return {
    qty: Number.isFinite(qty) ? qty : 0,
    price: Number.isFinite(price) ? price : 0,
  }
}

function computeAverages(rows) {
  if (!rows.length) return { avgQty: 24, avgPrice: 120 }

  const stats = rows.reduce((acc, row) => {
    const { qty, price } = metricValue(row, ['quantity', 'prepared_qty', 'qty'], ['current_price', 'price', 'base_price'])
    acc.qtySum += qty
    acc.priceSum += price
    acc.count += 1
    return acc
  }, { qtySum: 0, priceSum: 0, count: 0 })

  if (!stats.count) return { avgQty: 24, avgPrice: 120 }

  return {
    avgQty: stats.qtySum / stats.count,
    avgPrice: stats.priceSum / stats.count,
  }
}

async function buildBasePrediction(providerId, listings, weather) {
  try {
    return await runSupplierPrediction(providerId, {
      prediction_date: new Date().toISOString().slice(0, 10),
      historicalRows: listings,
      weather,
    })
  } catch (error) {
    // Keep endpoint functional even if prediction persistence/model inputs are unavailable.
    return null
  }
}

function isActiveListingStatus(status) {
  const normalized = String(status || '').toLowerCase()
  return ['available', 'sell', 'discount', 'active'].includes(normalized)
}

async function listActiveListingsForPredictionSupplier(supplierId) {
  const providerIds = new Set([supplierId].filter(Boolean))

  const providersById = await supabase
    .from('providers')
    .select('id, user_id')
    .eq('id', supplierId)
    .limit(1)

  if (!providersById.error) {
    for (const row of providersById.data || []) {
      if (row?.id) providerIds.add(row.id)
      if (row?.user_id) providerIds.add(row.user_id)
    }
  }

  const providersByUser = await supabase
    .from('providers')
    .select('id, user_id')
    .eq('user_id', supplierId)
    .limit(1)

  if (!providersByUser.error) {
    for (const row of providersByUser.data || []) {
      if (row?.id) providerIds.add(row.id)
      if (row?.user_id) providerIds.add(row.user_id)
    }
  }

  const lookupIds = Array.from(providerIds)
  if (!lookupIds.length) return []

  const tables = ['foods', 'food']
  const ownershipColumns = ['provider_id', 'supplier_id', 'user_id']
  const allRows = []
  for (const table of tables) {
    for (const ownershipColumn of ownershipColumns) {
      const rowsRes = await supabase
        .from(table)
        .select('*')
        .in(ownershipColumn, lookupIds)
        .order('created_at', { ascending: false })
        .limit(80)

      if (rowsRes.error) {
        if (isSchemaCompatibilityError(rowsRes.error)) continue
        throw rowsRes.error
      }

      const rows = (rowsRes.data || [])
        .filter((row) => isActiveListingStatus(row.status))
        .map((row) => ({ ...row, __table: table }))

      allRows.push(...rows)
    }
  }

  const deduped = Array.from(new Map(allRows.map((row) => [row.id, row])).values())
  return deduped.sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')))
}

async function findActiveListingById(listingId) {
  const tables = ['foods', 'food']

  for (const table of tables) {
    const rowRes = await supabase
      .from(table)
      .select('*')
      .eq('id', listingId)
      .limit(1)
      .maybeSingle()

    if (rowRes.error) {
      if (isSchemaCompatibilityError(rowRes.error)) continue
      throw rowRes.error
    }

    if (rowRes.data && isActiveListingStatus(rowRes.data.status)) {
      return { ...rowRes.data, __table: table }
    }
  }

  return null
}

async function createPredictionPreorderRecord({ predictionId, userId, supplierId = null, listingId = null, pickupTime }) {
  const { data, error } = await supabase
    .from('prediction_preorders')
    .insert({
      prediction_id: predictionId,
      supplier_id: supplierId,
      user_id: userId,
      listing_id: listingId || null,
      pickup_time: pickupTime,
      status: 'pending',
    })
    .select('*')
    .single()

  if (error) throw error
  return data
}

function findBestListingForPrediction(prediction, listings) {
  if (!listings.length) return null

  const target = normalizeName(prediction?.suggested_action || prediction?.food_name || '')
  if (!target) return listings[0]

  const exact = listings.find((row) => {
    const label = normalizeName(row.food_name || row.name || '')
    return label && (label === target || label.includes(target) || target.includes(label))
  })

  return exact || listings[0]
}

router.get('/products', async (req, res) => {
  try {
    const limitValue = Number(req.query.limit || 100)
    const limit = Number.isFinite(limitValue) ? Math.max(1, Math.min(limitValue, 500)) : 100

    const { data: predictions, error: predictionsError } = await supabase
      .from('predictions')
      .select('id, supplier_id, prediction_date, predicted_surplus, confidence_score, suggested_action, created_at')
      .order('prediction_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit)

    if (predictionsError) throw predictionsError

    const rows = predictions || []
    const supplierIds = Array.from(new Set(rows.map((row) => row.supplier_id).filter(Boolean)))

    let suppliersById = {}
    if (supplierIds.length) {
      const { data: suppliersData, error: suppliersError } = await supabase
        .from('suppliers')
        .select('supplier_id, supplier_name, category, location')
        .in('supplier_id', supplierIds)

      if (suppliersError && !isSchemaCompatibilityError(suppliersError)) throw suppliersError

      suppliersById = (suppliersData || []).reduce((acc, supplier) => {
        acc[supplier.supplier_id] = supplier
        return acc
      }, {})
    }

    const listingCache = new Map()
    const items = await Promise.all(rows.map(async (row) => {
      const supplier = suppliersById[row.supplier_id] || null
      const predictedQty = Math.max(1, Math.round(Number(row.predicted_surplus || 0)))

      if (!listingCache.has(row.supplier_id)) {
        const supplierListings = await listActiveListingsForPredictionSupplier(row.supplier_id)
        listingCache.set(row.supplier_id, supplierListings)
      }

      const bestListing = findBestListingForPrediction(row, listingCache.get(row.supplier_id) || [])

      return {
        id: row.id,
        predictionId: row.id,
        supplierId: row.supplier_id,
        supplierName: supplier?.supplier_name || 'Local supplier',
        foodName: row.suggested_action || 'Predicted surplus item',
        suggestedAction: row.suggested_action || 'Monitor demand',
        qty: predictedQty,
        predictedSurplus: Number(row.predicted_surplus || 0),
        confidence: Number(row.confidence_score || 0),
        category: supplier?.category || 'Predicted',
        location: supplier?.location || null,
        predictionDate: row.prediction_date,
        createdAt: row.created_at,
        listingId: bestListing?.id || null,
        listingStatus: bestListing?.status || null,
        listingTable: bestListing?.__table || null,
      }
    }))

    res.json({ items, count: items.length })
  } catch (error) {
    console.error('[predictions/products] failed:', error)
    res.status(500).json({ error: error.message })
  }
})

async function handlePredictionPreorder(req, res) {
  try {
    const predictionId = req.params.predictionId
    const userId = String(req.body?.userId || '').trim()
    const listingId = String(req.body?.listingId || '').trim()
    const pickupTime = req.body?.pickupTime || new Date(Date.now() + 45 * 60 * 1000).toISOString()

    if (!predictionId || !userId) {
      return res.status(400).json({ error: 'predictionId and userId are required' })
    }

    const predictionRes = await supabase
      .from('predictions')
      .select('*')
      .eq('id', predictionId)
      .maybeSingle()

    if (predictionRes.error) throw predictionRes.error
    if (!predictionRes.data) return res.status(404).json({ error: 'Prediction not found' })

    let targetListing = null
    if (listingId) {
      targetListing = await findActiveListingById(listingId)
    }

    if (!targetListing) {
      const listings = await listActiveListingsForPredictionSupplier(predictionRes.data.supplier_id)
      targetListing = findBestListingForPrediction(predictionRes.data, listings)
    }

    const preorder = await createPredictionPreorderRecord({
      predictionId,
      userId,
      supplierId: predictionRes.data.supplier_id,
      listingId: targetListing?.id || listingId || null,
      pickupTime,
    })

    res.status(201).json({
      preorder,
      predictionId,
      listingId: targetListing?.id || listingId || null,
      supplierId: predictionRes.data.supplier_id,
    })
  } catch (error) {
    console.error('[predictions/preorder] failed:', error)
    res.status(500).json({ error: error.message || 'Failed to preorder from prediction' })
  }
}

router.post('/products/:predictionId/preorder', handlePredictionPreorder)
router.post('/products/:predictionId/prebook', handlePredictionPreorder)

router.get('/preorders/:userId', async (req, res) => {
  try {
    const userId = String(req.params.userId || '').trim()

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' })
    }

    const { data, error } = await supabase
      .from('prediction_preorders')
      .select('*, prediction:predictions(*), listing:foods(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error

    res.json({ items: data || [], count: (data || []).length })
  } catch (error) {
    console.error('[predictions/preorders] failed:', error)
    res.status(500).json({ error: error.message || 'Failed to fetch prediction preorders' })
  }
})

router.get('/today', requireAuth, async (req, res) => {
  try {
    const provider = await getProviderForUser(req.auth.userId)
    const user = await getUserDetails(req.auth.userId)
    const listings = await getRecentListings(provider.id)
    const mappedSuppliers = await findProviderSuppliers(provider, user)
    const providerLogs = await getHistoricalLogsForSuppliers(mappedSuppliers)
    const historicalLogs = await getHistoricalLogsForBusinessType(user.source_of_food_provider)
    const historicalRows = providerLogs.length
      ? providerLogs
      : (historicalLogs.length ? historicalLogs : listings)

    const predictionSupplierId = mappedSuppliers[0]?.supplier_id || provider.id
    const items = buildPredictionItemsFromRows(historicalRows, user.source_of_food_provider, predictionSupplierId, {
      prediction_date: new Date().toISOString().slice(0, 10),
    })
    const loggedInProviderName = provider?.business_name || provider?.name || user?.name || user?.username || null
    const predictionForSupplierName = mappedSuppliers.map((supplier) => supplier.supplier_name).filter(Boolean).join(', ') || loggedInProviderName

    let historicalSource = 'provider_listings'
    if (providerLogs.length) historicalSource = 'food_logs_provider_specific'
    else if (historicalLogs.length) historicalSource = 'food_logs_by_business_type'

    res.json({
      items,
      providerId: predictionSupplierId,
      loggedInProviderName,
      providerBusinessName: provider?.business_name || provider?.name || user?.name || user?.username || null,
      predictionForSupplierName,
      businessType: user.source_of_food_provider || 'default',
      historicalSource,
      matchedSupplierId: mappedSuppliers[0]?.supplier_id || null,
      matchedSupplierName: mappedSuppliers.map((supplier) => supplier.supplier_name).filter(Boolean).join(', ') || null,
      matchedSupplierNames: mappedSuppliers.map((supplier) => supplier.supplier_name).filter(Boolean),
      matchedSuppliers: mappedSuppliers.map((supplier) => ({
        supplierId: supplier.supplier_id,
        supplierName: supplier.supplier_name,
        category: supplier.category,
      })),
      matchedSupplierCount: historicalLogs.length ? new Set(historicalLogs.map((r) => r.supplier_id)).size : 0,
    })
  } catch (error) {
    console.error('[predictions/today] failed:', error)
    const items = buildPredictionItemsFromRows([], 'default', req.auth.userId)
    res.status(200).json({ items, providerId: req.auth.userId, businessType: 'default' })
  }
})

router.post('/recalculate', requireAuth, async (req, res) => {
  try {
    const provider = await getProviderForUser(req.auth.userId)
    const user = await getUserDetails(req.auth.userId)
    const listings = await getRecentListings(provider.id)
    const mappedSuppliers = await findProviderSuppliers(provider, user)
    const providerLogs = await getHistoricalLogsForSuppliers(mappedSuppliers)
    const historicalLogs = await getHistoricalLogsForBusinessType(user.source_of_food_provider)
    const historicalRows = providerLogs.length
      ? providerLogs
      : (historicalLogs.length ? historicalLogs : listings)

    const predictionSupplierId = mappedSuppliers[0]?.supplier_id || provider.id
    const items = buildPredictionItemsFromRows(historicalRows, user.source_of_food_provider, predictionSupplierId, {
      prediction_date: req.body?.prediction_date || new Date().toISOString().slice(0, 10),
      weather: req.body?.weather || 'clear',
      festival_name: req.body?.festival_name || '',
      weekday_name: req.body?.weekday_name || '',
    })
    const loggedInProviderName = provider?.business_name || provider?.name || user?.name || user?.username || null
    const predictionForSupplierName = mappedSuppliers.map((supplier) => supplier.supplier_name).filter(Boolean).join(', ') || loggedInProviderName

    let historicalSource = 'provider_listings'
    if (providerLogs.length) historicalSource = 'food_logs_provider_specific'
    else if (historicalLogs.length) historicalSource = 'food_logs_by_business_type'

    res.json({
      items,
      refreshedAt: new Date().toISOString(),
      loggedInProviderName,
      providerBusinessName: provider?.business_name || provider?.name || user?.name || user?.username || null,
      predictionForSupplierName,
      historicalSource,
      matchedSupplierId: mappedSuppliers[0]?.supplier_id || null,
      matchedSupplierName: mappedSuppliers.map((supplier) => supplier.supplier_name).filter(Boolean).join(', ') || null,
      matchedSupplierNames: mappedSuppliers.map((supplier) => supplier.supplier_name).filter(Boolean),
      matchedSuppliers: mappedSuppliers.map((supplier) => ({
        supplierId: supplier.supplier_id,
        supplierName: supplier.supplier_name,
        category: supplier.category,
      })),
      matchedSupplierCount: historicalLogs.length ? new Set(historicalLogs.map((r) => r.supplier_id)).size : 0,
    })
  } catch (error) {
    console.error('[predictions/recalculate] failed:', error)
    const items = buildPredictionItemsFromRows([], 'default', req.auth.userId)
    res.status(200).json({ items, refreshedAt: new Date().toISOString() })
  }
})

router.get('/supplier/:id', async (req, res) => {
  try {
    const supplierId = req.params.id
    const payload = await getSupplierPrediction(supplierId, req.query)
    res.json(payload)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/run', async (req, res) => {
  try {
    const { supplierId, prediction_date, weekday_name, festival_name, weather, historicalRows } = req.body
    if (!supplierId) {
      return res.status(400).json({ error: 'supplierId is required' })
    }

    const result = await runSupplierPrediction(supplierId, {
      prediction_date,
      weekday_name,
      festival_name,
      weather,
      historicalRows,
    })

    res.json(result)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/bulk-run', async (req, res) => {
  try {
    const results = await runBulkPredictions(req.body || {})
    res.json({ count: results.length, results })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
