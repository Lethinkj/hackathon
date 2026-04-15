const cron = require('node-cron')
const { runBulkPredictions } = require('./predictionService')

function startPredictionScheduler() {
  const enabled = String(process.env.PREDICTION_SCHEDULER_ENABLED || 'true').toLowerCase() !== 'false'
  if (!enabled) {
    console.log('[prediction-scheduler] disabled')
    return null
  }

  const expression = process.env.PREDICTION_CRON || '0 3 * * *'
  const timezone = process.env.PREDICTION_TIMEZONE || 'Asia/Kolkata'

  const task = cron.schedule(expression, async () => {
    try {
      const results = await runBulkPredictions()
      console.log(`[prediction-scheduler] generated ${results.length} predictions`)
    } catch (error) {
      console.error('[prediction-scheduler] failed', error)
    }
  }, {
    scheduled: true,
    timezone,
  })

  // Warm start so dashboards show values immediately after the server boots.
  runBulkPredictions().catch((error) => {
    console.error('[prediction-scheduler] warm-start failed', error)
  })

  console.log(`[prediction-scheduler] scheduled with "${expression}" (${timezone})`)
  return task
}

module.exports = { startPredictionScheduler }
