# Supabase Realtime Integration Guide

This document explains how to use real-time features to connect the consumer app and provider app.

## Overview

The system uses Supabase real-time subscriptions to keep both consumer and provider apps synchronized with live data updates. Key entities that support real-time:

- **Food Listings** - New food items, price updates, status changes
- **Orders/Requests** - Consumer orders, NGO requests, status updates
- **Donations** - Donation alerts, volunteer assignments
- **User Updates** - Rating changes, profile updates

## Architecture

### Backend (Node.js/Express)
- **realtime.js** - Subscription setup and management
- Provides functions for subscribing to database changes
- Manages multiple channels for different entity types

### Consumer App (React Native/Expo)
- **hooks/useRealtimeFoodUpdates.js** - React hooks for real-time updates
- Subscribes to food listing, order, request, and donation changes
- Automatically unsubscribes on component unmount

### Provider App (React/Vite)
- **hooks/useRealtimeOrders.js** - React hooks for order/request subscriptions
- **hooks/useRealtimeFoods.js** - Advanced food listing lifecycle management
- Handles automatic price reduction and status transitions

## Usage Examples

### Consumer App - Listen for Food Updates

```javascript
import { useRealtimeFoodUpdates } from '../hooks/useRealtimeFoodUpdates'
import { useState } from 'react'

function NearbyFoodsScreen() {
  const [foods, setFoods] = useState([])
  
  useRealtimeFoodUpdates((update) => {
    console.log('Food update:', update.type, update.data)
    
    if (update.type === 'insert') {
      setFoods(prev => [update.data, ...prev])
    } else if (update.type === 'update') {
      setFoods(prev => prev.map(f => 
        f.id === update.data.id ? update.data : f
      ))
    } else if (update.type === 'delete') {
      setFoods(prev => prev.filter(f => f.id !== update.data.id))
    }
  })

  return (
    // Render foods...
  )
}
```

### Consumer App - Listen for Order Updates

```javascript
import { useRealtimeOrderUpdates } from '../hooks/useRealtimeFoodUpdates'
import { useState } from 'react'

function OrdersScreen({ userId }) {
  const [orders, setOrders] = useState([])
  
  useRealtimeOrderUpdates((update) => {
    if (update.data.user_id === userId) {
      console.log('Order status changed:', update.data.status)
      
      if (update.type === 'update') {
        setOrders(prev => prev.map(o =>
          o.id === update.data.id ? update.data : o
        ))
      }
    }
  })

  return (
    // Render orders...
  )
}
```

### Consumer App - NGO Alert Notifications

```javascript
import { useRealtimeDonationUpdates } from '../hooks/useRealtimeFoodUpdates'
import { useState } from 'react'

function NGOAlertsScreen({ ngoId }) {
  const [alerts, setAlerts] = useState([])
  
  useRealtimeDonationUpdates((update) => {
    if (update.type === 'insert') {
      // New donation available!
      setAlerts(prev => [update.data, ...prev])
      // Show notification
      showNotification(`New donation available!`)
    }
  })

  return (
    // Render alerts...
  )
}
```

### Provider App - Listen for Incoming Orders

```javascript
import { useRealtimeOrders } from '../hooks/useRealtimeOrders'
import { useState } from 'react'

function OrdersPage({ providerId }) {
  const [requests, setRequests] = useState([])
  
  useRealtimeOrders(providerId, (update) => {
    console.log('New order request:', update.data)
    
    if (update.type === 'insert') {
      setRequests(prev => [update.data, ...prev])
      // Play sound notification
      playNotificationSound()
    } else if (update.type === 'update') {
      setRequests(prev => prev.map(r =>
        r.id === update.data.id ? update.data : r
      ))
    }
  })

  return (
    // Render incoming orders...
  )
}
```

### Provider App - Monitor Consumer Activity

```javascript
import { useRealtimeConsumerActivity } from '../hooks/useRealtimeOrders'
import { useState } from 'react'

function AnalyticsPage() {
  const [activityLog, setActivityLog] = useState([])
  
  useRealtimeConsumerActivity((update) => {
    setActivityLog(prev => [
      {
        timestamp: new Date(),
        type: update.type,
        ...update.data
      },
      ...prev
    ])
  })

  return (
    // Render activity log...
  )
}
```

### Provider App - Using Existing Food Hook (Enhanced)

