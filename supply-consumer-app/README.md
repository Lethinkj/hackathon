# Supply Consumer App (Expo)

Mobile app for Supply Consumer and NGO mode.

## Screens

- Home: Nearby food deals
- Food Details: View item and place order
- NGO Alerts: Free food notifications
- Orders: User pickup tracking

## Setup

1. Install dependencies:
   npm install
2. Create `.env` from `.env.example` and fill Supabase keys.
3. Start app:
   npm run start

## Notes

- This app queries Supabase directly.
- Realtime updates are enabled for food table changes.
- Set `EXPO_PUBLIC_DEMO_USER_ID` for order creation/testing.
