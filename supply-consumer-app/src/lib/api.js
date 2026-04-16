import { supabase } from './supabase'
import { withDynamicPrice } from './pricing'
import Constants from 'expo-constants'

const FORCED_API_PORT = '4001'
const rawApiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL || `http://localhost:${FORCED_API_PORT}`
const API_BASE_URL = (() => {
  try {
    const parsed = new URL(rawApiBaseUrl)
    return `${parsed.protocol}//${parsed.hostname}:${FORCED_API_PORT}`.replace(/\/+$/, '')
  } catch (_error) {
    return `http://localhost:${FORCED_API_PORT}`
  }
})()
const REQUEST_TIMEOUT_MS = 2500
const COMMON_BACKEND_PORTS = [FORCED_API_PORT]
const MAX_BASE_CANDIDATES = 8

function getExpoHostAddress() {
  const hostUri =
    Constants?.expoConfig?.hostUri
    || Constants?.manifest2?.extra?.expoClient?.hostUri
    || Constants?.manifest?.debuggerHost
    || ''

  return String(hostUri).split(':')[0] || ''
}

function getWebHostAddress() {
  if (typeof window === 'undefined') return ''

  const host = String(window.location?.hostname || '').trim()
  if (!host || host === 'localhost' || host === '127.0.0.1') return ''
  return host
}

function buildApiBaseCandidates() {
  const candidates = []
  const expoHost = getExpoHostAddress()
  const webHost = getWebHostAddress()

  try {
    const parsed = new URL(API_BASE_URL)
    const protocol = parsed.protocol || 'http:'
    const preferredPort = FORCED_API_PORT
    const ports = Array.from(new Set([preferredPort, ...COMMON_BACKEND_PORTS]))

    if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
      // On Expo Go physical devices, LAN host is usually reachable first.
      if (expoHost) {
        for (const port of ports) {
          candidates.push(`${protocol}//${expoHost}:${port}`)
        }
      }

      if (webHost) {
        for (const port of ports) {
          candidates.push(`${protocol}//${webHost}:${port}`)
        }
      }

      for (const port of ports) {
        candidates.push(`${protocol}//localhost:${port}`)
        candidates.push(`${protocol}//127.0.0.1:${port}`)
      }

      // Android emulator alias. Harmless fallback on other environments.
      for (const port of ports) {
        candidates.push(`${protocol}//10.0.2.2:${port}`)
      }
    } else {
      for (const port of ports) {
        candidates.push(`${protocol}//${parsed.hostname}:${port}`)
      }
    }
  } catch (_error) {
    // Keep default candidate if URL parsing fails.
    candidates.push(API_BASE_URL)
  }

  return Array.from(new Set(candidates.map((url) => url.replace(/\/+$/, '')))).slice(0, MAX_BASE_CANDIDATES)
}

async function requestWithFallback(path, options = {}) {
  const baseCandidates = buildApiBaseCandidates()
  let lastError = null

  for (const baseUrl of baseCandidates) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

    try {
      const response = await fetch(`${baseUrl}${path}`, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {}),
        },
      })

      const body = await response.json().catch(() => ({}))

      if (!response.ok) {
        const message = body.error || `Request failed (${response.status})`
        const error = new Error(message)
        error.status = response.status
        throw error
      }

      return body
    } catch (error) {
      if (error?.name === 'AbortError') {
        lastError = new Error(`Request timeout after ${REQUEST_TIMEOUT_MS}ms`)
      } else {
        lastError = error
      }
    } finally {
      clearTimeout(timeout)
    }
  }

  const hint = `API unreachable. Tried: ${baseCandidates.join(', ')}`
  const detail = lastError?.message ? ` (${lastError.message})` : ''
  throw new Error(`${hint}${detail}. Ensure backend is running and reachable on LAN/localhost.`)
}

async function requestAuth(path, options = {}) {
  return requestWithFallback(path, options)
}

async function requestApi(path, options = {}) {
  return requestWithFallback(path, options)
}

export async function signUp({ name, email, password, role, lat, lng, capacity }) {
  const normalizedEmail = email.trim().toLowerCase()

  const { user } = await requestAuth('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email: normalizedEmail, password, role, lat, lng, capacity }),
  })

  return user
}

export async function signIn({ email, password }) {
  const normalizedEmail = email.trim().toLowerCase()

  const { user } = await requestAuth('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: normalizedEmail, password }),
  })

  return user
}

export async function sendPhoneOtp({ phone, channel = 'sms' }) {
  return requestAuth('/auth/phone/send-otp', {
    method: 'POST',
    body: JSON.stringify({ phone, channel }),
  })
}

