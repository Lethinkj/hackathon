import { useEffect, useState } from 'react'
import { FlatList, Pressable, RefreshControl, SafeAreaView, StyleSheet, Text, View } from 'react-native'
import { getOrders, getPredictionPreorders } from '../lib/api'
import { useRealtimeOrderUpdates } from '../hooks/useRealtimeFoodUpdates'

export default function OrdersScreen({ user }) {
  const [orders, setOrders] = useState([])
  const [preorders, setPreorders] = useState([])
  const [viewMode, setViewMode] = useState('orders')
  const [loading, setLoading] = useState(false)

  async function loadOrders() {
    if (!user?.id) return
    setLoading(true)
    try {
      const [rows, preorderRows] = await Promise.all([
        getOrders(user.id),
        getPredictionPreorders(user.id),
      ])
      setOrders(rows)
      setPreorders(preorderRows)
    } finally {
      setLoading(false)
    }
  }

  useRealtimeOrderUpdates((update) => {
    if (!user?.id) return
    console.log('[OrdersScreen] Real-time order update:', update.type, update.data?.id)
    
    if (update.type === 'insert') {
      // New order for this user
      if (update.data?.user_id === user.id) {
        setOrders(prev => [update.data, ...prev])
      }
    } else if (update.type === 'update') {
      // Order status changed (e.g., pending -> collected)
      setOrders(prev =>
        prev.map(o => o.id === update.data.id ? update.data : o)
      )
    } else if (update.type === 'delete') {
      // Order removed
      setOrders(prev => prev.filter(o => o.id !== update.data.id))
    }
  })

  useEffect(() => {
    loadOrders()
  }, [user?.id])

  if (!user?.id) {
    return (
      <SafeAreaView style={styles.containerCenter}>
        <Text style={styles.note}>Login to view your orders.</Text>
      </SafeAreaView>
    )
  }

  const visibleRows = viewMode === 'preorders' ? preorders : orders

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{user.role === 'ngo' ? 'My Requests' : 'My Orders'}</Text>
        <Text style={styles.subtitle}>Track pickup timeline and status</Text>
        <View style={styles.toggleRow}>
          <Pressable
            style={[styles.toggleButton, viewMode === 'orders' && styles.toggleButtonActive]}
            onPress={() => setViewMode('orders')}
          >
            <Text style={[styles.toggleText, viewMode === 'orders' && styles.toggleTextActive]}>Orders</Text>
          </Pressable>
          <Pressable
            style={[styles.toggleButton, viewMode === 'preorders' && styles.toggleButtonActive]}
            onPress={() => setViewMode('preorders')}
          >
            <Text style={[styles.toggleText, viewMode === 'preorders' && styles.toggleTextActive]}>Preorders</Text>
          </Pressable>
        </View>
      </View>

      <FlatList
        data={visibleRows}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadOrders} />}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const linkedFood = item.food || item.listing || item.listing_id || null
          const linkedPrediction = item.prediction || null
          const currentPrice = Number(linkedFood?.price || linkedFood?.current_price || 0)
          const originalPrice = Number(linkedFood?.original_price || linkedFood?.base_price || currentPrice)
          const discountPercent =
            originalPrice > 0
              ? Math.max(0, Math.round(((originalPrice - currentPrice) / originalPrice) * 100))
              : 0

          return (
            <View style={styles.card}>
              <Text style={styles.foodName}>
                {viewMode === 'preorders'
                  ? linkedPrediction?.suggested_action || linkedPrediction?.food_name || 'Prediction preorder'
                  : linkedFood?.food_name || 'Food item'}
              </Text>
              {viewMode === 'preorders' ? (
                <Text style={styles.meta}>Prediction date: {linkedPrediction?.prediction_date || 'N/A'}</Text>
              ) : null}
              <Text style={styles.meta}>Status: {item.status}</Text>
              <Text style={styles.meta}>Pickup: {new Date(item.pickup_time).toLocaleString()}</Text>
              {viewMode === 'orders' ? <Text style={styles.meta}>Distance: 15 km</Text> : null}
              {viewMode === 'orders' ? <Text style={styles.meta}>Shop Time: 6:00 PM</Text> : null}
              <View style={styles.priceRow}>
                {viewMode === 'preorders' ? (
                  <>
                    <Text style={styles.originalPrice}>Preorder ID: {item.id}</Text>
                    <Text style={styles.discountPrice}>Linked listing: {item.listing_id || 'Pending'}</Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.originalPrice}>Original: Rs {Math.round(originalPrice)}</Text>
                    <Text style={styles.discountPrice}>Discounted: Rs {Math.round(currentPrice)}</Text>
                  </>
                )}
              </View>
              {discountPercent > 0 ? <Text style={styles.discountTag}>{discountPercent}% OFF</Text> : null}
            </View>
          )
        }}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>No {viewMode} yet.</Text> : null}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  containerCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff', padding: 16 },
  note: { textAlign: 'center', color: '#991b1b' },
  header: { padding: 16, paddingTop: 20 },
  title: { fontSize: 24, fontWeight: '700', color: '#991b1b' },
  subtitle: { marginTop: 4, color: '#b91c1c' },
  toggleRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  toggleButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#fecaca',
    backgroundColor: '#fff',
  },
  toggleButtonActive: { backgroundColor: '#dc2626', borderColor: '#dc2626' },
  toggleText: { color: '#b91c1c', fontWeight: '700' },
  toggleTextActive: { color: '#fff' },
  list: { padding: 16, gap: 12 },
  card: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#fecaca', borderRadius: 12, padding: 14 },
  foodName: { fontSize: 16, fontWeight: '700', color: '#7f1d1d' },
  meta: { marginTop: 6, color: '#991b1b' },
  priceRow: { marginTop: 10, gap: 6 },
  originalPrice: { color: '#b91c1c', textDecorationLine: 'line-through', fontWeight: '600' },
  discountPrice: { color: '#dc2626', fontWeight: '700' },
  discountTag: { marginTop: 8, color: '#dc2626', fontWeight: '700', fontSize: 12 },
  empty: { textAlign: 'center', marginTop: 40, color: '#b91c1c' },
})
