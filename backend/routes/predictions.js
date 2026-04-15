const express = require('express')
const {
  getSupplierPrediction,
  runBulkPredictions,
  runSupplierPrediction,
} = require('../services/predictionService')

const router = express.Router()

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
