const supabase = require('../supabaseClient')
const {
  buildDailySeries,
  buildFeatureForecast,
  buildTimeSeries,
  normalizeDayName,
  normalizeWeather,
} = require('./predictionEngine')

const TABLE_CANDIDATES = {
  foods: ['foods', 'food'],
}

function normalizeFrontendRows(rows, supplierId) {
  return rows.map((item, index) => {
    const quantity = Number(item.qty ?? item.quantity ?? item.prepared_qty ?? 0)
    const status = String(item.status || 'available').toLowerCase()
    const createdDateInput = item.created_date || item.createdDate
    const createdAt = item.created_at
      || item.createdAt
      || (createdDateInput ? `${String(createdDateInput).slice(0, 10)}T12:00:00.000Z` : null)
      || new Date(Date.now() - (rows.length - index) * 24 * 60 * 60 * 1000).toISOString()
    const createdDate = createdDateInput ? String(createdDateInput).slice(0, 10) : String(createdAt).slice(0, 10)
    const preparedQty = quantity
    const soldQty = Number(item.sold_qty ?? (status === 'sold' ? quantity : Math.round(quantity * 0.3)))
    const wasteQty = Number(item.waste_qty ?? (status === 'donated' ? quantity : Math.round(quantity * 0.05)))
    const surplusQty = Number(item.surplus_qty ?? Math.max(0, preparedQty - soldQty - wasteQty))
    const weekdayName = normalizeDayName(item.weekday_name || item.weekday, createdDate)

    return {
      supplier_id: item.supplier_id || supplierId,
      food_name: item.food_name || item.name || 'Listing',
      food_category: item.food_category || item.type || 'meal',
      prepared_qty: preparedQty,
      sold_qty: soldQty,
      surplus_qty: surplusQty,
      price: Number(item.price ?? item.base ?? item.original_price ?? 0),
      waste_qty: wasteQty,
      created_date: createdDate,
      weekday_name: weekdayName,
      is_weekend: item.is_weekend ?? ['saturday', 'sunday'].includes(weekdayName),
      festival_name: item.festival_name || '',
      is_festival: item.is_festival ?? false,
      weather: item.weather || 'clear',
      temperature: item.temperature ?? null,
      demand_score: Number(item.demand_score ?? item.demandScore ?? 0.55),
      created_at: createdAt,
    }
  })
}

async function queryFirstWorkingTable(tableNames, selectQuery) {
  let lastError = null

  for (const tableName of tableNames) {
    const response = await selectQuery(tableName)
    if (!response.error) {
      return { ...response, tableName }
    }
    lastError = response.error
  }

  return { data: null, error: lastError, tableName: tableNames[0] }
}

async function fetchFoodRowsForSupplier(supplierId) {
  const { data: logs } = await supabase
    .from('food_logs')
    .select('*')
    .eq('supplier_id', supplierId)
    .order('created_date', { ascending: true })

  if (logs?.length) return logs

  const foodRowsResult = await queryFirstWorkingTable(TABLE_CANDIDATES.foods, async (table) =>
    supabase
      .from(table)
      .select('*')
      .eq('provider_id', supplierId)
      .order('created_at', { ascending: true })
  )

  const foods = foodRowsResult.data || []
  return foods.map((food, index) => {
    const createdAt = food.created_at || food.createdAt || new Date(Date.now() - (foods.length - index) * 24 * 60 * 60 * 1000).toISOString()
    const quantity = Number(food.quantity || 0)
    const status = String(food.status || 'available').toLowerCase()
    const preparedQty = quantity
    const soldQty = status === 'sold' ? quantity : Math.round(quantity * 0.35)
    const wasteQty = status === 'donated' ? quantity : Math.max(0, Math.round(quantity * (status === 'available' ? 0.1 : 0.05)))
    const surplusQty = Math.max(0, preparedQty - soldQty - wasteQty)
    const createdDate = String(createdAt).slice(0, 10)
    const weekdayName = normalizeDayName(food.weekday_name, createdDate)
    const isWeekend = ['saturday', 'sunday'].includes(weekdayName)

    return {
      id: food.id,
      supplier_id: supplierId,
      food_name: food.food_name || food.foodName || 'Listing',
      food_category: food.type || food.food_category || 'meal',
      prepared_qty: preparedQty,
      sold_qty: soldQty,
      surplus_qty: surplusQty,
      price: Number(food.price || food.original_price || 0),
      waste_qty: wasteQty,
      created_date: createdDate,
      weekday_name: weekdayName,
      is_weekend: isWeekend,
      festival_name: '',
      is_festival: false,
      weather: normalizeWeather(food.weather || 'clear'),
      temperature: null,
      demand_score: Number(food.demand_score || 0.55),
      created_at: createdAt,
    }
  })
}

async function fetchAllSupplierIds() {
  const supplierIds = new Set()

  const { data: suppliers } = await supabase.from('suppliers').select('supplier_id')
  suppliers?.forEach((row) => supplierIds.add(row.supplier_id))

  const { data: foodProviders } = await queryFirstWorkingTable(TABLE_CANDIDATES.foods, async (table) =>
    supabase.from(table).select('provider_id').order('created_at', { ascending: false })
  )

  foodProviders?.forEach((row) => {
    if (row.provider_id) supplierIds.add(row.provider_id)
  })

  const { data: foodLogSuppliers } = await supabase
    .from('food_logs')
    .select('supplier_id')
    .not('supplier_id', 'is', null)

  foodLogSuppliers?.forEach((row) => {
    if (row.supplier_id) supplierIds.add(row.supplier_id)
  })

  return [...supplierIds]
}

