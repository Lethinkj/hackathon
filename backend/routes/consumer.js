const express = require('express')
const supabase = require('../supabaseClient')

const router = express.Router()

async function resolveFoodTable() {
  const candidates = ['foods', 'food']
  for (const table of candidates) {
    const probe = await supabase.from(table).select('id').limit(1)
    if (!probe.error) return table
  }
  throw new Error('No food table found')
}

function mapFoodRow(row, providerName) {
  const currentPrice = Number(row.current_price ?? row.price ?? 0)
  return {
    id: row.id,
    providerName,
    foodName: row.name || row.food_name || 'Food',
    qty: Number(row.quantity || 0),
    pickupTime: row.distribution_start_time || row.created_at || new Date().toISOString(),
    discountedPrice: currentPrice,
    expiry: row.expiry_time || null,
    reserveAvailable: String(row.status || '').toLowerCase() !== 'expired',
  }
}

router.get('/available-foods', async (_req, res) => {
  try {
    const table = await resolveFoodTable()
    const foodsRes = await supabase.from(table).select('*').order('created_at', { ascending: false }).limit(200)
    if (foodsRes.error) throw foodsRes.error

    const activeFoods = (foodsRes.data || []).filter((row) => {
      const status = String(row.status || '').toLowerCase()
      return ['available', 'sell', 'discount', 'active'].includes(status)
    })

    const providerIds = [...new Set(activeFoods.map((row) => row.provider_id).filter(Boolean))]
    const providerRes = providerIds.length
      ? await supabase.from('providers').select('*').in('id', providerIds)
      : { data: [] }

    if (providerRes.error) throw providerRes.error

    const providerMap = new Map((providerRes.data || []).map((provider) => [provider.id, provider.name || provider.business_name || 'Provider']))
    const items = activeFoods.map((row) => mapFoodRow(row, providerMap.get(row.provider_id) || 'Provider'))

    res.json({ count: items.length, items })
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to fetch available foods' })
  }
})

router.post('/preorder', async (req, res) => {
  try {
    const { listingId, userId, pickupTime } = req.body
    if (!listingId || !userId) {
      return res.status(400).json({ error: 'listingId and userId are required' })
    }

    const orderRes = await supabase
      .from('orders')
      .insert({
        food_id: listingId,
        user_id: userId,
        pickup_time: pickupTime || new Date(Date.now() + 45 * 60 * 1000).toISOString(),
        status: 'pending',
      })
      .select('*')
      .single()

    if (orderRes.error) throw orderRes.error

    res.status(201).json({ order: orderRes.data })
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to create preorder' })
  }
})

module.exports = router