```javascript
import { useRealtimeFoods } from '../hooks/useRealtimeFoods'

function ListingsPage({ providerId }) {
  // This hook automatically:
  // 1. Fetches all listings for the provider
  // 2. Subscribes to real-time updates
  // 3. Updates prices every minute (if auto-reduction enabled)
  // 4. Refreshes on any change
  
  const { foods, loading, error, refreshFoods } = useRealtimeFoods(providerId)

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage error={error} />

  return (
    <div>
      {foods.map(food => (
        <FoodCard key={food.id} food={food} />
      ))}
      <button onClick={() => refreshFoods()}>Refresh</button>
    </div>
  )
}
```

## Data Flow Diagram

```
Consumer App                    Supabase                    Provider App
    │                              │                              │
    ├─ Subscribe to:              │                              │
    │  - food updates ────────────┤                              │
    │  - requests                 │                              │
    │  - donations                │                              │
    │                             │                              │
    │                             ├─ Listen for:               │
    │                             │  - food inserts/updates    │
    │                             │  - request changes ────────┤
    │                             │  - donations              │
    │                             │                           │
    ├─ Create Order ─────────────┤                           │
    │                             ├─ Update food status ──────┤
    │                             │  (SOLD, DISCOUNT, DONATE) │
    │                             │                           │
    │                             ├─ Broadcast to all ───────┤
    │                             │  connected clients        │
    │                             │                           │
    ├─ Receive order update ──────┤                           │
    │  (pickup_time, status)      │                           │
    │                             │                           │
    │                             ├─ Update listing ─────────┤
    │                             │  quantity, price          │
```

## Real-Time Event Types

### Food Updates
```javascript
{
  type: 'insert' | 'update' | 'delete',
  data: {
    id: uuid,
    provider_id: uuid,
    name: string,
    quantity: number,
    base_price: number,
    current_price: number,
    status: 'SELL' | 'DISCOUNT' | 'DONATE' | 'EXPIRED',
    created_at: timestamp,
    expiry_time: timestamp,
    ...
  },
  table: 'food' | 'foods'
}
```

### Order/Request Updates
```javascript
{
  type: 'insert' | 'update' | 'delete',
  data: {
    id: uuid,
    food_id: uuid,
    requester_type: 'consumer' | 'ngo',
    status: 'pending' | 'accepted' | 'rejected',
    user_id: uuid,
    created_at: timestamp,
    ...
  }
}
```

### Donation Updates
```javascript
{
  type: 'insert' | 'update' | 'delete',
  data: {
    id: uuid,
    food_id: uuid,
    ngo_id: uuid,
    volunteer_assigned: boolean,
    created_at: timestamp,
    ...
  }
}
```

## Best Practices

1. **Always Unsubscribe**: Use cleanup functions in useEffect to prevent memory leaks
   ```javascript
   useEffect(() => {
     return () => channel.unsubscribe()
   }, [])
   ```

2. **Debounce Updates**: For high-frequency updates, consider debouncing
   ```javascript
   const debouncedUpdate = debounce((data) => {
     setFoods(prev => [...prev, data])
   }, 500)
   ```

3. **Handle Errors**: Always include error handlers
   ```javascript
   .on('*', payload => {
     if (payload.error) {
       console.error('Realtime error:', payload.error)
     }
   })
   ```

4. **Filter Early**: Use Supabase filters to reduce data transfer
   ```javascript
   table: 'requests',
   filter: `food_id=in(select id from foods where provider_id=eq.${providerId})`
   ```

5. **Show Loading States**: Indicate to users when real-time connections are active

## Testing Real-Time

### Manual Testing

1. Open provider app in browser
2. Open consumer app in another browser/device
3. Create a listing in provider app
4. Check consumer app receives update immediately
5. Create order in consumer app
6. Check provider app receives request immediately

### Testing with Mock Updates

```javascript
// Backend: Manually trigger updates for testing
async function testRealtime() {
  const { data, error } = await supabase
    .from('foods')
    .insert({ provider_id: testProviderId, name: 'Test Food', ... })
  
  // All connected clients will receive this update
}
```

## Troubleshooting

### Realtime not updating?
1. Check that Supabase realtime is enabled in project settings
2. Verify RLS (Row Level Security) policies allow read access
3. Check browser console for errors
4. Verify you're subscribed to correct table/channel name

### Missed updates?
1. Ensure you subscribed BEFORE data changes
2. Use initial data fetch + realtime subscribe pattern
3. Implement reconnection logic for dropped connections

