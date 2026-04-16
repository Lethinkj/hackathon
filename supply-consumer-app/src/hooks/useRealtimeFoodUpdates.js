import { useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

/**
 * Hook to subscribe to real-time food listing updates
 * Listens for INSERT, UPDATE, DELETE events on food/foods tables
 */
export function useRealtimeFoodUpdates(onUpdate) {
  const channelRef = useRef(null)

  useEffect(() => {
    if (!onUpdate) return

    const channel = supabase
      .channel('food-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'food' },
        (payload) => {
          onUpdate({
            type: payload.eventType.toLowerCase(),
            data: payload.new || payload.old,
            table: 'food',
          })
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'foods' },
        (payload) => {
          onUpdate({
            type: payload.eventType.toLowerCase(),
            data: payload.new || payload.old,
            table: 'foods',
          })
        }
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [onUpdate])
}

/**
 * Hook to subscribe to real-time order updates
 */
export function useRealtimeOrderUpdates(onUpdate) {
  const channelRef = useRef(null)

  useEffect(() => {
    if (!onUpdate) return

    const channel = supabase
      .channel('order-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          onUpdate({
            type: payload.eventType.toLowerCase(),
            data: payload.new || payload.old,
          })
        }
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [onUpdate])
}

/**
 * Hook to subscribe to real-time request updates
 */
export function useRealtimeRequestUpdates(onUpdate) {
  const channelRef = useRef(null)

  useEffect(() => {
    if (!onUpdate) return

    const channel = supabase
      .channel('request-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'requests' },
        (payload) => {
          onUpdate({
            type: payload.eventType.toLowerCase(),
            data: payload.new || payload.old,
          })
        }
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [onUpdate])
}

/**
 * Hook to subscribe to real-time donation alerts
 */
export function useRealtimeDonationUpdates(onUpdate) {
  const channelRef = useRef(null)

  useEffect(() => {
    if (!onUpdate) return

    const channel = supabase
      .channel('donation-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'donations' },
        (payload) => {
          onUpdate({
            type: payload.eventType.toLowerCase(),
            data: payload.new || payload.old,
          })
        }
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [onUpdate])
}

/**
 * Hook to subscribe to real-time prediction updates
 */
export function useRealtimePredictionUpdates(onUpdate) {
  const channelRef = useRef(null)

  useEffect(() => {
    if (!onUpdate) return

    const channel = supabase
      .channel('prediction-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'predictions' },
        (payload) => {
          onUpdate({
            type: payload.eventType.toLowerCase(),
            data: payload.new || payload.old,
          })
        }
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [onUpdate])
}
