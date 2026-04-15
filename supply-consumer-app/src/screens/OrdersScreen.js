import { useEffect, useState } from 'react'
import { FlatList, RefreshControl, SafeAreaView, StyleSheet, Text, View } from 'react-native'
import { getOrders } from '../lib/api'

export default function OrdersScreen() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const userId = process.env.EXPO_PUBLIC_DEMO_USER_ID || ''

  async function loadOrders() {
    if (!userId) return
    setLoading(true)
    try {
      const rows = await getOrders(userId)
      setOrders(rows)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrders()
  }, [userId])

  if (!userId) {
    return (
      <SafeAreaView style={styles.containerCenter}>
        <Text style={styles.note}>Set EXPO_PUBLIC_DEMO_USER_ID to view orders.</Text>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Orders</Text>
        <Text style={styles.subtitle}>Track pickup timeline and status</Text>
      </View>

      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadOrders} />}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.foodName}>{item.food?.food_name || 'Food item'}</Text>
            <Text style={styles.meta}>Status: {item.status}</Text>
            <Text style={styles.meta}>Pickup: {new Date(item.pickup_time).toLocaleString()}</Text>
          </View>
        )}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>No orders yet.</Text> : null}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  containerCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', padding: 16 },
  note: { textAlign: 'center', color: '#475569' },
  header: { padding: 16, paddingTop: 20 },
  title: { fontSize: 24, fontWeight: '700', color: '#0f172a' },
  subtitle: { marginTop: 4, color: '#334155' },
  list: { padding: 16, gap: 12 },
  card: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 14 },
  foodName: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  meta: { marginTop: 6, color: '#475569' },
  empty: { textAlign: 'center', marginTop: 40, color: '#64748b' },
})