### Performance issues?
1. Use filters to reduce number of events
2. Debounce or throttle update callbacks
3. Consider unsubscribing when component not visible
4. Profile realtime events in Supabase dashboard

## Configuration

### Environment Variables Needed

```env
# Backend
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key

# Consumer App
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Provider App
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Resources

- [Supabase Realtime Documentation](https://supabase.com/docs/guides/realtime)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [Real-time Subscriptions](https://supabase.com/docs/guides/realtime/subscribing-to-events)
# Supabase Realtime Integration Guide

This document explains how to use real-time features to connect the consumer app and provider app.

## Overview

The system uses Supabase real-time subscriptions to keep both consumer and provider apps synchronized with live data updates. Key entities that support real-time:

- **Food Listings** - New food items, price updates, status changes
- **Orders/Requests** - Consumer orders, NGO requests, status updates
- **Donations** - Donation alerts, volunteer assignments
- **User Updates** - Rating changes, profile updates

## Architecture

### Backend (Node.js/Express)
- **realtime.js** - Subscription setup and management
- Provides functions for subscribing to database changes
- Manages multiple channels for different entity types

### Consumer App (React Native/Expo)
- **hooks/useRealtimeFoodUpdates.js** - React hooks for real-time updates
- Subscribes to food listing, order, request, and donation changes
- Automatically unsubscribes on component unmount

### Provider App (React/Vite)
- **hooks/useRealtimeOrders.js** - React hooks for order/request subscriptions
- **hooks/useRealtimeFoods.js** - Advanced food listing lifecycle management
- Handles automatic price reduction and status transitions

## Usage Examples

### Consumer App - Listen for Food Updates

```javascript
import { useRealtimeFoodUpdates } from '../hooks/useRealtimeFoodUpdates'
import { useState } from 'react'

function NearbyFoodsScreen() {
  const [foods, setFoods] = useState([])
  
  useRealtimeFoodUpdates((update) => {
    console.log('Food update:', update.type, update.data)
    
    if (update.type === 'insert') {
      setFoods(prev => [update.data, ...prev])
    } else if (update.type === 'update') {
      setFoods(prev => prev.map(f => 
        f.id === update.data.id ? update.data : f
      ))
    } else if (update.type === 'delete') {
      setFoods(prev => prev.filter(f => f.id !== update.data.id))
    }
  })

  return (
    // Render foods...
  )
}
```

### Consumer App - Listen for Order Updates

```javascript
import { useRealtimeOrderUpdates } from '../hooks/useRealtimeFoodUpdates'
import { useState } from 'react'

function OrdersScreen({ userId }) {
  const [orders, setOrders] = useState([])
  
  useRealtimeOrderUpdates((update) => {
    if (update.data.user_id === userId) {
      console.log('Order status changed:', update.data.status)
      
      if (update.type === 'update') {
        setOrders(prev => prev.map(o =>
          o.id === update.data.id ? update.data : o
        ))
      }
    }
  })

  return (
    // Render orders...
  )
}
```

### Consumer App - NGO Alert Notifications

```javascript
import { useRealtimeDonationUpdates } from '../hooks/useRealtimeFoodUpdates'
import { useState } from 'react'

function NGOAlertsScreen({ ngoId }) {
  const [alerts, setAlerts] = useState([])
  
  useRealtimeDonationUpdates((update) => {
    if (update.type === 'insert') {
      // New donation available!
      setAlerts(prev => [update.data, ...prev])
      // Show notification
      showNotification(`New donation available!`)
    }
  })

  return (
    // Render alerts...
  )
}
```

### Provider App - Listen for Incoming Orders

```javascript
import { useRealtimeOrders } from '../hooks/useRealtimeOrders'
import { useState } from 'react'

function OrdersPage({ providerId }) {
  const [requests, setRequests] = useState([])
  
  useRealtimeOrders(providerId, (update) => {
    console.log('New order request:', update.data)
    
    if (update.type === 'insert') {
      setRequests(prev => [update.data, ...prev])
      // Play sound notification
      playNotificationSound()
    } else if (update.type === 'update') {
      setRequests(prev => prev.map(r =>
        r.id === update.data.id ? update.data : r
      ))
    }
  })

  return (
    // Render incoming orders...
  )
}
```

### Provider App - Monitor Consumer Activity

```javascript
import { useRealtimeConsumerActivity } from '../hooks/useRealtimeOrders'
import { useState } from 'react'

