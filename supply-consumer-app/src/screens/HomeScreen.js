import { useEffect, useState } from 'react'
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { getLiveSurplus, getNearbyFood, getSupplierPrediction, subscribeFoodRealtime } from '../lib/api'

export default function HomeScreen({ navigation, user }) {
  const [foods, setFoods] = useState([])
  const [loading, setLoading] = useState(false)
  const [liveSurplus, setLiveSurplus] = useState(null)
  const [prediction, setPrediction] = useState(null)

  const demoSupplierId = process.env.EXPO_PUBLIC_DEMO_SUPPLIER_ID || 'sup-001'

  function onOpenDetails(item) {
    if (user?.role === 'provider') {
      Alert.alert('Providers', 'Use My Listings to update food details or donate.')
      return
    }

    navigation.navigate('FoodDetails', { food: item, user })
  }

  async function loadData() {
    setLoading(true)
    try {
      const [rows, liveData, predictionData] = await Promise.all([
        getNearbyFood(),
        getLiveSurplus(),
        getSupplierPrediction(demoSupplierId),
      ])
      setFoods(rows)
      setLiveSurplus(liveData)
      setPrediction(predictionData?.current_prediction || predictionData)
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

      <View style={styles.predictionBanner}>
        <Text style={styles.predictionLabel}>AI surplus forecast</Text>
        <Text style={styles.predictionTitle}>
          {prediction?.suggested_action || 'Monitor demand'} · {prediction?.predicted_surplus ?? 0} units expected
        </Text>
        <Text style={styles.predictionMeta}>{prediction?.confidence_score ?? 0}% confidence · {liveSurplus?.count ?? foods.length} live offers</Text>
      </View>

      <FlatList
        data={foods}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadData} />}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() => onOpenDetails(item)}
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
  container: { flex: 1, backgroundColor: '#ffffff' },
  header: { padding: 16, paddingTop: 20 },
  title: { fontSize: 24, fontWeight: '700', color: '#991b1b' },
  subtitle: { marginTop: 4, color: '#b91c1c' },
  predictionBanner: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  predictionLabel: { color: '#dc2626', fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  predictionTitle: { color: '#7f1d1d', fontSize: 15, fontWeight: '700', marginTop: 4 },
  predictionMeta: { color: '#991b1b', fontSize: 12, marginTop: 6 },
  list: { padding: 16, gap: 12 },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  foodName: { fontSize: 16, fontWeight: '700', color: '#7f1d1d' },
  price: { fontSize: 16, fontWeight: '700', color: '#dc2626' },
  meta: { color: '#991b1b', marginTop: 6, fontSize: 13 },
  discount: { marginTop: 8, color: '#dc2626', fontWeight: '700', fontSize: 12 },
  empty: { textAlign: 'center', marginTop: 40, color: '#b91c1c' },
})
