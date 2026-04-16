import { supabase } from './supabase'

const API_BASE_URL = String(import.meta.env.VITE_API_BASE_URL || 'http://localhost:4001').replace(/\/+$/, '')
const TOKEN_KEY = 'supplylink_auth_token'
const USER_KEY = 'supplylink_auth_user'

function readJsonSafe(response) {
    return response.json().catch(() => ({}))
}

function authHeaders(extra = {}) {
    const token = localStorage.getItem(TOKEN_KEY)
    return {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...extra,
    }
}

async function request(path, options = {}) {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers: authHeaders(options.headers || {}),
    })

    const body = await readJsonSafe(response)
    if (!response.ok) {
        const error = new Error(body.error || `Request failed for ${path}`)
        error.status = response.status
        throw error
    }

    return body
}

function setAuthSession(token, user) {
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(USER_KEY, JSON.stringify(user))
}

function clearAuthSession() {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
}

function toIsoStartTime(input) {
    if (!input) return new Date().toISOString()
    const date = new Date(input)
    if (Number.isNaN(date.getTime())) return new Date().toISOString()
    return date.toISOString()
}

function toListingPayload(input) {
    return {
        image: input.image || '',
        foodName: String(input.foodName || '').trim(),
        category: String(input.category || 'Meals').trim(),
        originalPrice: Number(input.originalPrice || 0),
        maxDiscountPrice: Number(input.maxDiscountPrice || 0),
        quantity: Number(input.quantity || 0),
        distributionStartTime: toIsoStartTime(input.distributionStartTime),
        expiryHours: Number(input.expiryHours || 5),
        autoHourlyReduction: Boolean(input.autoHourlyReduction),
        donationPriority: Boolean(input.donationPriority),
        notes: String(input.notes || '').trim(),
    }
}

function normalizeListing(row) {
    const quantity = Number(row.quantity ?? row.qty ?? 0)
    const originalPrice = Number(row.originalPrice ?? row.original_price ?? row.base_price ?? row.price ?? 0)
    const currentPrice = Number(row.currentPrice ?? row.current_price ?? row.price ?? originalPrice)
    const reserved = Number(row.reserved ?? 0)
    const createdAt = row.distributionStartTime || row.created_at || row.createdAt || new Date().toISOString()
    const expiry = row.expiry || row.expiry_time || row.expiryTime || createdAt

    return {
        id: row.id,
        image: row.image || row.image_url || '',
        foodName: row.foodName || row.food_name || row.name || 'Listing',
        category: row.category || row.food_type || 'Meals',
        quantityLeft: Math.max(0, quantity - reserved),
        quantity,
        originalPrice: `Rs ${Math.round(originalPrice)}`,
        currentPrice: `Rs ${Math.round(currentPrice)}`,
        orders: Number(row.orders || 0),
        reserved,
        status: String(row.status || 'ACTIVE').toUpperCase(),
        startTime: new Date(createdAt).toLocaleString(),
        expiry: new Date(expiry).toLocaleString(),
        distributionStartTime: createdAt,
        expiryHours: Number(row.expiryHours || 5),
        maxDiscountPrice: Number(row.maxDiscountPrice ?? Math.max(0, Math.round(originalPrice * 0.4))),
        autoHourlyReduction: Boolean(row.autoHourlyReduction),
        donationPriority: Boolean(row.donationPriority),
        notes: row.notes || '',
    }
}

export async function signUpProvider({ name, username, phone, password, role = 'provider', source_of_food_provider }) {
    const payload = {
        name,
        username,
        phone,
        password,
        role,
        source_of_food_provider,
    }
    const body = await request('/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
    })

    if (!body.token || !body.user) {
        throw new Error('Invalid registration response')
    }

    setAuthSession(body.token, body.user)
    return body.user
}

export async function signIn({ identifier, password }) {
    const body = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ identifier, password }),
    })

    if (!body.token || !body.user) {
        throw new Error('Invalid login response')
    }

    setAuthSession(body.token, body.user)
    return body.user
}

export async function signOut() {
    clearAuthSession()
}

export async function getSessionUser() {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) return null

    try {
        const user = await request('/auth/me')
        localStorage.setItem(USER_KEY, JSON.stringify(user))
        return user
    } catch (error) {
        if (error.status === 401 || error.status === 404) {
            clearAuthSession()
            return null
        }
        throw error
    }
}

