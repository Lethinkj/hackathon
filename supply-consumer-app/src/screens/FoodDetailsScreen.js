import { useState } from 'react'
import { Alert, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native'
import { placeOrder } from '../lib/api'

export default function FoodDetailsScreen({ route, navigation }) {
  const { food, userId } = route.params
  const [placing, setPlacing] = useState(false)

  async function onOrder() {
    if (!userId) {
      Alert.alert('Missing demo user ID', 'Set EXPO_PUBLIC_DEMO_USER_ID to place orders.')
      return
    }

    setPlacing(true)
    try {
      const pickup = new Date(Date.now() + 30 * 60 * 1000).toISOString()
      await placeOrder({ foodId: food.id, userId, pickupTime: pickup })
      Alert.alert('Order placed', 'Pickup scheduled in about 30 minutes.')
      navigation.goBack()
    } catch (err) {
      Alert.alert('Order failed', err.message)
    } finally {
      setPlacing(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.name}>{food.food_name}</Text>
        <Text style={styles.price}>Rs {Math.round(food.price)}</Text>
        <Text style={styles.meta}>Original: Rs {Math.round(food.original_price || 0)}</Text>
        <Text style={styles.meta}>Quantity: {food.quantity}</Text>
        <Text style={styles.meta}>Type: {food.type}</Text>
        <Text style={styles.meta}>Status: {food.status}</Text>
        <Text style={styles.meta}>Expiry: {new Date(food.expiry_time).toLocaleString()}</Text>

        <Pressable style={[styles.button, placing && styles.buttonDisabled]} onPress={onOrder} disabled={placing}>
          <Text style={styles.buttonText}>{placing ? 'Placing...' : 'Place Order'}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 16 },
  card: { backgroundColor: '#fff', borderColor: '#e2e8f0', borderWidth: 1, borderRadius: 12, padding: 16 },
  name: { fontSize: 24, fontWeight: '700', color: '#0f172a' },
  price: { fontSize: 20, fontWeight: '700', color: '#1d4ed8', marginTop: 8 },
  meta: { marginTop: 8, color: '#334155' },
  button: {
    marginTop: 20,
    backgroundColor: '#1d4ed8',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontWeight: '700' },
})
