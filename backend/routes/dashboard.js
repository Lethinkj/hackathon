const express = require('express')
const supabase = require('../supabaseClient')
const { requireAuth } = require('../middleware/auth')

const router = express.Router()

function dayLabel(date) {
  return date.toLocaleDateString('en-US', { weekday: 'short' })
}

function trendTemplate() {
  const points = []
  for (let i = 6; i >= 0; i -= 1) {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
    points.push({ key: date.toISOString().slice(0, 10), label: dayLabel(date), value: 0 })
  }
  return points
}

function sum(values) {
  return values.reduce((acc, value) => acc + Number(value || 0), 0)
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

function mapByDay(items, valueGetter, dateGetter) {
  const trend = trendTemplate()
  const map = new Map(trend.map((item) => [item.key, item]))

  for (const item of items) {
    const iso = String(dateGetter(item) || '').slice(0, 10)
    const target = map.get(iso)
    if (!target) continue
    target.value += Number(valueGetter(item) || 0)
  }

  return trend.map(({ label, value }) => ({ label, value }))
}

function emptyDashboardStats() {
  const emptyTrend = trendTemplate().map(({ label }) => ({ label, value: 0 }))
  return {
    totalListings: 0,
    predictedSurplusToday: 0,
    predictedSurplus: 0,
    preOrders: 0,
    donatedCount: 0,
    revenueRecovered: 0,
    wastePrevented: 0,
    weeklySurplusTrend: emptyTrend,
    ordersTrend: emptyTrend,
    donationsTrend: emptyTrend,
  }
}

async function getProvider(userId) {
  const providerRes = await supabase
    .from('providers')
    .select('*')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle()

  if (providerRes.error && !isSchemaCompatibilityError(providerRes.error)) {
    throw providerRes.error
  }

  if (!providerRes.data) {
    return { id: userId, user_id: userId }
  }

  return providerRes.data
}

async function safeTableLookup(table, id) {
  const candidateColumns = ['provider_id', 'supplier_id', 'user_id']

  for (const column of candidateColumns) {
    const res = await supabase
      .from(table)
      .select('*')
      .eq(column, id)
      .order('created_at', { ascending: false })

    if (!res.error) return res.data || []
    if (!isSchemaCompatibilityError(res.error)) throw res.error
  }

  return []
}

async function getListings(providerId) {
  const candidates = ['foods', 'food']

  for (const table of candidates) {
    const rows = await safeTableLookup(table, providerId)
    if (rows.length) return rows
  }

  return []
}

async function safeSelectIn(table, column, ids) {
  if (!ids.length) return []

  const res = await supabase.from(table).select('*').in(column, ids)
  if (res.error) {
    if (isSchemaCompatibilityError(res.error)) return []
    throw res.error
  }

  return res.data || []
}

router.get('/stats', requireAuth, async (req, res) => {
  try {
    const provider = await getProvider(req.auth.userId)
    const listings = await getListings(provider.id)
    const listingIds = listings.map((item) => item.id).filter(Boolean)

    const orders = await safeSelectIn('orders', 'food_id', listingIds)
    const donations = await safeSelectIn('donations', 'food_id', listingIds)

    const predictionsRes = await supabase
      .from('predictions')
      .select('*')
      .in('supplier_id', [provider.id, req.auth.userId])
      .eq('prediction_date', new Date().toISOString().slice(0, 10))

    const predictions = predictionsRes.error ? [] : (predictionsRes.data || [])

    const revenueRecovered = sum(listings.map((item) => Number(item.current_price ?? item.price ?? 0) * Number(item.quantity || 0)))
    const donatedCount = donations.length || listings.filter((item) => String(item.status || '').toLowerCase().includes('donat')).length
    const preOrders = orders.filter((order) => ['pending', 'accepted', 'reserved'].includes(String(order.status || '').toLowerCase())).length
    const wastePrevented = sum(listings.map((item) => item.quantity || 0))
    const predictedSurplusToday = Math.round(sum(predictions.map((item) => item.predicted_surplus || 0)))

    res.json({
      totalListings: listings.length,
      predictedSurplusToday,
      predictedSurplus: predictedSurplusToday,
      preOrders,
      donatedCount,
      revenueRecovered: Math.round(revenueRecovered),
      wastePrevented: Math.round(wastePrevented),
      weeklySurplusTrend: mapByDay(listings, (row) => row.quantity || 0, (row) => row.created_at),
      ordersTrend: mapByDay(orders, () => 1, (row) => row.created_at || row.pickup_time),
      donationsTrend: mapByDay(donations, () => 1, (row) => row.created_at),
    })
  } catch (error) {
    console.error('[dashboard/stats] failed:', error)
    res.status(200).json(emptyDashboardStats())
  }
})

module.exports = router
