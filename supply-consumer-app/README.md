# Supply Consumer App (Expo)

Mobile app for SupplyLink with role-based consumer, provider, and NGO flows.

## Screens

- Auth: Register/Login first and choose role on registration
- Consumer: Browse food and place orders
- Provider: Update listing details, mark listing as donation, and view incoming orders
- NGO: View free-food alerts and request donated food

## Setup

1. Install dependencies:
   npm install
2. Create/update `.env` with:
   - `EXPO_PUBLIC_SUPABASE_URL`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
   - `EXPO_PUBLIC_API_BASE_URL` (example: `http://localhost:4001` for web/emulator, or your LAN IP for real device)
3. Start app:
   npm run start

## Notes

- Auth is handled by the backend API (`/auth/*`).
- Food/orders/donations are read/written from Supabase tables (no hardcoded demo user flow).
- Realtime updates are enabled for food table changes.