function AnalyticsPage() {
  const [activityLog, setActivityLog] = useState([])
  
  useRealtimeConsumerActivity((update) => {
    setActivityLog(prev => [
      {
        timestamp: new Date(),
        type: update.type,
        ...update.data
      },
      ...prev
    ])
  })

  return (
    // Render activity log...
  )
}
```

### Provider App - Using Existing Food Hook (Enhanced)

```javascript
import { useRealtimeFoods } from '../hooks/useRealtimeFoods'

function ListingsPage({ providerId }) {
  // This hook automatically:
  // 1. Fetches all listings for the provider
  // 2. Subscribes to real-time updates
  // 3. Updates prices every minute (if auto-reduction enabled)
  // 4. Refreshes on any change
  
  const { foods, loading, error, refreshFoods } = useRealtimeFoods(providerId)

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage error={error} />

  return (
    <div>
      {foods.map(food => (
        <FoodCard key={food.id} food={food} />
      ))}
      <button onClick={() => refreshFoods()}>Refresh</button>
    </div>
  )
}
```

## Data Flow Diagram

```
Consumer App                    Supabase                    Provider App
    │                              │                              │
    ├─ Subscribe to:              │                              │
    │  - food updates ────────────┤                              │
    │  - requests                 │                              │
    │  - donations                │                              │
    │                             │                              │
    │                             ├─ Listen for:               │
    │                             │  - food inserts/updates    │
    │                             │  - request changes ────────┤
    │                             │  - donations              │
    │                             │                           │
    ├─ Create Order ─────────────┤                           │
    │                             ├─ Update food status ──────┤
    │                             │  (SOLD, DISCOUNT, DONATE) │
    │                             │                           │
    │                             ├─ Broadcast to all ───────┤
    │                             │  connected clients        │
    │                             │                           │
    ├─ Receive order update ──────┤                           │
    │  (pickup_time, status)      │                           │
    │                             │                           │
    │                             ├─ Update listing ─────────┤
    │                             │  quantity, price          │
```

## Real-Time Event Types

### Food Updates
```javascript
{
  type: 'insert' | 'update' | 'delete',
  data: {
    id: uuid,
    provider_id: uuid,
    name: string,
    quantity: number,
    base_price: number,
    current_price: number,
    status: 'SELL' | 'DISCOUNT' | 'DONATE' | 'EXPIRED',
    created_at: timestamp,
    expiry_time: timestamp,
    ...
  },
  table: 'food' | 'foods'
}
```

### Order/Request Updates
```javascript
{
  type: 'insert' | 'update' | 'delete',
  data: {
    id: uuid,
    food_id: uuid,
    requester_type: 'consumer' | 'ngo',
    status: 'pending' | 'accepted' | 'rejected',
    user_id: uuid,
    created_at: timestamp,
    ...
  }
}
```

### Donation Updates
```javascript
{
  type: 'insert' | 'update' | 'delete',
  data: {
    id: uuid,
    food_id: uuid,
    ngo_id: uuid,
    volunteer_assigned: boolean,
    created_at: timestamp,
    ...
  }
}
```

## Best Practices

1. **Always Unsubscribe**: Use cleanup functions in useEffect to prevent memory leaks
   ```javascript
   useEffect(() => {
     return () => channel.unsubscribe()
   }, [])
   ```

2. **Debounce Updates**: For high-frequency updates, consider debouncing
   ```javascript
   const debouncedUpdate = debounce((data) => {
     setFoods(prev => [...prev, data])
   }, 500)
   ```

3. **Handle Errors**: Always include error handlers
   ```javascript
   .on('*', payload => {
     if (payload.error) {
       console.error('Realtime error:', payload.error)
     }
   })
   ```

4. **Filter Early**: Use Supabase filters to reduce data transfer
   ```javascript
   table: 'requests',
   filter: `food_id=in(select id from foods where provider_id=eq.${providerId})`
   ```

5. **Show Loading States**: Indicate to users when real-time connections are active

## Testing Real-Time

### Manual Testing

1. Open provider app in browser
2. Open consumer app in another browser/device
3. Create a listing in provider app
4. Check consumer app receives update immediately
5. Create order in consumer app
6. Check provider app receives request immediately

### Testing with Mock Updates

```javascript
// Backend: Manually trigger updates for testing
async function testRealtime() {
  const { data, error } = await supabase
    .from('foods')
    .insert({ provider_id: testProviderId, name: 'Test Food', ... })
  
  // All connected clients will receive this update
}
```

## Troubleshooting

### Realtime not updating?
1. Check that Supabase realtime is enabled in project settings
2. Verify RLS (Row Level Security) policies allow read access
3. Check browser console for errors
4. Verify you're subscribed to correct table/channel name

### Missed updates?
1. Ensure you subscribed BEFORE data changes
2. Use initial data fetch + realtime subscribe pattern
3. Implement reconnection logic for dropped connections

### Performance issues?
1. Use filters to reduce number of events
2. Debounce or throttle update callbacks
3. Consider unsubscribing when component not visible
4. Profile realtime events in Supabase dashboard

## Configuration

### Environment Variables Needed

```env
# Backend
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key

