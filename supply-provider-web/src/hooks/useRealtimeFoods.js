import { useCallback, useEffect, useRef, useState } from 'react'
import { calculateFoodLifecycle } from '../lib/api'
import { supabase } from '../lib/supabase'

const MINUTE_MS = 60 * 1000

function hasLifecycleChanged(previous, next) {
    return previous?.current_price !== next.current_price || previous?.status !== next.status
}

export function useRealtimeFoods(providerId) {
    const [foods, setFoods] = useState([])
    const [loading, setLoading] = useState(Boolean(providerId))
    const [error, setError] = useState('')
    const foodsRef = useRef([])

    useEffect(() => {
        foodsRef.current = foods
    }, [foods])

    const loadFoods = useCallback(async () => {
        if (!providerId) {
            setFoods([])
            setLoading(false)
            return []
        }

        setLoading(true)
        setError('')

        const { data, error: fetchError } = await supabase
            .from('foods')
            .select('*')
            .eq('provider_id', providerId)
            .order('created_at', { ascending: false })

        if (fetchError) {
            setError(fetchError.message)
            setLoading(false)
            throw fetchError
        }

        const normalized = (data || []).map((row) => calculateFoodLifecycle(row))
        setFoods(normalized)
        setLoading(false)
        return normalized
    }, [providerId])

    useEffect(() => {
        void loadFoods()
    }, [loadFoods])

    useEffect(() => {
        if (!providerId) return undefined

        const channel = supabase
            .channel(`foods-${providerId}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'foods', filter: `provider_id=eq.${providerId}` },
                () => {
                    void loadFoods()
                }
            )
            .subscribe()

        return () => {
            void supabase.removeChannel(channel)
        }
    }, [loadFoods, providerId])

    useEffect(() => {
        if (!providerId || !foods.length) return undefined

        const interval = setInterval(() => {
            const now = Date.now()
            const nextFoods = foodsRef.current.map((food) => calculateFoodLifecycle(food, now))
            const changedRows = nextFoods.filter((nextFood, index) => hasLifecycleChanged(foodsRef.current[index], nextFood))

            if (changedRows.length) {
                void Promise.all(
                    changedRows.map((food) =>
                        supabase
                            .from('foods')
                            .update({ current_price: food.current_price, status: food.status })
                            .eq('id', food.id)
                    )
                )
            }

            setFoods(nextFoods)
        }, MINUTE_MS)

        return () => clearInterval(interval)
    }, [foods.length, providerId])

    return { foods, loading, error, refreshFoods: loadFoods, setFoods }
}
