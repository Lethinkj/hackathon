const WEEKDAY_INDEX = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
}

const WEATHER_FACTORS = {
  clear: 1,
  sunny: 1.02,
  hot: 0.92,
  cloudy: 0.98,
  overcast: 0.97,
  humid: 0.95,
  rainy: 0.88,
  drizzle: 0.9,
  storm: 0.84,
  monsoon: 0.86,
  windy: 0.99,
  foggy: 0.96,
}

function toNumber(value, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function safeText(value, fallback = '') {
  return String(value ?? fallback).trim()
}

function normalizeDayName(value, fallbackDate) {
  const raw = safeText(value, '').toLowerCase()
  if (raw && WEEKDAY_INDEX[raw] !== undefined) return raw
  if (fallbackDate) {
    return ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][new Date(fallbackDate).getDay()]
  }
  return 'monday'
}

function normalizeWeather(weather) {
  const raw = safeText(weather, 'clear').toLowerCase()
  if (!raw) return 'clear'
  if (raw.includes('rain')) return 'rainy'
  if (raw.includes('cloud')) return 'cloudy'
  if (raw.includes('hot')) return 'hot'
  if (raw.includes('humid')) return 'humid'
  if (raw.includes('storm')) return 'storm'
  if (raw.includes('fog')) return 'foggy'
  if (raw.includes('wind')) return 'windy'
  return raw
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

function mean(values) {
  if (!values.length) return 0
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function weightedMean(values) {
  if (!values.length) return 0
  const weights = values.map((_, index) => index + 1)
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0)
  const total = values.reduce((sum, value, index) => sum + value * weights[index], 0)
  return total / totalWeight
}

function linearRegression(points) {
  if (!points.length) {
    return { slope: 0, intercept: 0 }
  }

  const xs = points.map((point) => point.x)
  const ys = points.map((point) => point.y)
  const xMean = mean(xs)
  const yMean = mean(ys)

  let numerator = 0
  let denominator = 0

  for (let index = 0; index < points.length; index += 1) {
    numerator += (xs[index] - xMean) * (ys[index] - yMean)
    denominator += (xs[index] - xMean) ** 2
  }

  const slope = denominator === 0 ? 0 : numerator / denominator
  const intercept = yMean - slope * xMean

  return { slope, intercept }
}

function mape(actual, predicted) {
  const paired = actual
    .map((value, index) => ({ actual: value, predicted: predicted[index] }))
    .filter((entry) => entry.actual > 0)

  if (!paired.length) return 1

  const total = paired.reduce((sum, entry) => sum + Math.abs((entry.actual - entry.predicted) / entry.actual), 0)
  return total / paired.length
}

function getAction(predictedSurplus) {
  if (predictedSurplus > 80) return 'Reduce Cooking Quantity'
  if (predictedSurplus > 50) return 'Donate to NGO'
  if (predictedSurplus > 30) return 'Offer Discount'
  return 'Monitor Demand'
}

function buildDailySeries(rows) {
  const map = new Map()

  for (const row of rows) {
    const createdDate = row.created_date || row.createdAt || row.created_at
    if (!createdDate) continue

    const key = String(createdDate).slice(0, 10)
    const dayName = normalizeDayName(row.weekday_name, key)
    const surplus = toNumber(
      row.surplus_qty ?? row.surplusQty ?? Math.max(0, toNumber(row.prepared_qty) - toNumber(row.sold_qty) - toNumber(row.waste_qty))
    )
    const demandScore = toNumber(row.demand_score ?? row.demandScore, 0)
    const preparedQty = toNumber(row.prepared_qty ?? row.preparedQty)
    const soldQty = toNumber(row.sold_qty ?? row.soldQty)
    const wasteQty = toNumber(row.waste_qty ?? row.wasteQty)
    const price = toNumber(row.price)
    const temperature = row.temperature === null || row.temperature === undefined ? null : toNumber(row.temperature)
    const festivalName = safeText(row.festival_name ?? row.festivalName, '')
    const weather = normalizeWeather(row.weather)
    const isFestival = Boolean(row.is_festival ?? row.isFestival ?? festivalName)
    const isWeekend = row.is_weekend !== undefined ? Boolean(row.is_weekend) : ['saturday', 'sunday'].includes(dayName)

    const current = map.get(key) || {
      created_date: key,
      weekday_name: dayName,
      surplus_qty: 0,
      prepared_qty: 0,
      sold_qty: 0,
      waste_qty: 0,
      demand_score_sum: 0,
      demand_score_count: 0,
      price_sum: 0,
      temperature_sum: 0,
      temperature_count: 0,
      festival_name: festivalName,
      weather,
      is_festival: isFestival,
      is_weekend: isWeekend,
    }

    current.surplus_qty += surplus
    current.prepared_qty += preparedQty
    current.sold_qty += soldQty
    current.waste_qty += wasteQty
    current.demand_score_sum += demandScore
    current.demand_score_count += 1
    current.price_sum += price
    if (temperature !== null) {
      current.temperature_sum += temperature
      current.temperature_count += 1
    }

    if (!current.festival_name && festivalName) current.festival_name = festivalName
    if (!current.weather && weather) current.weather = weather
    current.is_festival = current.is_festival || isFestival
    current.is_weekend = current.is_weekend || isWeekend

    map.set(key, current)
  }

  return [...map.values()]
    .map((row) => ({
      ...row,
      demand_score: row.demand_score_sum / Math.max(1, row.demand_score_count),
      temperature: row.temperature_count ? row.temperature_sum / row.temperature_count : null,
      total_events: row.prepared_qty || row.sold_qty || row.waste_qty || row.surplus_qty,
    }))
    .sort((a, b) => String(a.created_date).localeCompare(String(b.created_date)))
}

function getWeatherFactor(weather) {
  const normalized = normalizeWeather(weather)
  return WEATHER_FACTORS[normalized] || 1
}

function getFestivalFactor(series, festivalName) {
  const festival = safeText(festivalName, '').toLowerCase()
  if (!festival) return 1

  const festivalRows = series.filter((row) => safeText(row.festival_name, '').toLowerCase() === festival)
  if (!festivalRows.length) {
    const staticFactors = {
      pongal: 0.9,
      'tamil new year': 0.95,
      diwali: 1.1,
      ramzan: 0.92,
      christmas: 1.05,
    }
    return staticFactors[festival] || 1
  }

  const festivalAvg = mean(festivalRows.map((row) => row.surplus_qty))
  const baselineRows = series.filter((row) => safeText(row.festival_name, '').toLowerCase() !== festival)
  const baselineAvg = mean(baselineRows.map((row) => row.surplus_qty)) || 1
  return clamp(festivalAvg / baselineAvg, 0.75, 1.25)
}

function getWeekdayFactor(series, targetWeekday) {
  const targetRows = series.filter((row) => row.weekday_name === targetWeekday)
  const targetAvg = mean(targetRows.map((row) => row.surplus_qty))
  const overallAvg = mean(series.map((row) => row.surplus_qty)) || 1
  return clamp(targetAvg / overallAvg, 0.75, 1.25)
}

function getSupplierTrendFactor(series) {
  if (series.length < 14) return 1

  const last7 = series.slice(-7).map((row) => row.surplus_qty)
  const prev7 = series.slice(-14, -7).map((row) => row.surplus_qty)
  const lastAvg = mean(last7)
  const prevAvg = mean(prev7) || 1
  return clamp(lastAvg / prevAvg, 0.8, 1.2)
}

function backtestConfidence(series) {
  if (series.length < 8) {
    return { confidence: clamp(series.length / 8, 0.2, 0.6), accuracy: 0.45, error: 1 }
  }

  const actual = []
  const predicted = []

  for (let index = 7; index < series.length; index += 1) {
    const lookback = series.slice(Math.max(0, index - 7), index).map((row) => row.surplus_qty)
    const target = series[index].surplus_qty
    actual.push(target)
    predicted.push(weightedMean(lookback))
  }

  const error = mape(actual, predicted)
  const accuracy = clamp(1 - error, 0.15, 0.98)
  const confidence = clamp(accuracy * 0.7 + clamp(series.length / 60, 0.2, 1) * 0.3, 0.2, 0.98)

  return { confidence, accuracy, error }
}

function buildFeatureForecast(series, options = {}) {
  const numericSeries = series.map((row, index) => ({ x: index + 1, y: row.surplus_qty }))
  const last7 = series.slice(-7).map((row) => row.surplus_qty)
  const last30 = series.slice(-30).map((row) => row.surplus_qty)
  const movingAverage = mean(last7)
  const weightedAverage = weightedMean(last7)
  const regression = linearRegression(numericSeries)
  const regressionForecast = regression.intercept + regression.slope * (series.length + 1)
  const seasonalWeekday = normalizeDayName(options.weekday_name, options.prediction_date)
  const weekdayFactor = getWeekdayFactor(series, seasonalWeekday)
  const festivalFactor = getFestivalFactor(series, options.festival_name)
  const weatherFactor = getWeatherFactor(options.weather || series.at(-1)?.weather)
  const supplierTrendFactor = getSupplierTrendFactor(series)
  const demandWindow = last30.length ? mean(last30) : movingAverage
  const demandFactor = clamp(1 + ((0.5 - mean(series.slice(-30).map((row) => row.demand_score || 0.5))) * 0.35), 0.8, 1.2)

  const blendedBase = (
    movingAverage * 0.34 +
    weightedAverage * 0.26 +
    regressionForecast * 0.2 +
    demandWindow * 0.2
  )

  const adjusted = blendedBase * weekdayFactor * festivalFactor * weatherFactor * supplierTrendFactor * demandFactor
  const forecast = Math.max(0, Math.round(adjusted))
  const confidenceBits = backtestConfidence(series)

  const volatility = series.length > 1
    ? clamp(1 - (Math.abs(series.at(-1).surplus_qty - mean(series.slice(-7).map((row) => row.surplus_qty))) / (mean(series.slice(-7).map((row) => row.surplus_qty)) + 1)), 0.2, 1)
    : 0.5

  const confidenceScore = Math.round(clamp(
    (confidenceBits.confidence * 0.55 + confidenceBits.accuracy * 0.25 + volatility * 0.2) * 100,
    25,
    98,
  ))

  return {
    predicted_surplus: forecast,
    confidence_score: confidenceScore,
    suggested_action: getAction(forecast),
    feature_breakdown: {
      moving_average: Math.round(movingAverage),
      weighted_average: Math.round(weightedAverage),
      regression_forecast: Math.round(regressionForecast),
      weekday_factor: Number(weekdayFactor.toFixed(2)),
      festival_factor: Number(festivalFactor.toFixed(2)),
      weather_factor: Number(weatherFactor.toFixed(2)),
      supplier_trend_factor: Number(supplierTrendFactor.toFixed(2)),
      demand_factor: Number(demandFactor.toFixed(2)),
    },
    model_metrics: {
      sample_size: series.length,
      mape: Number(confidenceBits.error.toFixed(3)),
      accuracy: Number(confidenceBits.accuracy.toFixed(3)),
    },
  }
}

function buildTimeSeries(rows) {
  return rows.map((row, index) => ({
    x: index + 1,
    y: row.surplus_qty,
    date: row.created_date,
    weekday_name: row.weekday_name,
    festival_name: row.festival_name,
    weather: row.weather,
    demand_score: row.demand_score,
  }))
}

module.exports = {
  buildDailySeries,
  buildFeatureForecast,
  buildTimeSeries,
  getAction,
  getWeatherFactor,
  getFestivalFactor,
  getWeekdayFactor,
  getSupplierTrendFactor,
  normalizeWeather,
  normalizeDayName,
}