# Consumer App
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Provider App
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Resources

- [Supabase Realtime Documentation](https://supabase.com/docs/guides/realtime)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [Real-time Subscriptions](https://supabase.com/docs/guides/realtime/subscribing-to-events)
# Real-Time Service Implementation Guide

## Overview

The real-time service has been successfully implemented across your Supabase application, connecting both the consumer app and provider app with live data synchronization.

## Architecture

### Backend (`backend/realtime.js`)

The backend provides multiple real-time subscription channels:

1. **Food Updates** - Tracks all food inventory changes
   - `subscribeFoodUpdates()` - All food table changes
   - `subscribeProviderFoodUpdates(providerId)` - Provider-specific inventory
   - `subscribeNearbyFoodUpdates()` - Location-based food availability

2. **Order Management** - Tracks incoming orders
   - `subscribeOrderUpdates()` - All order changes
   - `subscribeProviderOrderUpdates(providerId)` - Provider's orders

3. **Donations** - Tracks donation requests
   - `subscribeDonationUpdates()` - All donation changes

### Consumer App (`supply-consumer-app/src/lib/api.js`)

New real-time functions added:

```javascript
// Subscribe to nearby food listings
subscribeFoodRealtime(onChange)

// Track user's personal orders
subscribeUserOrders(userId, onChange)

// Monitor NGO donation alerts
subscribeNgoAlerts(onChange)

// Watch specific food item
subscribeFoodItem(foodId, onChange)
```

**Currently Used In:**
- `HomeScreen.js` - Live surplus listings
- `ProviderListingsScreen.js` - Provider inventory updates
- `NgoAlertsScreen.js` - Donation alerts

### Provider App (`supply-provider-web/src/lib/api.js`)

New real-time functions added:

```javascript
// Monitor provider's food inventory
subscribeProviderFood(providerId, onChange)

// Track incoming orders and donations
subscribeProviderOrders(providerId, onChange)

// Watch all food changes (analytics)
subscribeAllFoodChanges(onChange)

// Dashboard metrics updates
subscribeDashboardUpdates(onChange)
```

**Custom React Hooks** (`src/hooks/`):

1. **useRealtimeFoods** - Already implemented
   - Tracks provider's food listings with lifecycle calculations
   - Updates prices hourly
   - Auto-syncs inventory

2. **useRealtimeOrders** (NEW)
   - Monitors incoming orders and donations
   - Refetches data on changes
   - Returns: `{ orders, donations, loading, error, refreshOrders, setOrders, setDonations }`

3. **useRealtimeDashboard** (NEW)
   - Calculates live dashboard statistics
   - Tracks: listings, requests, donations, sales
   - Returns: `{ stats, loading, error, refreshStats }`

### Updated Pages

1. **DashboardPage.jsx**
   - Now uses `subscribeDashboardUpdates()`
   - Auto-refreshes stats on data changes

2. **ListingsPage.jsx**
   - Now uses `subscribeAllFoodChanges()`
   - Real-time inventory synchronization

3. **MyListings.jsx**
   - Already had subscription setup - now improved
   - Better error handling
   - Status filters with real-time counts

## How to Test Real-Time Features

### 1. Test Provider App Real-Time Updates

**Setup:**
1. Start your backend: `npm run dev` in `/backend`
2. Start provider app: `npm run dev` in `/supply-provider-web`
3. Login as a provider

**Test Listing Updates:**
1. Open `MyListings` page
2. In another browser/device, create/update a food listing
3. Watch the `MyListings` page update automatically without refresh
4. Expected: New listings appear, statuses change in real-time

**Test Dashboard Updates:**
1. Open `Dashboard` page
2. Create new food listings or place orders
3. Watch stats update automatically
4. Expected: Numbers update live as data changes

### 2. Test Consumer App Real-Time Updates

**Setup:**
1. Open consumer app on mobile emulator or device
2. Start on `HomeScreen`

**Test Food Availability:**
1. Add new food from provider app
2. Watch `HomeScreen` update automatically
3. Create an order from the consumer app
4. Status should change to "sold" automatically

**Test NGO Alerts:**
1. Create food with price = 0 in provider app
2. Open `NgoAlertsScreen` in consumer app
3. Should see the donation alert appear in real-time

### 3. Monitor Real-Time Connections

**Browser DevTools:**
1. Open DevTools (F12)
2. Check Console tab for real-time subscription messages like:
   ```
   Subscribed to provider food updates: <provider-id>
   Real-time orders subscribed for provider: <provider-id>
   Food update for provider: {...}
   ```

**Network Tab:**
1. Look for WebSocket connections (ws://... or wss://...)
2. Supabase maintains persistent real-time connections
3. You should see ongoing activity when data changes

### 4. Verify Connection Status

**Add debugging to your components:**

```javascript
useEffect(() => {
    const channel = subscribeProviderFood(providerId, (payload) => {
        console.log('Real-time update received:', payload)
        // Your handler
    })
    
    return () => channel.unsubscribe()
}, [])
```

Check console for: `Real-time update received: {...}`

## Common Issues & Solutions

### Issue: No real-time updates appearing
**Solutions:**
1. Check WebSocket connection in DevTools > Network
2. Verify Supabase credentials are set in `.env`
3. Ensure RLS policies allow real-time subscriptions
4. Check browser console for Supabase errors

### Issue: High latency in real-time updates
**Solutions:**
1. Real-time works best with stable internet connection
2. Reduce number of active subscriptions per page
3. Consider debouncing rapid updates with `setTimeout`

### Issue: Memory leaks or multiple subscriptions
**Solutions:**
1. Always unsubscribe when component unmounts (check cleanup functions)
2. Use dependency arrays correctly in useEffect
3. Call `channel.unsubscribe()` in cleanup

## Environment Variables Required

Make sure these are set in your `.env` files:

**Backend:**
```
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_key
SUPABASE_ANON_KEY=your_anon_key
```

**Consumer App:**
```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

**Provider App:**
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

## Database Schema Requirements

Ensure these tables exist in Supabase with proper RLS:

1. **food / foods** - Food inventory
2. **orders** - Consumer orders
3. **donations** - NGO donation requests
4. **users** - User profiles

Real-time subscriptions filter by `provider_id`, so ensure this column exists and is indexed.

## Performance Optimization

### 1. Filter Subscriptions by Provider
Already implemented - each provider only sees their own data:
```javascript
subscribeProviderFood(providerId, onChange) // Filters automatically
```

### 2. Debounce Rapid Updates
```javascript
const debouncedRefresh = debounce(() => loadData(), 500)
const channel = subscribeFoodUpdates(debouncedRefresh)
```

### 3. Use Specific Channels
Don't use overly broad subscriptions:
```javascript
// ✅ Good - specific provider
subscribeProviderFood(providerId, onChange)

// ❌ Avoid - listens to all changes
subscribeAllFoodChanges(onChange)
```

## Next Steps

1. **Add Notifications** - Notify providers of new orders with toast/alerts
2. **Add Typing Indicators** - Show when others are editing listings
3. **Add Presence** - Track which users are online
4. **Add Conflict Resolution** - Handle concurrent edits
5. **Add Analytics** - Track real-time metric changes

## Support Files

- Backend: `backend/realtime.js` - Core subscriptions
- Consumer: `supply-consumer-app/src/lib/api.js` - Real-time functions
- Provider: `supply-provider-web/src/lib/api.js` - Real-time functions
- Hooks: `supply-provider-web/src/hooks/useRealtime*.js` - React hooks
- Pages: 
  - `supply-provider-web/src/pages/provider/DashboardPage.jsx`
  - `supply-provider-web/src/pages/provider/ListingsPage.jsx`
  - `supply-provider-web/src/pages/MyListings.jsx`

## Questions?

Check the console for real-time debug logs and Supabase documentation:
- https://supabase.com/docs/realtime/usage
- https://supabase.com/docs/realtime/channel-subscribe
