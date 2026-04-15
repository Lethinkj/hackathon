const express = require('express')
const { getAnalyticsTrends, getSeasonalAnalytics } = require('../services/predictionService')
const supabase = require('../supabaseClient')

const router = express.Router()

router.get('/trends', async (_req, res) => {
  try {
    const [trends, livePredictions] = await Promise.all([
      getAnalyticsTrends(),
      supabase.from('predictions').select('*').order('created_at', { ascending: false }).limit(20),
    ])

    res.json({
      ...trends,
      livePredictions: livePredictions.data || [],
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/seasonal', async (_req, res) => {
  try {
    const seasonal = await getSeasonalAnalytics()
    res.json(seasonal)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
