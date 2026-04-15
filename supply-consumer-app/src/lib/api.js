import { supabase } from './supabase'
import { withDynamicPrice } from './pricing'

export async function getNearbyFood() {
  const { data, error } = await supabase
    .from('food')
    .select('*')
    .eq('status', 'available')
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data || []).map(withDynamicPrice)
}

export async function getNgoAlerts() {
  const { data, error } = await supabase
    .from('food')
    .select('*')
    .eq('status', 'available')
    .eq('price', 0)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
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

  await supabase.from('food').update({ status: 'sold' }).eq('id', foodId)

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

export function subscribeFoodRealtime(onChange) {
  return supabase
    .channel('food-updates-mobile')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'food' }, () => onChange())
    .subscribe()
}
