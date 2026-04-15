# SupplyLink Backend

This backend uses Supabase for data storage and runs an Express API for email/password and phone OTP auth.

## What This Service Handles

- Database access through Supabase (`users`, `food`, `orders`, `donations`)
- Password auth routes (`/auth/register`, `/auth/login`, `/auth/me`)
- Phone OTP routes via Supabase Auth (`/auth/phone/send-otp`, `/auth/phone/verify-otp`)
- JWT session tokens for the provider web app

## Setup

1. Install dependencies:
   npm install
2. Add env values in `.env`:
   - SUPABASE_URL
   - SUPABASE_ANON_KEY
   - JWT_SECRET (optional)
   - PORT (optional, defaults to 4000)
   - CORS_ORIGINS (optional, comma-separated)
3. Apply SQL schema from `schema.sql` (or run migration `migrations/20260415_phone_auth.sql`) in Supabase SQL Editor.
4. In Supabase Dashboard, enable phone auth with Twilio:
   - Authentication -> Providers -> Phone
   - Turn on provider and choose Twilio Verify
   - Enter Twilio Account SID, Auth Token, and Verify Service SID
   - Save settings
4. Start the API:
   npm run start

## Auth Endpoints

- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me` (Bearer token required)
- `POST /auth/phone/send-otp`
- `POST /auth/phone/verify-otp`

## Phone OTP Request Bodies

Send OTP:

```json
{
   "phone": "+15551234567",
   "channel": "sms"
}
```

Verify OTP:

```json
{
   "phone": "+15551234567",
   "token": "123456",
   "type": "sms",
   "name": "Jane Provider",
   "role": "provider",
   "lat": 12.9716,
   "lng": 77.5946,
   "capacity": 25
}
```
