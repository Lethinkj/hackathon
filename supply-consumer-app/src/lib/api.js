import { supabase } from './supabase'
import { withDynamicPrice } from './pricing'

const rawApiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:5000'
const API_BASE_URL = rawApiBaseUrl.replace(/\/+$/, '')

async function requestAuth(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  })

  const body = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(body.error || 'Request failed')
  }

  return body
}

async function requestApi(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  })

  const body = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(body.error || 'Request failed')
  }

  return body
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
  const { data, error } = await supabase
    .from('orders')
    .select('*, food(*)')
    .eq('user_id', userId)
    .order('pickup_time', { ascending: true })

  if (error) throw error
  return data || []
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
