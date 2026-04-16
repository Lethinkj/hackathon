const fs = require('fs')
const path = require('path')
const { v4: uuidv4 } = require('uuid')

const suppliersData = [
  { name: 'Golden Crust Bakery', location: 'Chennai', category: 'Restaurants and Cafes', basePrepare: 92, weekendMult: 1.08, festivalMult: 1.06 },
  { name: 'Saravana Bhavan Outlet', location: 'Chennai', category: 'Restaurants and Cafes', basePrepare: 118, weekendMult: 1.32, festivalMult: 1.17 },
  { name: 'Spice Route Kitchen', location: 'Coimbatore', category: 'Caterers & Hotels', basePrepare: 172, weekendMult: 1.48, festivalMult: 1.52 },
  { name: 'Madurai Meals Hub', location: 'Madurai', category: 'Schools & Institutions', basePrepare: 88, weekendMult: 0.82, festivalMult: 0.93 },
  { name: 'Grand Celebration Hotel', location: 'Bangalore', category: 'Weddings and Parties', basePrepare: 305, weekendMult: 2.35, festivalMult: 2.95 },
  { name: 'Corporate Catering Solutions', location: 'Hyderabad', category: 'Corporate Offices & Canteens', basePrepare: 214, weekendMult: 0.58, festivalMult: 1.74 },
  { name: 'Royal Events Catering', location: 'Chennai', category: 'Caterers & Hotels', basePrepare: 238, weekendMult: 1.86, festivalMult: 2.42 },
]

// Generate deterministic UUIDs based on supplier names (so they persist across runs)
function getSupplierUUID(name) {
  // Use a consistent namespace UUID for SupplyLink
  const namespace = '550e8400-e29b-41d4-a716-446655440000'
  const { v5 } = require('uuid')
  try {
    return v5(name, namespace)
  } catch {
    // Fallback if v5 is not available
    return uuidv4()
  }
}

console.log('📋 Generating supplier UUIDs and CSV...\n')

const suppliers = suppliersData.map(s => ({
  ...s,
  uuid: getSupplierUUID(s.name)
}))

console.log('Generated UUIDs:')
suppliers.forEach(s => {
  console.log(`  ${s.name}: ${s.uuid}`)
})

// Generate CSV
const outputPath = path.resolve(__dirname, '../data/food_logs_sample_365.csv')
const readableOutputPath = path.resolve(__dirname, '../data/food_logs_sample_365_readable.csv')

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
  { food_name: 'Butter Chicken', food_category: 'Main', base_price: 220, tempBias: -0.15 },
  { food_name: 'Tandoori Chicken', food_category: 'Main', base_price: 250, tempBias: -0.12 },
  { food_name: 'Mutton Curry', food_category: 'Main', base_price: 280, tempBias: -0.08 },
  { food_name: 'Biryani Mix Platter', food_category: 'Rice', base_price: 350, tempBias: -0.18 },
  { food_name: 'Wedding Sweets Mix', food_category: 'Dessert', base_price: 180, tempBias: 0.05 },
  { food_name: 'Office Lunch Tray', food_category: 'Meal', base_price: 120, tempBias: -0.06 },
  { food_name: 'Corporate Buffet Pack', food_category: 'Meal', base_price: 400, tempBias: -0.04 },
  { food_name: 'School Meal Set', food_category: 'Meal', base_price: 80, tempBias: 0.02 },
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

    const supplierTrend = (i / 365) * (supplier.uuid === suppliers[0].uuid ? -0.04 : 0.02)
    const weekendDemand = isWeekend ? 0.09 : -0.01
    const festivalDemand = isFestival ? (festivalName === 'Diwali' || festivalName === 'Christmas' ? 0.13 : 0.07) : 0
    const weatherDemand = weather === 'Rainy' ? -0.12 : weather === 'Cloudy' ? -0.03 : weather === 'Humid' ? -0.05 : 0.03
    const seasonBoost = seasonalDemandBoost(dateObj)

    const demandScoreRaw = 0.56 + weekendDemand + festivalDemand + weatherDemand + seasonBoost + supplierTrend + (seededRandom(i * 23 + 3) * 0.2 - 0.1)
    const demandScore = Number(clamp(demandScoreRaw, 0.15, 0.98).toFixed(2))

    let preparedBase = supplier.basePrepare
    if (isWeekend) preparedBase *= supplier.weekendMult
    if (isFestival) preparedBase *= supplier.festivalMult

    const preparedQty = round(preparedBase + (seededRandom(i * 31 + 1) * 70 - 35))

    const expectedSoldRatio = clamp(demandScore + (item.tempBias || 0), 0.2, 0.96)
    const soldQty = round(preparedQty * expectedSoldRatio)
    const surplusQty = Math.max(0, preparedQty - soldQty)

    const wasteMultiplier = isFestival ? 0.18 : isWeekend ? 0.14 : 0.11
    const wasteQty = round(surplusQty * clamp(wasteMultiplier + (1 - demandScore) * 0.22 + (weather === 'Rainy' ? 0.08 : 0), 0.06, 0.6))

    const priceNoise = seededRandom(i * 29 + 9) * 14 - 7
    const price = Number((item.base_price + priceNoise + (isFestival ? 5 : 0)).toFixed(2))

    rows.push({
      supplier_id: supplier.uuid,
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
console.log(`\n✅ CSV generated: ${outputPath}`)
console.log(`✓ Total rows: ${rows.length}`)
console.log(`✓ Suppliers: ${suppliers.map(s => s.name).join(', ')}\n`)

const supplierMetaById = suppliers.reduce((acc, supplier) => {
  acc[supplier.uuid] = supplier
  return acc
}, {})

const readableHeaders = [
  'supplier_id',
  'supplier_name',
  'business_type',
  ...headers.filter((header) => header !== 'supplier_id'),
]

const readableContent = [
  readableHeaders.join(','),
  ...rows.map((row) => {
    const meta = supplierMetaById[row.supplier_id] || {}
    const expanded = {
      supplier_id: row.supplier_id,
      supplier_name: meta.name || '',
      business_type: meta.category || '',
      ...row,
    }
    return readableHeaders.map((key) => csvEscape(expanded[key])).join(',')
  }),
].join('\n')

fs.writeFileSync(readableOutputPath, readableContent, 'utf8')
console.log(`✅ Readable CSV generated: ${readableOutputPath}`)

// Create SQL insert statements for suppliers
const sqlStatements = suppliers.map(s => 
  `INSERT INTO suppliers (supplier_id, supplier_name, location, category) VALUES ('${s.uuid}', '${s.name.replace(/'/g, "''")}', '${s.location}', '${s.category}') ON CONFLICT (supplier_id) DO NOTHING;`
).join('\n')

const sqlPath = path.resolve(__dirname, '../data/insert_suppliers.sql')
fs.writeFileSync(sqlPath, sqlStatements, 'utf8')
console.log(`✅ SQL insert created: ${sqlPath}\n`)
console.log('Next steps:')
console.log('1. Run the SQL from the file above in Supabase SQL Editor')
console.log('2. Then import the CSV from:', outputPath)
