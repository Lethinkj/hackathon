import { useEffect } from 'react'
import { hasSupabaseConfig, supabase } from '../services/supabaseClient'
import { getFoodIconBackground } from '../utils/foodTheme'

function normalizeFood(food) {
    const maxT = Number(food.maxT ?? food.max_t ?? food.durationSeconds ?? food.duration_seconds ?? 3600)
    const elapsed = Number(food.elapsed ?? 0)
    const expiresAt = food.expiresAt
        ? new Date(food.expiresAt).getTime()
        : food.expiry_time
            ? new Date(food.expiry_time).getTime()
            : food.expires_at
                ? new Date(food.expires_at).getTime()
                : Date.now() + Math.max(0, maxT - elapsed) * 1000

    return {
        ...food,
        id: food.id,
        name: food.name ?? food.title ?? 'Listing',
        prov: food.prov ?? food.provider ?? food.provider_name ?? 'Unknown provider',
        base: Number(food.base ?? food.original_price ?? food.base_price ?? 0),
        qty: Number(food.qty ?? food.quantity ?? food.units ?? 0),
        maxT,
        elapsed,
        veg: Boolean(food.veg ?? food.is_veg ?? true),
        type: food.type ?? food.category ?? 'meal',
        icon: food.icon ?? '🍽️',
        iconBg: food.iconBg ?? getFoodIconBackground(food.type ?? food.category ?? 'meal'),
        status: food.status ?? 'available',
        expiresAt,
    }
}

function upsertFood(items, nextFood) {
    const index = items.findIndex((item) => item.id === nextFood.id)

    if (index === -1) return [nextFood, ...items]

    const nextItems = [...items]
    nextItems[index] = { ...nextItems[index], ...nextFood }
    return nextItems
}

export function useRealtimeFoods(setFoods, fallbackFoods = []) {
    useEffect(() => {
        let active = true
        let channel

        const applyFoods = (items) => {
            if (!active) return
            setFoods(items.map(normalizeFood))
        }

        const loadFoods = async () => {
            if (!hasSupabaseConfig) {
                applyFoods(fallbackFoods)
                return
            }

            const { data, error } = await supabase.from('foods').select('*').order('created_at', { ascending: false })

            if (!active) return

            if (error || !data?.length) {
                applyFoods(fallbackFoods)
                return
            }

            applyFoods(data)
        }

        loadFoods().catch(() => applyFoods(fallbackFoods))

        if (hasSupabaseConfig) {
            channel = supabase
                .channel('left2lift-foods')
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'foods' }, (payload) => {
                    const nextFood = normalizeFood(payload.new)
                    setFoods((current) => upsertFood(current, nextFood))
                })
                .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'foods' }, (payload) => {
                    const nextFood = normalizeFood(payload.new)
                    setFoods((current) => upsertFood(current, nextFood))
                })
                .subscribe()
        }

        return () => {
            active = false
            if (channel) supabase.removeChannel(channel)
        }
    }, [fallbackFoods, setFoods])
}
