/**
 * EXAMPLE: Consumer App - HomeScreen with Real-Time Food Updates
 * 
 * This example shows how to integrate Supabase realtime into the consumer app
 * to display live food listings and receive notifications of new items.
 */

import React, { useState, useEffect } from 'react'
import { View, FlatList, Text, TouchableOpacity, ActivityIndicator } from 'react-native'
import { useRealtimeFoodUpdates } from '../hooks/useRealtimeFoodUpdates'
import { getNearbyFood } from '../lib/api'

export default function HomeScreenWithRealtime() {
  const [foods, setFoods] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch initial data
  useEffect(() => {
    async function loadFoods() {
      try {
        setLoading(true)
        const data = await getNearbyFood()
        setFoods(data)
        setError(null)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadFoods()
  }, [])

  // Subscribe to real-time updates
  useRealtimeFoodUpdates((update) => {
    console.log('Real-time food update:', update.type, update.data.id)

    switch (update.type) {
      case 'insert':
        // New food listing added by provider
        setFoods(prevFoods => {
          // Avoid duplicates
          if (prevFoods.some(f => f.id === update.data.id)) {
            return prevFoods
          }
          return [update.data, ...prevFoods]
        })
        // Show toast notification
        showNotification(`New food available: ${update.data.food_name}`)
        break

      case 'update':
        // Food listing updated (price, status, quantity changed)
        setFoods(prevFoods =>
          prevFoods
            .map(f => (f.id === update.data.id ? update.data : f))
            .filter(f => f.status === 'available') // Remove expired/unavailable
        )
        break

      case 'delete':
        // Food listing removed by provider
        setFoods(prevFoods => prevFoods.filter(f => f.id !== update.data.id))
        break
    }
  })

  const renderFoodItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => handleSelectFood(item)}
      style={{
        padding: 10,
        marginBottom: 10,
        backgroundColor: '#f0f0f0',
        borderRadius: 8,
      }}
    >
      <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{item.food_name}</Text>
      <Text>Price: Rs {item.price}</Text>
      <Text>Quantity: {item.quantity}</Text>
      <Text>Status: {item.status}</Text>
    </TouchableOpacity>
  )

  const handleSelectFood = (food) => {
    // Navigate to food details screen
    console.log('Selected food:', food)
  }

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
        <Text>Loading available food...</Text>
      </View>
    )
  }

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: 'red' }}>Error: {error}</Text>
        <TouchableOpacity
          onPress={() => {
            setLoading(true)
            setError(null)
          }}
        >
          <Text style={{ color: 'blue', marginTop: 10 }}>Retry</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={{ flex: 1, padding: 10 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
        Available Food ({foods.length})
      </Text>

      <FlatList
        data={foods}
        renderItem={renderFoodItem}
        keyExtractor={item => item.id}
        ListEmptyComponent={
          <Text style={{ textAlign: 'center', marginTop: 20 }}>
            No food available right now. Check back later!
          </Text>
        }
      />
    </View>
  )
}

function showNotification(message) {
  // Implement your notification logic here
  console.log('NOTIFICATION:', message)
  // Could use react-native-notifications, expo-notifications, etc.
}
