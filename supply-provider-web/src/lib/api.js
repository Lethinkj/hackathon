import { supabase } from './supabase'
import { applyDynamicPricing } from './pricing'

export async function signUpProvider({ name, email, password, role, lat, lng, capacity }) {
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
    })

    if (authError) throw authError
    if (!authData.user) throw new Error('Unable to create user')

    const { data: user, error: userError } = await supabase
        .from('users')
        .upsert({
            id: authData.user.id,
            name,
            email,
            role,
            lat,
            lng,
            capacity: capacity || null,
            rating: 5,
        })
        .select()
        .single()

    if (userError) throw userError
    return user
}

export async function signIn({ email, password }) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    if (!data.user) throw new Error('Invalid credentials')

    const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single()

    if (userError) throw userError
    return user
}

export async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
}

export async function getSessionUser() {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
    if (sessionError) throw sessionError

    if (!sessionData.session?.user?.id) return null

    const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', sessionData.session.user.id)
        .single()

    if (userError) throw userError
    return user
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
