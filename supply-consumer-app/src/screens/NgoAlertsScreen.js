import { useEffect, useState } from 'react'
import { FlatList, Pressable, RefreshControl, SafeAreaView, StyleSheet, Text, View } from 'react-native'
import { getNgoAlerts, subscribeFoodRealtime } from '../lib/api'

export default function NgoAlertsScreen({ navigation, user }) {
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
          <Pressable style={styles.card} onPress={() => navigation.navigate('FoodDetails', { food: item, user })}>
            <Text style={styles.foodName}>{item.food_name}</Text>
            <Text style={styles.meta}>Quantity: {item.quantity}</Text>
            <Text style={styles.meta}>Type: {item.type}</Text>
            <Text style={styles.free}>FREE</Text>
          </Pressable>
        )}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>No NGO alerts right now.</Text> : null}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  header: { padding: 16, paddingTop: 20 },
  title: { fontSize: 24, fontWeight: '700', color: '#991b1b' },
  subtitle: { marginTop: 4, color: '#b91c1c' },
  list: { padding: 16, gap: 12 },
  card: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#fecaca', borderRadius: 12, padding: 14 },
  foodName: { fontSize: 16, fontWeight: '700', color: '#7f1d1d' },
  meta: { marginTop: 4, color: '#991b1b' },
  free: { marginTop: 10, fontWeight: '700', color: '#dc2626' },
  empty: { textAlign: 'center', marginTop: 40, color: '#b91c1c' },
})
