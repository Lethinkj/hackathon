import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { StatusBar } from 'expo-status-bar'
import { MaterialIcons } from '@expo/vector-icons'
import HomeScreen from './src/screens/HomeScreen'
import FoodDetailsScreen from './src/screens/FoodDetailsScreen'
import NgoAlertsScreen from './src/screens/NgoAlertsScreen'
import OrdersScreen from './src/screens/OrdersScreen'

const Stack = createNativeStackNavigator()
const Tabs = createBottomTabNavigator()

function MainTabs() {
  return (
    <Tabs.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#1f6feb',
        tabBarInactiveTintColor: '#64748b',
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
        tabBarIcon: ({ color, size }) => {
          const names = {
            NearbyDeals: 'local-offer',
            NgoAlerts: 'volunteer-activism',
            Orders: 'shopping-bag',
          }
          return <MaterialIcons name={names[route.name]} size={size} color={color} />
        },
      })}
    >
      <Tabs.Screen name="NearbyDeals" component={HomeScreen} options={{ title: 'Deals' }} />
      <Tabs.Screen name="NgoAlerts" component={NgoAlertsScreen} options={{ title: 'NGO' }} />
      <Tabs.Screen name="Orders" component={OrdersScreen} options={{ title: 'Orders' }} />
    </Tabs.Navigator>
  )
}

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Stack.Navigator>
        <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
        <Stack.Screen
          name="FoodDetails"
          component={FoodDetailsScreen}
          options={{ title: 'Food Details', headerBackTitle: 'Back' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  )
}