export async function verifyPhoneOtp({ phone, token, type = 'sms', name, role, lat, lng, capacity }) {
  const { user } = await requestAuth('/auth/phone/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ phone, token, type, name, role, lat, lng, capacity }),
  })

  return user
}

async function queryFoodTable(builder) {
  const primary = await builder('food')
  if (!primary.error) return primary
  const fallback = await builder('foods')
  return fallback
}

export async function getNearbyFood() {
  const { data, error } = await queryFoodTable((table) =>
    supabase.from(table).select('*').eq('status', 'available').order('created_at', { ascending: false })
  )

  if (error) throw error
  return (data || []).map(withDynamicPrice)
}

export async function getNgoAlerts() {
  const { data, error } = await queryFoodTable((table) =>
    supabase.from(table).select('*').eq('status', 'available').eq('price', 0).order('created_at', { ascending: false })
  )

  if (error) throw error
  return data || []
}

export async function getLiveSurplus() {
  return requestApi('/api/surplus/live')
}

export async function getSupplierPrediction(supplierId, params = {}) {
  const searchParams = new URLSearchParams(params)
  const suffix = searchParams.toString() ? `?${searchParams.toString()}` : ''
  return requestApi(`/api/predictions/supplier/${supplierId}${suffix}`)
}

export async function getFeedPrediction(foods = [], fallbackSupplierId) {
  const candidates = [
    ...foods.map((item) => item?.provider_id).filter(Boolean),
    ...foods.map((item) => item?.supplier_id).filter(Boolean),
  ]

  if (fallbackSupplierId) {
    candidates.push(fallbackSupplierId)
  }

  const uniqueCandidates = Array.from(new Set(candidates))

  for (const supplierId of uniqueCandidates) {
    try {
      const payload = await getSupplierPrediction(supplierId)
      return {
        supplierId,
        prediction: payload?.current_prediction || payload || null,
      }
    } catch (_error) {
      // Try next supplier candidate to keep consumer prediction banner populated.
    }
  }

  return {
    supplierId: null,
    prediction: null,
  }
}