async function upsertPredictionRow(supplierId, forecast, predictionDate) {
  const payload = {
    supplier_id: supplierId,
    prediction_date: predictionDate,
    predicted_surplus: forecast.predicted_surplus,
    confidence_score: forecast.confidence_score,
    suggested_action: forecast.suggested_action,
  }

  const { data, error } = await supabase
    .from('predictions')
    .upsert(payload, { onConflict: 'supplier_id,prediction_date' })
    .select()
    .single()

  if (error) throw error
  return data
}

async function runSupplierPrediction(supplierId, options = {}) {
  const rows = Array.isArray(options.historicalRows) && options.historicalRows.length
    ? normalizeFrontendRows(options.historicalRows, supplierId)
    : await fetchFoodRowsForSupplier(supplierId)
  const dailySeries = buildDailySeries(rows)

  if (!dailySeries.length) {
    return {
      supplier_id: supplierId,
      prediction_date: options.prediction_date || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      predicted_surplus: 0,
      confidence_score: 25,
      suggested_action: 'Monitor Demand',
      feature_breakdown: {},
      model_metrics: { sample_size: 0, mape: 1, accuracy: 0 },
      time_series: [],
    }
  }

  const predictionDate = options.prediction_date || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const forecast = buildFeatureForecast(dailySeries, {
    prediction_date: predictionDate,
    weekday_name: options.weekday_name || new Date(`${predictionDate}T12:00:00Z`).toLocaleDateString('en-US', { weekday: 'long' }),
    festival_name: options.festival_name || '',
    weather: options.weather || dailySeries.at(-1)?.weather || 'clear',
  })

  const saved = await upsertPredictionRow(supplierId, forecast, predictionDate)

  return {
    supplier_id: supplierId,
    prediction_date: predictionDate,
    ...forecast,
    saved_prediction: saved,
    last_updated: saved.created_at,
    time_series: buildTimeSeries(dailySeries),
    historical_snapshot: {
      last_7_avg: Math.round(dailySeries.slice(-7).reduce((sum, row) => sum + row.surplus_qty, 0) / Math.max(1, Math.min(7, dailySeries.length))),
      last_30_avg: Math.round(dailySeries.slice(-30).reduce((sum, row) => sum + row.surplus_qty, 0) / Math.max(1, Math.min(30, dailySeries.length))),
      total_logs: dailySeries.length,
    },
  }
}

async function runBulkPredictions(options = {}) {
  const supplierIds = options.supplierIds?.length ? options.supplierIds : await fetchAllSupplierIds()
  const results = []

  for (const supplierId of supplierIds) {
    try {
      const prediction = await runSupplierPrediction(supplierId, options)
      results.push(prediction)
    } catch (error) {
      results.push({ supplier_id: supplierId, error: error.message })
    }
  }

  return results
}

async function getSupplierPrediction(supplierId, options = {}) {
  const { data: latestPrediction } = await supabase
    .from('predictions')
    .select('*')
    .eq('supplier_id', supplierId)
    .order('prediction_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const currentPrediction = await runSupplierPrediction(supplierId, options)

  return {
    supplier_id: supplierId,
    latest_prediction: latestPrediction || null,
    current_prediction: currentPrediction,
  }
}

async function getLiveSurplus() {
  const { data, error } = await queryFirstWorkingTable(TABLE_CANDIDATES.foods, async (table) =>
    supabase
      .from(table)
      .select('*')
      .eq('status', 'available')
      .order('created_at', { ascending: false })
      .limit(40)
  )

  if (error) throw error
  return data || []
}

async function getAnalyticsTrends() {
  const [weeklyTrend, festivalAnalysis, topWaste, latestPredictions] = await Promise.all([
    supabase.rpc('weekly_surplus_trend'),
    supabase.rpc('festival_waste_analysis'),
    supabase.rpc('top_waste_food_items'),
    supabase.from('predictions').select('*').order('created_at', { ascending: false }).limit(20),
  ])

  return {
    weeklyTrend: weeklyTrend.data || [],
    festivalAnalysis: festivalAnalysis.data || [],
    topWaste: topWaste.data || [],
    latestPredictions: latestPredictions.data || [],
  }
}

async function getSeasonalAnalytics() {
  const [monthlyTrend, latestPredictions] = await Promise.all([
    supabase.rpc('monthly_seasonal_trend'),
    supabase.from('predictions').select('*').order('created_at', { ascending: false }).limit(20),
  ])

  return {
    monthlyTrend: monthlyTrend.data || [],
    latestPredictions: latestPredictions.data || [],
  }
}

module.exports = {
  fetchFoodRowsForSupplier,
  fetchAllSupplierIds,
  getAnalyticsTrends,
  getLiveSurplus,
  getSeasonalAnalytics,
  getSupplierPrediction,
  runBulkPredictions,
  runSupplierPrediction,
}
