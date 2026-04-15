const fs = require('fs')
const path = require('path')

const outputPath = path.resolve(__dirname, '../data/food_logs_sample_365.csv')

const suppliers = [
  { supplier_id: 'sup-001', supplier_name: 'Golden Crust Bakery', location: 'Chennai', category: 'Bakery' },
  { supplier_id: 'sup-002', supplier_name: 'Saravana Bhavan Outlet', location: 'Chennai', category: 'Restaurant' },
  { supplier_id: 'sup-003', supplier_name: 'Spice Route Kitchen', location: 'Coimbatore', category: 'Catering' },
  { supplier_id: 'sup-004', supplier_name: 'Madurai Meals Hub', location: 'Madurai', category: 'Mess' },
]

const foodCatalog = [
  { food_name: 'Vegetable Biryani', food_category: 'Rice', base_price: 140, tempBias: -0.1 },
  { food_name: 'Idli Sambar', food_category: 'Breakfast', base_price: 60, tempBias: 0.05 },
  { food_name: 'Chapati Kurma', food_category: 'Dinner', base_price: 90, tempBias: -0.03 },
  { food_name: 'Paneer Fried Rice', food_category: 'Rice', base_price: 130, tempBias: -0.08 },
  { food_name: 'Curd Rice', food_category: 'Lunch', base_price: 75, tempBias: 0.08 },
  { food_name: 'Lemon Rice', food_category: 'Lunch', base_price: 70, tempBias: 0.1 },
  { food_name: 'Chicken Biryani', food_category: 'Rice', base_price: 180, tempBias: -0.12 },
  { food_name: 'Bread Pack', food_category: 'Bakery', base_price: 50, tempBias: 0.02 },
  { food_name: 'Egg Puff', food_category: 'Bakery', base_price: 35, tempBias: 0.0 },
  { food_name: 'Veg Noodles', food_category: 'FastFood', base_price: 110, tempBias: -0.07 },
]

const festivals = {
  '2025-01-14': 'Pongal',
  '2025-04-14': 'Tamil New Year',
  '2025-10-20': 'Diwali',
  '2025-03-30': 'Ramzan',
  '2025-12-25': 'Christmas',
  '2026-01-14': 'Pongal',
}

const weatherPatterns = ['Sunny', 'Cloudy', 'Rainy', 'Humid', 'Overcast']
const weekdayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function seededRandom(seed) {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

function pickBySeed(list, seed) {
  return list[Math.floor(seededRandom(seed) * list.length)]
}

function seasonalDemandBoost(dateObj) {
  const month = dateObj.getMonth() + 1
  if ([4, 5].includes(month)) return -0.07
  if ([6, 7, 8].includes(month)) return 0.03
  if ([10, 11, 12].includes(month)) return 0.06
  return 0
}

function temperatureForDate(dateObj, weather, seed) {
  const month = dateObj.getMonth() + 1
  let base = 31
  if ([11, 12, 1].includes(month)) base = 26
  if ([2, 3].includes(month)) base = 29
  if ([6, 7, 8].includes(month)) base = 28
  if ([9, 10].includes(month)) base = 30

  let weatherAdjust = 0
  if (weather === 'Rainy') weatherAdjust = -2
  if (weather === 'Cloudy') weatherAdjust = -1
  if (weather === 'Humid') weatherAdjust = 1

  return Number((base + weatherAdjust + (seededRandom(seed) * 3 - 1.5)).toFixed(1))
}

function round(value) {
  return Math.round(value)
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

function csvEscape(value) {
  const str = String(value ?? '')
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function buildRows() {
  const startDate = new Date('2025-04-16T00:00:00+05:30')
  const rows = []

  for (let i = 0; i < 365; i += 1) {
    const dateObj = new Date(startDate)
    dateObj.setDate(startDate.getDate() + i)

    const isoDate = dateObj.toISOString().slice(0, 10)
    const weekday = weekdayNames[dateObj.getDay()]
    const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6
    const festivalName = festivals[isoDate] || ''
    const isFestival = Boolean(festivalName)

    const supplier = suppliers[i % suppliers.length]
    const item = pickBySeed(foodCatalog, i * 17 + 11)
    const weather = pickBySeed(weatherPatterns, i * 13 + 5)
    const temperature = temperatureForDate(dateObj, weather, i * 19 + 7)

    const supplierTrend = (i / 365) * (supplier.supplier_id === 'sup-001' ? -0.04 : 0.02)
    const weekendDemand = isWeekend ? 0.09 : -0.01
    const festivalDemand = isFestival ? (festivalName === 'Diwali' || festivalName === 'Christmas' ? 0.13 : 0.07) : 0
    const weatherDemand = weather === 'Rainy' ? -0.12 : weather === 'Cloudy' ? -0.03 : weather === 'Humid' ? -0.05 : 0.03
    const seasonBoost = seasonalDemandBoost(dateObj)

    const demandScoreRaw = 0.56 + weekendDemand + festivalDemand + weatherDemand + seasonBoost + supplierTrend + (seededRandom(i * 23 + 3) * 0.2 - 0.1)
    const demandScore = Number(clamp(demandScoreRaw, 0.15, 0.98).toFixed(2))

    const preparedBase = 90 + (supplier.supplier_id === 'sup-003' ? 18 : 0) + (item.food_category === 'Bakery' ? 24 : 0)
    const preparedQty = round(preparedBase + (seededRandom(i * 31 + 1) * 70 - 35) + (isFestival ? 26 : 0) + (isWeekend ? 14 : 0))

    const expectedSoldRatio = clamp(demandScore + (item.tempBias || 0), 0.2, 0.96)
    const soldQty = round(preparedQty * expectedSoldRatio)
    const surplusQty = Math.max(0, preparedQty - soldQty)

    const wasteMultiplier = isFestival ? 0.18 : isWeekend ? 0.14 : 0.11
    const wasteQty = round(surplusQty * clamp(wasteMultiplier + (1 - demandScore) * 0.22 + (weather === 'Rainy' ? 0.08 : 0), 0.06, 0.6))

    const priceNoise = seededRandom(i * 29 + 9) * 14 - 7
    const price = Number((item.base_price + priceNoise + (isFestival ? 5 : 0)).toFixed(2))

    rows.push({
      supplier_id: supplier.supplier_id,
      food_name: item.food_name,
      food_category: item.food_category,
      prepared_qty: preparedQty,
      sold_qty: soldQty,
      surplus_qty: surplusQty,
      price,
      waste_qty: wasteQty,
      created_date: isoDate,
      weekday_name: weekday,
      is_weekend: isWeekend,
      festival_name: festivalName,
      is_festival: isFestival,
      weather,
      temperature,
      demand_score: demandScore,
    })
  }

  return rows
}

function writeCsv() {
  const headers = [
    'supplier_id',
    'food_name',
    'food_category',
    'prepared_qty',
    'sold_qty',
    'surplus_qty',
    'price',
    'waste_qty',
    'created_date',
    'weekday_name',
    'is_weekend',
    'festival_name',
    'is_festival',
    'weather',
    'temperature',
    'demand_score',
  ]

  const rows = buildRows()

  const content = [
    headers.join(','),
    ...rows.map((row) => headers.map((key) => csvEscape(row[key])).join(',')),
  ].join('\n')

  fs.writeFileSync(outputPath, content, 'utf8')
  console.log(`CSV generated: ${outputPath}`)
  console.log(`Rows: ${rows.length}`)
}

writeCsv()
