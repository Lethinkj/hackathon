const express = require('express')
const supabase = require('../supabaseClient')
const { requireAuth } = require('../middleware/auth')
const { v5: uuidv5 } = require('uuid')

const router = express.Router()
const SUPPLIER_UUID_NAMESPACE = '550e8400-e29b-41d4-a716-446655440000'

const FOOD_TABLES = ['foods', 'food']

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

function toIso(value) {
  const date = new Date(value || Date.now())
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString()
}

function hoursBetween(fromIso, toIsoValue) {
  const fromMs = new Date(fromIso).getTime()
  const toMs = new Date(toIsoValue).getTime()
  if (!Number.isFinite(fromMs) || !Number.isFinite(toMs)) return 0
  return Math.max(0, Math.floor((toMs - fromMs) / (1000 * 60 * 60)))
}

function computeCurrentPrice(listing) {
  const original = Number(listing.originalPrice || 0)
  const maxDiscount = Number(listing.maxDiscountPrice || 0)
  if (!listing.autoHourlyReduction) return original

  const start = toIso(listing.distributionStartTime)
  const now = new Date().toISOString()
  const elapsed = hoursBetween(start, now)
  const span = Math.max(1, Number(listing.expiryHours || 1))
  const perHourDrop = Math.max(0, (original - maxDiscount) / span)
  return Math.max(maxDiscount, Math.round(original - perHourDrop * elapsed))
}

function normalizeFoodType(value) {
  const text = String(value || '').toLowerCase()
  if (text.includes('non') || text.includes('chicken') || text.includes('mutton') || text.includes('egg') || text.includes('fish')) {
    return 'Non-Veg'
  }
  return 'Veg'
}

async function resolveFoodTable() {
  for (const table of FOOD_TABLES) {
    const probe = await supabase.from(table).select('id').limit(1)
    if (!probe.error) return table
  }
  throw new Error('No food listing table found')
}

async function getProviderByUser(userId) {
  const provider = await supabase
    .from('providers')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (!provider.error && provider.data) return provider.data

  const userResult = await supabase
    .from('users')
    .select('name, username, source_of_food_provider')
    .eq('id', userId)
    .maybeSingle()

  if (userResult.error) throw userResult.error

  const insertPayload = {
    user_id: userId,
    name: userResult.data?.name || userResult.data?.username || 'Provider',
    business_name: userResult.data?.name || userResult.data?.username || 'Provider',
    type: 'restaurant',
    provider_type: 'Cafe',
    latitude: Number.isFinite(Number(userResult.data?.lat)) ? Number(userResult.data.lat) : 0,
    longitude: Number.isFinite(Number(userResult.data?.lng)) ? Number(userResult.data.lng) : 0,
  }

  const candidates = [
    ['user_id', 'name', 'type', 'business_name', 'provider_type', 'latitude', 'longitude'],
    ['user_id', 'business_name', 'provider_type', 'latitude', 'longitude'],
    ['user_id', 'name', 'type', 'latitude', 'longitude'],
    ['user_id', 'name', 'type', 'business_name', 'provider_type'],
    ['user_id', 'business_name', 'provider_type'],
    ['user_id', 'name', 'type'],
  ]

  for (const fields of candidates) {
    const payload = Object.fromEntries(Object.entries(insertPayload).filter(([key]) => fields.includes(key)))
    const inserted = await supabase.from('providers').insert(payload).select('*').single()
    if (!inserted.error) return inserted.data
  }

  return {
    id: userId,
    user_id: userId,
    name: userResult.data?.name || userResult.data?.username || 'Provider',
    business_name: userResult.data?.name || userResult.data?.username || 'Provider',
    type: 'restaurant',
  }
}

