import { supabase } from './supabase'
import { applyDynamicPricing } from './pricing'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'
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
