import { useEffect, useState } from 'react'
import { FlatList, RefreshControl, SafeAreaView, StyleSheet, Text, View } from 'react-native'
import { getOrders } from '../lib/api'

export default function OrdersScreen({ user }) {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)

  async function loadOrders() {
    if (!user?.id) return
    setLoading(true)
    try {
      const rows = await getOrders(user.id)
      setOrders(rows)
    } finally {
      setLoading(false)
    }
  }

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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{user.role === 'ngo' ? 'My Requests' : 'My Orders'}</Text>
        <Text style={styles.subtitle}>Track pickup timeline and status</Text>
      </View>

      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadOrders} />}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const currentPrice = Number(item.food?.price || 0)
          const originalPrice = Number(item.food?.original_price || currentPrice)
          const discountPercent =
            originalPrice > 0
              ? Math.max(0, Math.round(((originalPrice - currentPrice) / originalPrice) * 100))
              : 0

          return (
            <View style={styles.card}>
              <Text style={styles.foodName}>{item.food?.food_name || 'Food item'}</Text>
              <Text style={styles.meta}>Status: {item.status}</Text>
              <Text style={styles.meta}>Pickup: {new Date(item.pickup_time).toLocaleString()}</Text>
              <Text style={styles.meta}>Distance: 15 km</Text>
              <Text style={styles.meta}>Shop Time: 6:00 PM</Text>
              <View style={styles.priceRow}>
                <Text style={styles.originalPrice}>Original: Rs {Math.round(originalPrice)}</Text>
                <Text style={styles.discountPrice}>Discounted: Rs {Math.round(currentPrice)}</Text>
              </View>
              {discountPercent > 0 ? <Text style={styles.discountTag}>{discountPercent}% OFF</Text> : null}
            </View>
          )
        }}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>No orders yet.</Text> : null}
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
