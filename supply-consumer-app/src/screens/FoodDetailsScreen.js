import { useState } from 'react'
import { Alert, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native'
import { placeOrder, requestFoodByNgo } from '../lib/api'

export default function FoodDetailsScreen({ route, navigation }) {
  const { food, user } = route.params
  const [placing, setPlacing] = useState(false)

  async function onPrimaryAction() {
    if (!user?.id) {
      Alert.alert('Missing user', 'Please login again.')
      return
    }

    setPlacing(true)
    try {
      if (user.role === 'ngo') {
        if (Number(food.price || 0) > 0) {
          Alert.alert('Not available for NGO', 'Ask provider to mark this listing as donation first.')
          return
        }

        await requestFoodByNgo({ foodId: food.id, ngoId: user.id })
        Alert.alert('Request sent', 'Your NGO request has been recorded.')
      } else {
        const pickup = new Date(Date.now() + 30 * 60 * 1000).toISOString()
        await placeOrder({ foodId: food.id, userId: user.id, pickupTime: pickup })
        Alert.alert('Order placed', 'Pickup scheduled in about 30 minutes.')
      }

      navigation.goBack()
    } catch (err) {
      Alert.alert('Action failed', err.message)
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

        <Pressable style={[styles.button, placing && styles.buttonDisabled]} onPress={onPrimaryAction} disabled={placing}>
          <Text style={styles.buttonText}>
            {placing ? 'Processing...' : user?.role === 'ngo' ? 'Request Food' : 'Place Order'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff', padding: 16 },
  card: { backgroundColor: '#fff', borderColor: '#fecaca', borderWidth: 1, borderRadius: 12, padding: 16 },
  name: { fontSize: 24, fontWeight: '700', color: '#7f1d1d' },
  price: { fontSize: 20, fontWeight: '700', color: '#dc2626', marginTop: 8 },
  meta: { marginTop: 8, color: '#991b1b' },
  button: {
    marginTop: 20,
    backgroundColor: '#dc2626',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontWeight: '700' },
})
