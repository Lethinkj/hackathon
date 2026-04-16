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
import { getLiveSurplus, getPredictionProducts, preOrderPrediction } from '../lib/api'
import { useRealtimePredictionUpdates } from '../hooks/useRealtimeFoodUpdates'

export default function HomeScreen({ navigation, user }) {
  const [foods, setFoods] = useState([])
  const [loading, setLoading] = useState(false)
  const [liveSurplus, setLiveSurplus] = useState(null)
  const [prediction, setPrediction] = useState(null)
  const [predictionSourceId, setPredictionSourceId] = useState(null)
  const [error, setError] = useState('')
  const [prebookingId, setPrebookingId] = useState('')

  function onOpenDetails(item) {
    Alert.alert(
      'Predicted Product',
      `${item.food_name}\nPredicted qty: ${item.quantity}\nConfidence: ${Math.round(item.confidence_score || 0)}%`
    )
  }

  async function onPreOrder(item) {
    if (!user?.id) {
      Alert.alert('Login required', 'Please login to place a preorder.')
      return
    }
    
    setPrebookingId(item.id)
    try {
      const pickup = new Date(Date.now() + 45 * 60 * 1000).toISOString()
      await preOrderPrediction({
        predictionId: item.prediction_id || item.id,
        userId: user.id,
        pickupTime: pickup,
        listingId: item.listing_id || null,
      })

      Alert.alert('Preordered', 'Your preorder has been placed successfully.')
    } catch (err) {
      Alert.alert('Preorder failed', err?.message || 'Could not place this preorder right now.')
    } finally {
      setPrebookingId('')
    }
  }

  async function loadData() {
    setLoading(true)
    setError('')
    try {
      const [rows, liveData] = await Promise.all([
        getPredictionProducts(500),
        getLiveSurplus(),
      ])

      const topPrediction = rows[0] || null
      setFoods(rows)
      setLiveSurplus(liveData)
      setPrediction(topPrediction)
      setPredictionSourceId(topPrediction?.supplier_id || null)
    } catch (err) {
      setFoods([])
      setPrediction(null)
      setPredictionSourceId(null)
      setError(err?.message || 'Failed to load prediction products')
    } finally {
      setLoading(false)
    }
  }

  useRealtimePredictionUpdates((update) => {
    console.log('[HomeScreen] Real-time prediction update:', update.type, update.data?.id)
    void loadData()
  })

  useEffect(() => {
    loadData()
  }, [])

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Predicted Products</Text>
        <Text style={styles.subtitle}>AI product list from predictions table</Text>
      </View>

      {!!error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={styles.predictionBanner}>
        <Text style={styles.predictionLabel}>AI surplus forecast</Text>
        <Text style={styles.predictionTitle}>
          {prediction?.suggested_action || 'Monitor demand'} · {prediction?.predicted_surplus ?? 0} units expected
        </Text>
        <Text style={styles.predictionMeta}>
          {prediction?.confidence_score ?? 0}% confidence · {liveSurplus?.count ?? foods.length} live offers
          {predictionSourceId ? ` · supplier ${String(predictionSourceId).slice(0, 8)}` : ''}
        </Text>
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
              <Text style={styles.price}>{Math.round(item.confidence_score || 0)}%</Text>
            </View>
            <Text style={styles.meta}>Qty: {item.quantity} | Type: {item.type}</Text>
            <Text style={styles.meta}>Supplier: {item.supplier_name || 'Local supplier'}</Text>
            <Text style={styles.meta}>Prediction Date: {item.prediction_date || 'N/A'}</Text>
            <Text style={styles.discount}>Predicted Surplus: {Math.round(item.predicted_surplus || 0)}</Text>
            <View style={styles.actionsRow}>
              <Pressable
                style={[styles.prebookBtn, prebookingId === item.id && styles.prebookBtnDisabled]}
                onPress={() => onPreOrder(item)}
                disabled={prebookingId === item.id}
              >
                <Text style={styles.prebookBtnText}>
                  {prebookingId === item.id ? 'Preordering...' : 'Pre order'}
                </Text>
              </Pressable>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>No predicted products right now.</Text> : null}
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
  actionsRow: { marginTop: 10, flexDirection: 'row', justifyContent: 'flex-end' },
  prebookBtn: {
    backgroundColor: '#dc2626',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  prebookBtnDisabled: { opacity: 0.7 },
  prebookBtnText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  empty: { textAlign: 'center', marginTop: 40, color: '#b91c1c' },
  errorText: { color: '#b91c1c', marginHorizontal: 16, marginBottom: 8 },
})
