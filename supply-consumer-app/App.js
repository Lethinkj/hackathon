import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { StatusBar } from 'expo-status-bar'
import { MaterialIcons } from '@expo/vector-icons'
import { Pressable, Text } from 'react-native'
import { useMemo, useState } from 'react'
import HomeScreen from './src/screens/HomeScreen'
import FoodDetailsScreen from './src/screens/FoodDetailsScreen'
import NgoAlertsScreen from './src/screens/NgoAlertsScreen'
import OrdersScreen from './src/screens/OrdersScreen'
import AuthScreen from './src/screens/AuthScreen'
import ProviderListingsScreen from './src/screens/ProviderListingsScreen'
import ProviderOrdersScreen from './src/screens/ProviderOrdersScreen'

const Stack = createNativeStackNavigator()
const Tabs = createBottomTabNavigator()

function MainTabs({ user, onLogout }) {
  const roleTabs = useMemo(() => {
    if (user.role === 'provider') {
      return [
        { name: 'MyListings', title: 'Listings', icon: 'inventory-2', component: ProviderListingsScreen },
        { name: 'ProviderOrders', title: 'Orders', icon: 'shopping-bag', component: ProviderOrdersScreen },
      ]
    }

    if (user.role === 'ngo') {
      return [
        { name: 'NgoAlerts', title: 'NGO', icon: 'volunteer-activism', component: NgoAlertsScreen },
        { name: 'Orders', title: 'Orders', icon: 'shopping-bag', component: OrdersScreen },
      ]
    }

    return [
      { name: 'NearbyDeals', title: 'Deals', icon: 'local-offer', component: HomeScreen },
      { name: 'Orders', title: 'Orders', icon: 'shopping-bag', component: OrdersScreen },
    ]
  }, [user.role])

  return (
    <Tabs.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
        tabBarActiveTintColor: '#dc2626',
        tabBarInactiveTintColor: '#b91c1c',
        tabBarStyle: { backgroundColor: '#ffffff' },
        headerStyle: { backgroundColor: '#ffffff' },
        headerTitleStyle: { color: '#991b1b', fontWeight: '700' },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
        headerRight: () => (
          <Pressable onPress={onLogout}>
            <Text style={{ color: '#dc2626', fontWeight: '700' }}>Logout</Text>
          </Pressable>
        ),
        tabBarIcon: ({ color, size }) => {
          const tab = roleTabs.find((entry) => entry.name === route.name)
          return <MaterialIcons name={tab?.icon || 'apps'} size={size} color={color} />
        },
      })}
    >
      {roleTabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{ title: tab.title }}
        >
          {(props) => <tab.component {...props} user={user} />}
        </Tabs.Screen>
      ))}
    </Tabs.Navigator>
  )
}

export default function App() {
  const [user, setUser] = useState(null)

  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Stack.Navigator>
        {!user ? (
          <Stack.Screen name="Auth" options={{ headerShown: false }}>
            {(props) => <AuthScreen {...props} onAuthenticated={setUser} />}
          </Stack.Screen>
        ) : (
          <Stack.Screen name="Main" options={{ headerShown: false }}>
            {(props) => <MainTabs {...props} user={user} onLogout={() => setUser(null)} />}
          </Stack.Screen>
        )}
        <Stack.Screen
          name="FoodDetails"
          component={FoodDetailsScreen}
          options={{ title: 'Food Details', headerBackTitle: 'Back' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  )
}