function buildOwnershipIds(provider, user) {
  return Array.from(new Set([
    provider?.id,
    provider?.user_id,
    user?.id,
  ].filter(Boolean)))
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

function buildSupplierIdCandidates(mappedSupplier) {
  const ids = new Set()
  if (mappedSupplier?.supplier_id) ids.add(mappedSupplier.supplier_id)
  const supplierName = String(mappedSupplier?.supplier_name || '').trim()
  if (supplierName) ids.add(uuidv5(supplierName, SUPPLIER_UUID_NAMESPACE))
  return Array.from(ids)
}

function buildSupplierSummary(suppliers) {
  return (suppliers || []).map((supplier) => ({
    supplierId: supplier.supplier_id,
    supplierName: supplier.supplier_name,
    category: supplier.category,
  }))
}

function toDateOnly(value) {
  const date = new Date(value || Date.now())
  if (Number.isNaN(date.getTime())) return new Date().toISOString().slice(0, 10)
  return date.toISOString().slice(0, 10)
}

async function resolvePrimarySupplier(provider, user) {
  const mappedSuppliers = await findProviderSuppliers(provider, user)
  if (mappedSuppliers.length) return mappedSuppliers[0]

  const businessSupplierIds = await getSupplierIdsForBusinessType(user?.source_of_food_provider)
  if (!businessSupplierIds.length) return null

  const { data, error } = await supabase
    .from('suppliers')
    .select('supplier_id, supplier_name, category')
    .in('supplier_id', businessSupplierIds)
    .limit(1)

  if (error && !isSchemaCompatibilityError(error)) throw error
  return data?.[0] || null
}

async function syncListingToFoodLog(provider, user, listing) {
  try {
    const supplier = await resolvePrimarySupplier(provider, user)
    if (!supplier?.supplier_id) return null

    const createdDate = toDateOnly(listing.distributionStartTime || Date.now())
    const parsedDate = new Date(createdDate)
    const preparedQty = Math.max(0, Math.round(Number(listing.quantity || 0)))
    const soldQty = Math.max(0, Math.round(Number(listing.reserved || 0)))
    const surplusQty = Math.max(0, preparedQty - soldQty)
    const price = Number.isFinite(Number(listing.currentPrice ?? listing.originalPrice))
      ? Number(listing.currentPrice ?? listing.originalPrice)
      : 0

    const payload = {
      supplier_id: supplier.supplier_id,
      food_name: listing.foodName || 'Listing',
      food_category: listing.category || 'Meals',
      prepared_qty: preparedQty,
      sold_qty: soldQty,
      surplus_qty: surplusQty,
      waste_qty: Math.max(0, Math.round(Number(listing.wasteQty || 0))),
      price,
      created_date: createdDate,
      weekday_name: parsedDate.toLocaleDateString('en-US', { weekday: 'long' }),
      is_weekend: [0, 6].includes(parsedDate.getDay()),
      festival_name: listing.festivalName || null,
      is_festival: Boolean(listing.isFestival),
      weather: listing.weather || null,
      temperature: Number.isFinite(Number(listing.temperature)) ? Number(listing.temperature) : null,
      demand_score: Number.isFinite(Number(listing.demandScore)) ? Number(listing.demandScore) : (listing.donationPriority ? 0.7 : 0.5),
    }

    const existing = await supabase
      .from('food_logs')
      .select('id')
      .eq('supplier_id', supplier.supplier_id)
      .eq('food_name', payload.food_name)
      .eq('created_date', createdDate)
      .maybeSingle()

    if (existing.error && !isSchemaCompatibilityError(existing.error)) throw existing.error

    if (existing.data?.id) {
      const updated = await supabase
        .from('food_logs')
        .update(payload)
        .eq('id', existing.data.id)
        .select('*')
        .single()

      if (updated.error && !isSchemaCompatibilityError(updated.error)) throw updated.error
      return updated.data || null
    }

    const inserted = await supabase
      .from('food_logs')
      .insert(payload)
      .select('*')
      .single()

    if (inserted.error && !isSchemaCompatibilityError(inserted.error)) throw inserted.error
    return inserted.data || null
  } catch (error) {
    console.warn('[listings/sync-food-log] skipped:', error.message || error)
    return null
  }
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
      if (!rowId || matchedIds.has(rowId) || (!nameMatches && matched.length)) continue
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

async function getHistoricalLogsForSuppliers(suppliers) {
  const ids = Array.from(new Set((suppliers || []).flatMap((supplier) => buildSupplierIdCandidates(supplier))))
  if (!ids.length) return []

  const { data, error } = await supabase
    .from('food_logs')
    .select('*')
    .in('supplier_id', ids)
    .order('created_date', { ascending: false })

  if (error) {
    if (isSchemaCompatibilityError(error)) return []
    throw error
  }

  return data || []
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

function mapFoodLogRow(row) {
  return {
    id: row.id,
    supplierId: row.supplier_id,
    foodName: row.food_name,
    foodCategory: row.food_category,
    preparedQty: Number(row.prepared_qty || 0),
    soldQty: Number(row.sold_qty || 0),
    surplusQty: Number(row.surplus_qty || 0),
    price: Number(row.price || 0),
    wasteQty: Number(row.waste_qty || 0),
    createdDate: row.created_date,
    demandScore: Number(row.demand_score || 0),
    weather: row.weather || null,
  }
}

function mapListingRow(row) {
  const quantity = Number(row.quantity || 0)
  const originalPrice = Number(row.original_price ?? row.base_price ?? row.originalPrice ?? row.price ?? 0)
  const currentPrice = Number(row.current_price ?? row.currentPrice ?? row.price ?? originalPrice)
  const reserved = Number(row.reserved_count || row.reserved || 0)
  const start = row.distribution_start_time || row.created_at || new Date().toISOString()
  const expiry = row.expiry_time || new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString()

  return {
    id: row.id,
    image: row.image_url || row.image || '',
    foodName: row.food_name || row.name || 'Listing',
    category: row.category || row.food_type || row.type || 'Meals',
    quantity,
    quantityLeft: Math.max(0, quantity - reserved),
    originalPrice,
    currentPrice,
    orders: Number(row.orders_count || row.orders || 0),
    reserved,
    status: String(row.status || 'ACTIVE').toUpperCase(),
    distributionStartTime: start,
    startTime: new Date(start).toLocaleString(),
    expiry,
    expiryHours: Number(row.expiry_hours || 5),
    maxDiscountPrice: Number(row.max_discount_price || Math.max(0, Math.round(originalPrice * 0.4))),
    autoHourlyReduction: Boolean(row.auto_hourly_reduction),
    donationPriority: Boolean(row.donation_priority),
    notes: row.notes || '',
  }
}

function buildInsertCandidates(payload, providerId) {
  const expiryTime = new Date(new Date(payload.distributionStartTime).getTime() + Number(payload.expiryHours || 5) * 60 * 60 * 1000).toISOString()
  const currentPrice = computeCurrentPrice(payload)

  return [
    {
      provider_id: providerId,
      name: payload.foodName,
      food_type: normalizeFoodType(payload.category),
      quantity: Number(payload.quantity || 0),
      base_price: Number(payload.originalPrice || 0),
      current_price: currentPrice,
      created_at: toIso(payload.distributionStartTime),
      expiry_time: expiryTime,
      discount_time: Number(payload.expiryHours || 5) * 60,
      ngo_time: 30,
      listing_mode: payload.donationPriority ? 'donate' : 'discount',
      status: 'available',
    },
    {
      provider_id: providerId,
      food_name: payload.foodName,
      quantity: Number(payload.quantity || 0),
      price: currentPrice,
      original_price: Number(payload.originalPrice || 0),
      type: normalizeFoodType(payload.category),
      expiry_time: expiryTime,
      status: 'available',
      created_at: toIso(payload.distributionStartTime),
    },
    {
      provider_id: providerId,
      food_name: payload.foodName,
      quantity: Number(payload.quantity || 0),
      type: normalizeFoodType(payload.category),
      price: currentPrice,
      original_price: Number(payload.originalPrice || 0),
      created_at: toIso(payload.distributionStartTime),
      expiry_time: expiryTime,
      status: 'available',
    },
    {
      provider_id: providerId,
      food_name: payload.foodName,
      name: payload.foodName,
      category: payload.category,
      food_type: payload.category,
      quantity: Number(payload.quantity || 0),
      price: currentPrice,
      original_price: Number(payload.originalPrice || 0),
      current_price: currentPrice,
      base_price: Number(payload.originalPrice || 0),
      max_discount_price: Number(payload.maxDiscountPrice || 0),
      distribution_start_time: toIso(payload.distributionStartTime),
      created_at: toIso(payload.distributionStartTime),
      expiry_time: expiryTime,
      expiry_hours: Number(payload.expiryHours || 5),
      auto_hourly_reduction: Boolean(payload.autoHourlyReduction),
      donation_priority: Boolean(payload.donationPriority),
      notes: payload.notes || null,
      image_url: payload.image || null,
      listing_mode: payload.donationPriority ? 'donate' : 'discount',
      status: 'available',
    },
  ]
}

function filterPayload(payload, allowed) {
  return Object.fromEntries(Object.entries(payload).filter(([key]) => allowed.includes(key)))
}

async function insertListing(table, candidates) {
  for (const candidate of candidates) {
    const inserted = await supabase.from(table).insert(candidate).select('*').single()
    if (!inserted.error) return inserted.data

    const missingColumn = String(inserted.error?.message || '').toLowerCase().includes('column')
    if (!missingColumn) throw inserted.error
  }

  throw new Error('Unable to insert listing for current schema')
}

async function fetchListingsForOwner(table, ownerIds) {
  const ownershipColumns = ['provider_id', 'user_id', 'supplier_id']

  for (const column of ownershipColumns) {
    const res = await supabase
      .from(table)
      .select('*')
      .in(column, ownerIds)
      .order('created_at', { ascending: false })

    if (res.error) {
      if (isSchemaCompatibilityError(res.error)) continue
      throw res.error
    }

    if ((res.data || []).length) return res.data || []
  }

  return []
}

async function updateListingSchemaAware(table, listingId, payload) {
  const candidates = buildInsertCandidates(payload, payload.providerId)
  const allowedSets = [
    ['provider_id', 'name', 'food_type', 'quantity', 'base_price', 'current_price', 'created_at', 'expiry_time', 'discount_time', 'ngo_time', 'listing_mode', 'status'],
    ['provider_id', 'food_name', 'quantity', 'type', 'price', 'original_price', 'expiry_time', 'status', 'created_at'],
    ['provider_id', 'food_name', 'quantity', 'price', 'original_price', 'type', 'expiry_time', 'status', 'created_at'],
    ['provider_id', 'food_name', 'name', 'category', 'food_type', 'quantity', 'price', 'original_price', 'current_price', 'base_price', 'max_discount_price', 'distribution_start_time', 'created_at', 'expiry_time', 'expiry_hours', 'auto_hourly_reduction', 'donation_priority', 'notes', 'image_url', 'listing_mode', 'status'],
  ]

  for (let i = 0; i < candidates.length; i += 1) {
    const mapped = filterPayload(candidates[i], allowedSets[i])
    const updated = await supabase.from(table).update(mapped).eq('id', listingId).select('*').single()
    if (!updated.error) return updated.data

    const missingColumn = String(updated.error?.message || '').toLowerCase().includes('column')
    if (!missingColumn) throw updated.error
  }

  throw new Error('Unable to update listing for current schema')
}

router.get('/', requireAuth, async (req, res) => {
  try {
    const provider = await getProviderByUser(req.auth.userId)
    const table = await resolveFoodTable()
    const ownerIds = buildOwnershipIds(provider, { id: req.auth.userId })
    const items = (await fetchListingsForOwner(table, ownerIds)).map(mapListingRow)
    res.json({ items })
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to fetch listings' })
  }
})

router.get('/history', requireAuth, async (req, res) => {
  try {
    const provider = await getProviderByUser(req.auth.userId)
    const user = await getUserDetails(req.auth.userId)
    const mappedSuppliers = await findProviderSuppliers(provider, user)

    let logs = []
    let source = 'none'

    const mappedSupplierIds = Array.from(new Set((mappedSuppliers || []).flatMap((supplier) => buildSupplierIdCandidates(supplier))))

    if (mappedSupplierIds.length) {
      const bySupplier = await supabase
        .from('food_logs')
        .select('*')
        .in('supplier_id', mappedSupplierIds)
        .order('created_date', { ascending: false })
        .limit(120)

      if (bySupplier.error && !isSchemaCompatibilityError(bySupplier.error)) throw bySupplier.error
      logs = bySupplier.data || []
      if (logs.length) source = 'provider_specific'
    }

    if (!logs.length) {
      const supplierIds = await getSupplierIdsForBusinessType(user.source_of_food_provider)
      if (supplierIds.length) {
        const byBusinessType = await supabase
          .from('food_logs')
          .select('*')
          .in('supplier_id', supplierIds)
          .order('created_date', { ascending: false })
          .limit(120)

        if (byBusinessType.error && !isSchemaCompatibilityError(byBusinessType.error)) throw byBusinessType.error
        logs = byBusinessType.data || []
        if (logs.length) source = 'business_type_fallback'
      }
    }

    res.json({
      items: logs.map(mapFoodLogRow),
      source,
      loggedInProviderName: provider?.business_name || provider?.name || user?.name || user?.username || null,
      providerBusinessName: provider?.business_name || provider?.name || user?.name || user?.username || null,
      providerSourceOfFood: user?.source_of_food_provider || provider?.type || null,
      predictionForSupplierName: mappedSuppliers.map((supplier) => supplier.supplier_name).filter(Boolean).join(', ') || null,
      matchedSupplierId: mappedSuppliers[0]?.supplier_id || null,
      matchedSupplierName: mappedSuppliers.map((supplier) => supplier.supplier_name).filter(Boolean).join(', ') || null,
      matchedSupplierNames: mappedSuppliers.map((supplier) => supplier.supplier_name).filter(Boolean),
      matchedSuppliers: buildSupplierSummary(mappedSuppliers),
    })
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to fetch food log history' })
  }
})

router.put('/history/:id', requireAuth, async (req, res) => {
  try {
    const provider = await getProviderByUser(req.auth.userId)
    const user = await getUserDetails(req.auth.userId)
    const mappedSuppliers = await findProviderSuppliers(provider, user)

    const incomingPrepared = Number(req.body?.prepared_qty)
    const incomingSold = Number(req.body?.sold_qty)
    const incomingPrice = Number(req.body?.price)

    const preparedQty = Number.isFinite(incomingPrepared) ? Math.max(0, Math.round(incomingPrepared)) : null
    const soldQty = Number.isFinite(incomingSold) ? Math.max(0, Math.round(incomingSold)) : null
    const price = Number.isFinite(incomingPrice) ? Math.max(0, Number(incomingPrice.toFixed(2))) : null

    const existing = await supabase
      .from('food_logs')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle()

    if (existing.error) throw existing.error
    if (!existing.data) return res.status(404).json({ error: 'Food log not found' })

    const allowedSupplierIds = new Set()
    const mappedSupplierIds = Array.from(new Set((mappedSuppliers || []).flatMap((supplier) => buildSupplierIdCandidates(supplier))))
    mappedSupplierIds.forEach((id) => allowedSupplierIds.add(id))
    const typeSupplierIds = await getSupplierIdsForBusinessType(user.source_of_food_provider)
    typeSupplierIds.forEach((id) => allowedSupplierIds.add(id))

    if (allowedSupplierIds.size && !allowedSupplierIds.has(existing.data.supplier_id)) {
      return res.status(403).json({ error: 'Cannot edit logs outside your supplier scope' })
    }

    const nextPrepared = preparedQty ?? Number(existing.data.prepared_qty || 0)
    const nextSold = soldQty ?? Number(existing.data.sold_qty || 0)
    const boundedSold = Math.min(nextPrepared, Math.max(0, nextSold))
    const surplusQty = Math.max(0, nextPrepared - boundedSold)
    const wasteQty = Math.min(Number(existing.data.waste_qty || 0), surplusQty)

    const payload = {
      prepared_qty: nextPrepared,
      sold_qty: boundedSold,
      surplus_qty: surplusQty,
      waste_qty: Math.max(0, Math.round(wasteQty)),
    }

    if (price !== null) payload.price = price

    const updated = await supabase
      .from('food_logs')
      .update(payload)
      .eq('id', req.params.id)
      .select('*')
      .single()

    if (updated.error) throw updated.error

    res.json({ item: mapFoodLogRow(updated.data) })
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to update food log' })
  }
})

router.post('/', requireAuth, async (req, res) => {
  try {
    const provider = await getProviderByUser(req.auth.userId)
    const table = await resolveFoodTable()
    const candidates = buildInsertCandidates(req.body, provider.user_id || req.auth.userId)
    const listing = await insertListing(table, candidates)
    void syncListingToFoodLog(provider, await getUserDetails(req.auth.userId), {
      ...req.body,
      reserved: 0,
      currentPrice: listing.current_price ?? listing.currentPrice ?? listing.price ?? req.body.originalPrice ?? 0,
      originalPrice: listing.original_price ?? listing.base_price ?? req.body.originalPrice ?? 0,
      demandScore: req.body?.demandScore,
      wasteQty: req.body?.wasteQty,
      temperature: req.body?.temperature,
      weather: req.body?.weather,
    })
    res.status(201).json({ item: mapListingRow(listing) })
  } catch (error) {
    console.error('[listings/create] failed:', error)
    res.status(500).json({ error: error.message || 'Failed to create listing' })
  }
})

router.put('/:id', requireAuth, async (req, res) => {
  try {
    const provider = await getProviderByUser(req.auth.userId)
    const table = await resolveFoodTable()
    const listing = await updateListingSchemaAware(table, req.params.id, { ...req.body, providerId: provider.user_id || req.auth.userId })
    void syncListingToFoodLog(provider, await getUserDetails(req.auth.userId), {
      ...req.body,
      foodName: req.body?.foodName || listing.food_name || listing.name,
      category: req.body?.category || listing.category || listing.food_type || 'Meals',
      quantity: req.body?.quantity ?? listing.quantity ?? 0,
      currentPrice: req.body?.originalPrice ?? listing.current_price ?? listing.price ?? req.body?.price ?? 0,
      reserved: req.body?.reserved ?? listing.reserved ?? 0,
      distributionStartTime: req.body?.distributionStartTime || listing.distribution_start_time || listing.created_at,
    })
    res.json({ item: mapListingRow(listing) })
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to update listing' })
  }
})

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const table = await resolveFoodTable()
    const deleted = await supabase.from(table).delete().eq('id', req.params.id)
    if (deleted.error) throw deleted.error
    res.json({ ok: true })
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to delete listing' })
  }
})

router.post('/:id/close', requireAuth, async (req, res) => {
  try {
    const table = await resolveFoodTable()
    const attempts = [
      { status: 'EXPIRED' },
      { status: 'closed' },
      { status: 'inactive' },
    ]

    for (const payload of attempts) {
      const updated = await supabase.from(table).update(payload).eq('id', req.params.id)
      if (!updated.error) return res.json({ ok: true, status: payload.status })
    }

    throw new Error('Unable to close listing with available status values')
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to close listing' })
  }
})

module.exports = router
