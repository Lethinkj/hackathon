# SupplyLink Backend (Supabase)

This folder is configured as a Supabase-first backend module.

## What Supabase Handles

- Database: PostgreSQL tables in `schema.sql`
- Auth: Supabase Auth (no custom JWT service needed)
- API: Auto-generated REST and JS client access
- Realtime: Postgres change subscriptions

## Setup

1. Install dependencies:
   npm install
2. Add env values in `.env`:
   - SUPABASE_URL
   - SUPABASE_ANON_KEY
3. Apply SQL schema from `schema.sql` in Supabase SQL Editor.

## Usage Examples

```js
const { addFood, getNearbyFood, getNgoAlerts } = require("./queries");
const { updatePrice, matchNGO } = require("./coreLogic");
const { subscribeFoodUpdates } = require("./realtime");
```

## Pitch Line

SupplyLink uses Supabase-powered real-time technology to transform surplus food into opportunity - instantly connecting providers, consumers, and NGOs to reduce waste and feed communities.
