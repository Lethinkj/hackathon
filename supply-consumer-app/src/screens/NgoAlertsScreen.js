import { useEffect, useState } from 'react'
import { FlatList, RefreshControl, SafeAreaView, StyleSheet, Text, View } from 'react-native'
import { getNgoAlerts, subscribeFoodRealtime } from '../lib/api'

export default function NgoAlertsScreen() {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(false)

  async function loadAlerts() {
    setLoading(true)
    try {
      const rows = await getNgoAlerts()
      setAlerts(rows)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAlerts()
    const channel = subscribeFoodRealtime(loadAlerts)
    return () => {
      channel.unsubscribe()
    }
  }, [])

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>NGO Alerts</Text>
        <Text style={styles.subtitle}>Free meals available for NGO pickup</Text>
      </View>

      <FlatList
        data={alerts}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadAlerts} />}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.foodName}>{item.food_name}</Text>
            <Text style={styles.meta}>Quantity: {item.quantity}</Text>
            <Text style={styles.meta}>Type: {item.type}</Text>
            <Text style={styles.free}>FREE</Text>
          </View>
        )}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>No NGO alerts right now.</Text> : null}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { padding: 16, paddingTop: 20 },
  title: { fontSize: 24, fontWeight: '700', color: '#0f172a' },
  subtitle: { marginTop: 4, color: '#334155' },
  list: { padding: 16, gap: 12 },
  card: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 14 },
  foodName: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  meta: { marginTop: 4, color: '#475569' },
  free: { marginTop: 10, fontWeight: '700', color: '#047857' },
  empty: { textAlign: 'center', marginTop: 40, color: '#64748b' },
})