export async function getPredictionProducts(limit = 500) {
  const mapRow = (item) => ({
    id: item.id,
    is_prediction: true,
    prediction_id: item.predictionId || item.id,
    supplier_id: item.supplierId || item.supplier_id,
    supplier_name: item.supplierName || item.supplier_name || 'Local supplier',
    food_name: item.foodName || item.food_name || item.suggestedAction || item.suggested_action || 'Predicted surplus item',
    suggested_action: item.suggestedAction || item.suggested_action,
    quantity: Number(item.qty ?? item.quantity ?? item.predicted_surplus ?? 0),
    predicted_surplus: Number(item.predictedSurplus ?? item.predicted_surplus ?? 0),
    confidence_score: Number(item.confidence ?? item.confidence_score ?? 0),
    type: item.category || item.type || 'Predicted',
    price: 0,
    original_price: 0,
    status: 'predicted',
    prediction_date: item.predictionDate || item.prediction_date,
    expiry_time: (item.predictionDate || item.prediction_date)
      ? `${item.predictionDate || item.prediction_date}T23:59:59.000Z`
      : (item.createdAt || item.created_at),
    created_at: item.createdAt || item.created_at,
    location: item.location || null,
    listing_id: item.listingId || item.listing_id || null,
  })

  try {
    const body = await requestApi(`/api/predictions/products?limit=${encodeURIComponent(limit)}`)
    const rows = body?.items || []
    return rows.map(mapRow)
  } catch (_apiError) {
    // Fallback: read predictions directly from Supabase when backend tunnel/API is unavailable.
    const { data: predictions, error: predictionsError } = await supabase
      .from('predictions')
      .select('id, supplier_id, prediction_date, predicted_surplus, confidence_score, suggested_action, created_at')
      .order('prediction_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit)

    if (predictionsError) throw predictionsError

    const predictionRows = predictions || []
    const supplierIds = Array.from(new Set(predictionRows.map((row) => row.supplier_id).filter(Boolean)))

    let suppliersById = {}
    if (supplierIds.length) {
      const { data: suppliers } = await supabase
        .from('suppliers')
        .select('supplier_id, supplier_name, category, location')
        .in('supplier_id', supplierIds)

      suppliersById = (suppliers || []).reduce((acc, supplier) => {
        acc[supplier.supplier_id] = supplier
        return acc
      }, {})
    }

    return predictionRows.map((row) => mapRow({
      ...row,
      qty: Number(row.predicted_surplus || 0),
      supplier_name: suppliersById[row.supplier_id]?.supplier_name,
      category: suppliersById[row.supplier_id]?.category,
      location: suppliersById[row.supplier_id]?.location,
    }))
  }
}

export async function preOrderPrediction({ predictionId, userId, pickupTime, listingId }) {
  if (!predictionId || !userId) {
    throw new Error('predictionId and userId are required')
  }

  return requestApi(`/api/predictions/products/${encodeURIComponent(predictionId)}/preorder`, {
    method: 'POST',
    body: JSON.stringify({ predictionId, userId, pickupTime, listingId }),
  })
}

export async function prebookPrediction(params) {
  return preOrderPrediction(params)
}

export async function getPredictionPreorders(userId) {
  try {
    const body = await requestApi(`/api/predictions/preorders/${encodeURIComponent(userId)}`)
    return body?.items || []
  } catch (_error) {
    const { data, error } = await supabase
      .from('prediction_preorders')
      .select('*, prediction:predictions(*), listing:foods(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }
}

export async function getProviderFood(providerId) {
  const { data, error } = await queryFoodTable((table) =>
    supabase
      .from(table)
      .select('*')
      .eq('provider_id', providerId)
      .order('created_at', { ascending: false })
  )

  if (error) throw error
  return (data || []).map(withDynamicPrice)
}

export async function updateFood(foodId, changes) {
  const payload = {}
  if (changes.food_name !== undefined) payload.food_name = changes.food_name
  if (changes.quantity !== undefined) payload.quantity = changes.quantity
  if (changes.type !== undefined) payload.type = changes.type
  if (changes.price !== undefined) payload.price = changes.price
  if (changes.original_price !== undefined) payload.original_price = changes.original_price
  if (changes.expiry_time !== undefined) payload.expiry_time = changes.expiry_time
  if (changes.status !== undefined) payload.status = changes.status

  const updateOn = async (table) =>
    supabase.from(table).update(payload).eq('id', foodId).select().single()

  const primary = await updateOn('food')
  if (!primary.error) return primary.data

  const fallback = await updateOn('foods')
  if (fallback.error) throw fallback.error
  return fallback.data
}

export async function donateFood(foodId) {
  return updateFood(foodId, { price: 0, status: 'available' })
}

export async function placeOrder({ foodId, userId, pickupTime }) {
  try {
    return await requestApi('/orders', {
      method: 'POST',
      body: JSON.stringify({
        foodId,
        userId,
        pickupTime,
      }),
    })
  } catch (_apiError) {
    // Local fallback in case backend is unavailable in development.
    const { data, error } = await supabase
      .from('orders')
      .insert([
        {
          food_id: foodId,
          user_id: userId,
          status: 'pending',
          pickup_time: pickupTime,
        },
      ])
      .select()
      .single()

    if (error) throw error

    const markSold = async (table) => supabase.from(table).update({ status: 'sold' }).eq('id', foodId)
    const soldPrimary = await markSold('food')
    if (soldPrimary.error) {
      await markSold('foods')
    }

    return data
  }
}

export async function requestFoodByNgo({ foodId, ngoId }) {
  const { data, error } = await supabase
    .from('donations')
    .insert([
      {
        food_id: foodId,
        ngo_id: ngoId,
        volunteer_assigned: false,
      },
    ])
    .select()
    .single()

  if (error) throw error

  await updateFood(foodId, { status: 'donated', price: 0 })

  return data
}

export async function getOrders(userId) {
  try {
    const rows = await requestApi(`/orders/${userId}`)
    return (rows || [])
      .map((item) => ({
        ...item,
        food: item.food || item.foods || null,
      }))
      .sort((a, b) => new Date(a.pickup_time).getTime() - new Date(b.pickup_time).getTime())
  } catch (apiError) {
    // Fallback keeps mobile app functional if backend route is temporarily unavailable.
    const { data, error } = await supabase
      .from('orders')
      .select('*, food(*)')
      .eq('user_id', userId)
      .order('pickup_time', { ascending: true })

    if (error) throw apiError
    return data || []
  }
}

export async function getProviderOrders(providerId) {
  const { data: providerFood, error: providerFoodError } = await queryFoodTable((table) =>
    supabase.from(table).select('id').eq('provider_id', providerId)
  )

  if (providerFoodError) throw providerFoodError

  const foodIds = (providerFood || []).map((item) => item.id)
  if (!foodIds.length) return []

  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select('*, food(*)')
    .in('food_id', foodIds)
    .order('pickup_time', { ascending: true })

  if (ordersError) throw ordersError
  return orders || []
}

export function subscribeFoodRealtime(onChange) {
  return supabase
    .channel('food-updates-mobile')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'food' }, () => onChange())
    .on('postgres_changes', { event: '*', schema: 'public', table: 'foods' }, () => onChange())
    .subscribe()
}
