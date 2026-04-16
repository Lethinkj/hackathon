const supabase = require('../supabaseClient')
const fs = require('fs')
const path = require('path')

async function setupAndImport() {
  try {
    console.log('📋 Creating suppliers in database...')

    const suppliers = [
      { supplier_id: '7933b384-0fba-5867-9d8c-929b61f2acca', supplier_name: 'Golden Crust Bakery', location: 'Chennai', category: 'Restaurants and Cafes' },
      { supplier_id: '26fc9b4e-b524-5657-9a97-52821ba0b606', supplier_name: 'Saravana Bhavan Outlet', location: 'Chennai', category: 'Restaurants and Cafes' },
      { supplier_id: 'a6ba8fc6-3fbb-5aae-8512-9345e6825dc7', supplier_name: 'Spice Route Kitchen', location: 'Coimbatore', category: 'Caterers & Hotels' },
      { supplier_id: '3e0608b2-84e3-5a64-bed8-c98722b6066c', supplier_name: 'Madurai Meals Hub', location: 'Madurai', category: 'Schools & Institutions' },
      { supplier_id: '8faf69d6-0238-50f2-bbe7-1345d3a7c4dd', supplier_name: 'Grand Celebration Hotel', location: 'Bangalore', category: 'Weddings and Parties' },
      { supplier_id: '256ceba6-ddcf-530f-bfa1-c7781a94c5bf', supplier_name: 'Corporate Catering Solutions', location: 'Hyderabad', category: 'Corporate Offices & Canteens' },
      { supplier_id: '31373466-0755-5d73-a853-9f55038c9929', supplier_name: 'Royal Events Catering', location: 'Chennai', category: 'Caterers & Hotels' },
    ]

    const { data, error: insertError } = await supabase
      .from('suppliers')
      .upsert(suppliers, { onConflict: 'supplier_id' })
      .select()

    if (insertError) {
      console.error('❌ Insert error:', insertError.message)
      throw insertError
    } else {
      console.log(`✅ Suppliers created/updated: ${data?.length || suppliers.length}`)
    }

    // Now read CSV and insert
    console.log('\n📥 Reading CSV for food_logs import...')
    const readableCsvPath = path.resolve(__dirname, '../data/food_logs_sample_365_readable.csv')
    const baseCsvPath = path.resolve(__dirname, '../data/food_logs_sample_365.csv')
    const csvPath = fs.existsSync(readableCsvPath) ? readableCsvPath : baseCsvPath
    const csvContent = fs.readFileSync(csvPath, 'utf8')
    const lines = csvContent.split('\n')
    const headers = lines[0].split(',').map(h => h.trim())
    const allowedColumns = new Set([
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
    ])

    function parseCSVLine(line) {
      const result = []
      let current = ''
      let inQuotes = false

      for (let i = 0; i < line.length; i++) {
        const char = line[i]
        const nextChar = line[i + 1]

        if (char === '"') {
          if (inQuotes && nextChar === '"') {
            current += '"'
            i++
          } else {
            inQuotes = !inQuotes
          }
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim())
          current = ''
        } else {
          current += char
        }
      }

      result.push(current.trim())
      return result
    }

    const rows = []
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue

      const values = parseCSVLine(lines[i])
      const row = {}
      headers.forEach((header, idx) => {
        if (!allowedColumns.has(header)) return
        const value = values[idx] || ''
        // Handle numeric fields
        if (['prepared_qty', 'sold_qty', 'surplus_qty', 'waste_qty', 'temperature', 'demand_score', 'price'].includes(header)) {
          row[header] = value ? parseFloat(value) : 0
        } else if (['is_weekend', 'is_festival'].includes(header)) {
          row[header] = value === 'true'
        } else {
          row[header] = value || null
        }
      })

      // Skip malformed rows that do not have mandatory keys.
      if (!row.supplier_id || !row.food_name || !row.created_date) continue
      rows.push(row)
    }

    console.log(`📊 Using CSV: ${path.basename(csvPath)}`)
    console.log(`📊 Prepared ${rows.length} food log rows for import...`)

    // Insert in batches of 100
    const batchSize = 100
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize)
      const { error: batchError } = await supabase
        .from('food_logs')
        .insert(batch)

      if (batchError) {
        console.error(`❌ Error importing batch ${i / batchSize + 1}:`, batchError.message)
        throw batchError
      }

      console.log(`✅ Imported ${Math.min(i + batchSize, rows.length)}/${rows.length} rows`)
    }

    console.log('\n🎉 All data successfully imported!')
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

setupAndImport()