export async function getDashboardStats() {
    return request('/api/dashboard/stats')
}

export async function getPredictionsToday() {
    return request('/api/predictions/today')
}

export async function recalculatePredictions() {
    return request('/api/predictions/recalculate', {
        method: 'POST',
        body: JSON.stringify({ force: true }),
    })
}

export async function getListings() {
    const body = await request('/api/listings')
    return {
        ...body,
        items: (body.items || []).map(normalizeListing),
    }
}

export async function createListing(input) {
    return request('/api/listings', {
        method: 'POST',
        body: JSON.stringify(toListingPayload(input)),
    })
}

export async function updateListing(id, input) {
    return request(`/api/listings/${id}`, {
        method: 'PUT',
        body: JSON.stringify(toListingPayload(input)),
    })
}

export async function deleteListing(id) {
    return request(`/api/listings/${id}`, { method: 'DELETE' })
}

export async function closeListing(id) {
    return request(`/api/listings/${id}/close`, { method: 'POST' })
}

function normalizeFoodLogRow(row) {
    return {
        id: row.id,
        supplierId: row.supplierId || row.supplier_id,
        foodName: row.foodName || row.food_name || 'Food',
        foodCategory: row.foodCategory || row.food_category || 'Meals',
        preparedQty: Number(row.preparedQty ?? row.prepared_qty ?? 0),
        soldQty: Number(row.soldQty ?? row.sold_qty ?? 0),
        surplusQty: Number(row.surplusQty ?? row.surplus_qty ?? 0),
        price: Number(row.price ?? 0),
        wasteQty: Number(row.wasteQty ?? row.waste_qty ?? 0),
        createdDate: row.createdDate || row.created_date,
        demandScore: Number(row.demandScore ?? row.demand_score ?? 0),
        weather: row.weather || '',
    }
}

export async function getFoodLogHistory() {
    const body = await request('/api/listings/history')
    return {
        ...body,
        items: (body.items || []).map(normalizeFoodLogRow),
    }
}

export async function updateFoodLogHistory(id, payload) {
    const body = await request(`/api/listings/history/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
    })

    return {
        ...body,
        item: body.item ? normalizeFoodLogRow(body.item) : null,
    }
}

// ===== REALTIME & REQUESTS FUNCTIONS =====

/**
 * Get all requests (orders) for a provider's listings
 */
export async function getProviderRequests() {
    return request('/api/requests', { method: 'GET' })
}

/**
 * Accept a request from consumer/NGO
 */
export async function acceptRequest(requestId) {
    return request(`/api/requests/${requestId}/accept`, { method: 'POST' })
}

/**
 * Reject a request from consumer/NGO
 */
export async function rejectRequest(requestId) {
    return request(`/api/requests/${requestId}/reject`, { method: 'POST' })
}

/**
 * Get all donation requests for a provider
 */
export async function getDonationRequests() {
    return request('/api/donations', { method: 'GET' })
}

/**
 * Accept a donation request
 */
export async function acceptDonation(donationId) {
    return request(`/api/donations/${donationId}/accept`, { method: 'POST' })
}

/**
 * Get food lifecycle details (used for dynamic pricing calculations)
 */
export function calculateFoodLifecycle(food, now = Date.now()) {
    const createdMs = new Date(food.created_at || food.createdAt).getTime()
    const elapsedMs = now - createdMs
    const elapsedMins = Math.floor(elapsedMs / 60000)

    const discount_time = food.discount_time || food.discountTime || 60
    const ngo_time = food.ngo_time || ngoTime || 30
    const base_price = food.base_price || food.originalPrice || food.price || 0
    const max_discount = food.max_discount || food.maxDiscountPrice || base_price * 0.4

    let status = 'SELL'
    let current_price = base_price

    if (elapsedMins >= ngo_time) {
        status = 'DONATE'
        current_price = 0
    } else if (elapsedMins >= discount_time) {
        status = 'DISCOUNT'
        const discountPercent = ((elapsedMins - discount_time) / (ngo_time - discount_time)) * 100
        current_price = base_price - (base_price - max_discount) * (discountPercent / 100)
    }

    return {
        ...food,
        status,
        current_price: Math.max(0, current_price),
    }
}
