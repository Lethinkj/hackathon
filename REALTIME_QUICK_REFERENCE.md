# Supabase Realtime Quick Reference

## ⚡ Quick Start

### 1. Backend Setup (Already Done)
```javascript
// backend/realtime.js - All subscription functions are ready
const {
  subscribeFoodUpdates,
  subscribeOrderUpdates,
  subscribeRequestUpdates,
  subscribeDonationUpdates,
  setupRealtimeListeners,
} = require('./realtime')
```

### 2. Consumer App - Add Realtime to HomeScreen
Import the hook:
```javascript
import { useRealtimeFoodUpdates } from '../hooks/useRealtimeFoodUpdates'
```

Add to your screen:
```javascript
useRealtimeFoodUpdates((update) => {
  if (update.type === 'insert') {
    setFoods(prev => [update.data, ...prev])
  }
})
```

### 3. Provider App - Add Realtime Orders
Import the hook:
```javascript
import { useRealtimeOrders } from '../hooks/useRealtimeOrders'
```

Add to your component:
```javascript
useRealtimeOrders(providerId, (update) => {
  if (update.type === 'insert') {
    setRequests(prev => [update.data, ...prev])
  }
})
```

## 📊 Data Model

### Food Listing (Provider Creates)
```
id: UUID
provider_id: UUID
name: string
quantity: integer
base_price: decimal
current_price: decimal
status: SELL | DISCOUNT | DONATE | EXPIRED
created_at: timestamp
```

### Request/Order (Consumer Creates)
```
id: UUID
food_id: UUID
requester_type: consumer | ngo
status: pending | accepted | rejected
user_id: UUID
created_at: timestamp
```

### Donation (NGO Topic)
```
id: UUID
food_id: UUID
ngo_id: UUID
volunteer_assigned: boolean
created_at: timestamp
```

## 🎯 Common Flows

### Flow 1: Consumer Views Food & Places Order
```
1. Consumer opens app → subscribes to food-updates
2. Provider uploads food → insert event fired
3. Consumer receives update → shows new food
4. Consumer clicks "Order" → API call to create request
5. Provider app subscribed to requests → gets notification
6. Provider accepts → request status updates to "accepted"
7. Consumer receives update → shows "Order Accepted"
```

### Flow 2: NGO Gets Donation Alert
```
1. NGO app → subscribes to donation-updates
2. Food expiry near → donation created in database
3. NGO receives update → notification triggered
4. NGO accepts → sets volunteer_assigned = true
5. Volunteer sees alert → goes for pickup
```

### Flow 3: Dynamic Pricing
```
1. Provider creates listing with 60-min discount timer
2. Provider app subscribes → starts monitoring
3. Every minute: check if time passed discount threshold
4. If yes → update current_price in database
5. All consumers receive update → price decreased!
6. After 30 mins → status changes to DONATE (free)
7. NGOs receive notification → new free food available
```

## 🔌 Hook Reference

### Consumer App Hooks
```javascript
useRealtimeFoodUpdates(callback)     // Food list changes
useRealtimeOrderUpdates(callback)    // Your orders status
useRealtimeRequestUpdates(callback)  // Incoming requests
useRealtimeDonationUpdates(callback) // NGO alerts
```

### Provider App Hooks
```javascript
useRealtimeFoods(providerId)             // Auto-manages foods + pricing
useRealtimeOrders(providerId, callback)  // Incoming requests
useRealtimeConsumerActivity(callback)    // All orders (analytics)
useRealtimeDonationRequests(providerId, callback)  // Donation requests
useRealtimeConsumerProfiles(callback)    // Consumer updates
```

## 🚀 Performance Tips

1. **Filter Early**: Only subscribe to what you need
   ```javascript
   filter: `provider_id=eq.${providerId}`
   ```

2. **Unsubscribe on Unmount**: Prevents memory leaks
   ```javascript
   useEffect(() => {
     return () => unsubscribe()
   }, [])
   ```

3. **Debounce Rapid Updates**: 
   ```javascript
   const debouncedUpdate = debounce(handleUpdate, 300)
   ```

4. **Batch Updates**: Don't re-render on every change
   ```javascript
   useCallback((update) => {
     // Update state in batch
   }, [])
   ```

## 🐛 Debugging

### Check Connection Status
```javascript
const channel = supabase.channel('test')
  .subscribe((status) => {
    console.log('Connection status:', status)
  })
```

### Monitor Events
```javascript
.on('*', (payload) => {
  console.log('Event received:', {
    type: payload.eventType,
    data: payload.new || payload.old,
  })
})
```

### Test with Supabase Studio
1. Go to Supabase Dashboard → SQL Editor
2. Run: `INSERT INTO foods (...) VALUES (...)`
3. Watch consumer app in real-time

## ✅ Checklist

- [ ] Backend realtime.js implemented ✓
- [ ] Consumer app has useRealtimeFoodUpdates hook ✓
- [ ] Provider app has useRealtimeOrders hook ✓
- [ ] Supabase realtime enabled in project
- [ ] Environment variables configured
- [ ] RLS policies allow realtime
- [ ] Test consumer ↔ provider flow
- [ ] Add error handling & reconnection logic
- [ ] Add notification sounds/toasts
- [ ] Deploy to production

## 📚 File Locations

- Backend realtime: `backend/realtime.js`
- Consumer hooks: `supply-consumer-app/src/hooks/useRealtimeFoodUpdates.js`
- Provider hooks: `supply-provider-web/src/hooks/useRealtimeOrders.js`
- Provider foods: `supply-provider-web/src/hooks/useRealtimeFoods.js`
- Setup guide: `REALTIME_SETUP.md` (this file)
- Examples: `consumer-app-realtime-example.js`, `provider-app-realtime-example.jsx`

## 🆘 Need Help?

1. Check the example files for implementation
2. Review REALTIME_SETUP.md for detailed docs
3. Check Supabase logs: Dashboard → Logs → Realtime Events
4. Verify RLS policies: Dashboard → Authentication → Policies
5. Test with curl: `curl https://your-project.supabase.co/rest/v1/foods`
