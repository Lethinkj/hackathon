import { useEffect, useState } from 'react'
import {
  FlatList,
  Pressable,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { getNearbyFood, subscribeFoodRealtime } from '../lib/api'

export default function HomeScreen({ navigation }) {
  const [foods, setFoods] = useState([])
  const [loading, setLoading] = useState(false)
  const userId = process.env.EXPO_PUBLIC_DEMO_USER_ID || ''

  async function loadData() {
    setLoading(true)
    try {
      const rows = await getNearbyFood()
      setFoods(rows)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    const channel = subscribeFoodRealtime(loadData)
    return () => {
      channel.unsubscribe()
    }
  }, [])

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Nearby Deals</Text>
        <Text style={styles.subtitle}>Live surplus food listings near you</Text>
      </View>

      <FlatList
        data={foods}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadData} />}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() => navigation.navigate('FoodDetails', { food: item, userId })}
          >
            <View style={styles.rowBetween}>
              <Text style={styles.foodName}>{item.food_name}</Text>
              <Text style={styles.price}>Rs {Math.round(item.price)}</Text>
            </View>
            <Text style={styles.meta}>Qty: {item.quantity} | Type: {item.type}</Text>
            <Text style={styles.meta}>Expires: {new Date(item.expiry_time).toLocaleString()}</Text>
            {!!item.discount && <Text style={styles.discount}>{item.discount}% OFF</Text>}
          </Pressable>
        )}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>No food available right now.</Text> : null}
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
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  foodName: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  price: { fontSize: 16, fontWeight: '700', color: '#1d4ed8' },
  meta: { color: '#475569', marginTop: 6, fontSize: 13 },
  discount: { marginTop: 8, color: '#b45309', fontWeight: '700', fontSize: 12 },
  empty: { textAlign: 'center', marginTop: 40, color: '#64748b' },
})
