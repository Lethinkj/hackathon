import { useEffect, useState } from 'react'
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { donateFood, getProviderFood, subscribeFoodRealtime, updateFood } from '../lib/api'

function ListingCard({ item, onUpdated, onDonated }) {
  const [price, setPrice] = useState(String(Math.round(item.original_price || item.price || 0)))
  const [quantity, setQuantity] = useState(String(item.quantity || 1))
  const [saving, setSaving] = useState(false)

  async function saveChanges() {
    setSaving(true)
    try {
      await updateFood(item.id, {
        price: Number(price),
        original_price: Number(price),
        quantity: Number(quantity),
      })
      Alert.alert('Updated', 'Food details updated successfully.')
      onUpdated()
    } catch (err) {
      Alert.alert('Update failed', err.message)
    } finally {
      setSaving(false)
    }
  }

  async function markDonate() {
    setSaving(true)
    try {
      await donateFood(item.id)
      Alert.alert('Donation enabled', 'This listing is now free for NGO requests.')
      onDonated()
    } catch (err) {
      Alert.alert('Action failed', err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <View style={styles.card}>
      <Text style={styles.foodName}>{item.food_name}</Text>
      <Text style={styles.meta}>Status: {item.status}</Text>
      <Text style={styles.meta}>Type: {item.type}</Text>
      <View style={styles.row}>
        <View style={styles.fieldBlock}>
          <Text style={styles.label}>Price</Text>
          <TextInput value={price} onChangeText={setPrice} keyboardType="numeric" style={styles.input} />
        </View>
        <View style={styles.fieldBlock}>
          <Text style={styles.label}>Qty</Text>
          <TextInput value={quantity} onChangeText={setQuantity} keyboardType="numeric" style={styles.input} />
        </View>
      </View>
      <View style={styles.actions}>
        <Pressable style={[styles.button, saving && styles.disabled]} onPress={saveChanges} disabled={saving}>
          <Text style={styles.buttonText}>Update</Text>
        </Pressable>
        <Pressable
          style={[styles.button, styles.donateButton, saving && styles.disabled]}
          onPress={markDonate}
          disabled={saving}
        >
          <Text style={styles.buttonText}>Donate</Text>
        </Pressable>
      </View>
    </View>
  )
}

export default function ProviderListingsScreen({ user }) {
  const [foods, setFoods] = useState([])
  const [loading, setLoading] = useState(false)

  async function loadData() {
    setLoading(true)
    try {
      const rows = await getProviderFood(user.id)
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
  }, [user.id])

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Listings</Text>
        <Text style={styles.subtitle}>Only providers can update or donate listings</Text>
      </View>
      <FlatList
        data={foods}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadData} />}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => <ListingCard item={item} onUpdated={loadData} onDonated={loadData} />}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>No listings found for your account.</Text> : null}
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
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  foodName: { fontSize: 16, fontWeight: '700', color: '#7f1d1d' },
  meta: { color: '#991b1b', marginTop: 6, fontSize: 13 },
  row: { flexDirection: 'row', gap: 10, marginTop: 10 },
  fieldBlock: { flex: 1 },
  label: { color: '#991b1b', fontSize: 12, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#fca5a5',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: '#7f1d1d',
    backgroundColor: '#ffffff',
  },
  actions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  button: {
    flex: 1,
    backgroundColor: '#dc2626',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    height: 38,
  },
  donateButton: { backgroundColor: '#b91c1c' },
  buttonText: { color: '#fff', fontWeight: '700' },
  disabled: { opacity: 0.6 },
  empty: { textAlign: 'center', marginTop: 40, color: '#b91c1c' },
})
