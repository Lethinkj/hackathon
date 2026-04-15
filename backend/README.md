# SupplyLink Backend

This backend uses Supabase for data storage and runs an Express API for password-based auth.

## What This Service Handles

- Database access through Supabase (`users`, `food`, `orders`, `donations`)
- Password auth routes (`/auth/register`, `/auth/login`, `/auth/me`)
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
3. Apply SQL schema from `schema.sql` in Supabase SQL Editor.
4. Start the API:
   npm run start

## Auth Endpoints

- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me` (Bearer token required)
