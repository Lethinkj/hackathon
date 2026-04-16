import { useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

/**
 * Subscribe to real-time order/request updates for a provider.
 */
export function useRealtimeOrders(providerId, onUpdate) {
  const channelRef = useRef(null)

  useEffect(() => {
    if (!providerId) return undefined

    const channel = supabase
      .channel(`orders-provider-${providerId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'requests',
        },
        (payload) => {
          onUpdate?.({
            type: String(payload.eventType || '').toLowerCase(),
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
  }, [providerId, onUpdate])
}
