const express = require('express')
const { getLiveSurplus } = require('../services/predictionService')

const router = express.Router()

router.get('/live', async (_req, res) => {
  try {
    const liveSurplus = await getLiveSurplus()
    res.json({ count: liveSurplus.length, items: liveSurplus })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
