import { supabase } from './supabase'
import { applyDynamicPricing } from './pricing'

const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'
const API_BASE_URL = rawApiBaseUrl.replace(/\/+$/, '')
const TOKEN_KEY = 'supplylink_auth_token'

async function requestAuth(path, options = {}) {
    const token = localStorage.getItem(TOKEN_KEY)
    const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
    }

    if (token) {
        headers.Authorization = `Bearer ${token}`
    }

    const response = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers,
    })

    const body = await response.json().catch(() => ({}))

    if (!response.ok) {
        throw new Error(body.error || 'Authentication request failed')
    }

    return body
}

export async function signUpProvider({ name, email, password, role, lat, lng, capacity }) {
    const { token, user } = await requestAuth('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
            name,
            email,
            password,
            role,
            lat,
            lng,
            capacity: capacity || null,
        })
    })

    localStorage.setItem(TOKEN_KEY, token)
    return user
}

export async function signIn({ email, password }) {
    const { token, user } = await requestAuth('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    })

    localStorage.setItem(TOKEN_KEY, token)
    return user
}

export async function sendPhoneOtp({ phone, channel = 'sms' }) {
    return requestAuth('/auth/phone/send-otp', {
        method: 'POST',
        body: JSON.stringify({ phone, channel }),
    })
}

export async function verifyPhoneOtp({ phone, token, type = 'sms', name, role, lat, lng, capacity }) {
    const { token: appToken, user } = await requestAuth('/auth/phone/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ phone, token, type, name, role, lat, lng, capacity }),
    })

    localStorage.setItem(TOKEN_KEY, appToken)
    return user
}

export async function signOut() {
    localStorage.removeItem(TOKEN_KEY)
}

export async function getSessionUser() {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) return null

    try {
        return await requestAuth('/auth/me')
    } catch (err) {
        if (String(err.message || '').toLowerCase().includes('token')) {
            localStorage.removeItem(TOKEN_KEY)
            return null
        }
        throw err
    }
}

export async function addFoodListing(payload) {
    const { data, error } = await supabase.from('food').insert([payload]).select().single()
    if (error) throw error
    return data
}

export async function getProviderFood(providerId) {
    const { data, error } = await supabase
        .from('food')
        .select('*')
        .eq('provider_id', providerId)
        .order('created_at', { ascending: false })

    if (error) throw error
    return applyDynamicPricing(data || [])
}

export async function deleteFoodListing(foodId) {
    const { error } = await supabase.from('food').delete().eq('id', foodId)
    if (error) throw error
}

export async function getProviderStats(providerId) {
    const { count: totalListings, error: totalError } = await supabase
        .from('food')
        .select('*', { count: 'exact', head: true })
        .eq('provider_id', providerId)

    if (totalError) throw totalError

    const { count: activeListings, error: activeError } = await supabase
        .from('food')
        .select('*', { count: 'exact', head: true })
        .eq('provider_id', providerId)
        .eq('status', 'available')

    if (activeError) throw activeError

    const { count: soldItems, error: soldError } = await supabase
        .from('food')
        .select('*', { count: 'exact', head: true })
        .eq('provider_id', providerId)
        .eq('status', 'sold')

    if (soldError) throw soldError

    const { count: donatedItems, error: donatedError } = await supabase
        .from('food')
        .select('*', { count: 'exact', head: true })
        .eq('provider_id', providerId)
        .eq('status', 'donated')

    if (donatedError) throw donatedError

    return {
        totalListings: totalListings || 0,
        activeListings: activeListings || 0,
        soldItems: soldItems || 0,
        donatedItems: donatedItems || 0,
        wasteReduced: (soldItems || 0) + (donatedItems || 0),
    }
}

export function subscribeProviderFood(providerId, onChange) {
    return supabase
        .channel(`provider-food-${providerId}`)
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'food', filter: `provider_id=eq.${providerId}` },
            () => onChange()
        )
        .subscribe()
}

async function apiRequest(path, options = {}) {
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

export function getSupplierPrediction(supplierId, params = {}) {
    const searchParams = new URLSearchParams(params)
    const suffix = searchParams.toString() ? `?${searchParams.toString()}` : ''
    return apiRequest(`/api/predictions/supplier/${supplierId}${suffix}`)
}

export function runPrediction(payload) {
    return apiRequest('/api/predictions/run', {
        method: 'POST',
        body: JSON.stringify(payload),
    })
}

export function runBulkPredictions(payload = {}) {
    return apiRequest('/api/predictions/bulk-run', {
        method: 'POST',
        body: JSON.stringify(payload),
    })
}

export function getLiveSurplus() {
    return apiRequest('/api/surplus/live')
}

export function getAnalyticsTrends() {
    return apiRequest('/api/analytics/trends')
}

export function getSeasonalAnalytics() {
    return apiRequest('/api/analytics/seasonal')
}
