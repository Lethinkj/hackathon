# PostGIS Nearby Matching Guide (Static Locations)

This guide matches consumers to nearby food providers and catering events using static saved latitude/longitude in Supabase PostGIS.

## 1) Apply Migration

Run this file in Supabase SQL editor:

- `backend/migrations/20260415_postgis_nearby_matching.sql`

What it does:
- Enables `postgis`
- Creates `providers` and `food_events`
- Extends existing `consumers` table with location fields
- Adds location triggers
- Adds GIST spatial indexes
- Adds RLS policies
- Creates RPC functions:
  - `get_nearby_providers(consumer_lat, consumer_lng, radius_km)`
  - `get_nearby_food_events(consumer_lat, consumer_lng, radius_km)`
- Inserts Chennai sample data

## 2) Supabase RPC Usage (JavaScript)

```js
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)

// Providers within 30km of T Nagar
const { data: providers, error: providersError } = await supabase.rpc('get_nearby_providers', {
  consumer_lat: 13.0418,
  consumer_lng: 80.2337,
  radius_km: 30,
})

if (providersError) console.error(providersError)
else console.log(providers)

// Catering events within 30km of T Nagar
const { data: events, error: eventsError } = await supabase.rpc('get_nearby_food_events', {
  consumer_lat: 13.0418,
  consumer_lng: 80.2337,
  radius_km: 30,
})

if (eventsError) console.error(eventsError)
else console.log(events)
```

## 3) Expected JSON Response Shapes

### `get_nearby_providers`

```json
[
  {
    "provider_id": "22222222-2222-2222-2222-222222222222",
    "business_name": "T Nagar Grand Hotel",
    "provider_type": "Hotel",
    "address": "T Nagar, Chennai",
    "distance_km": 0.12
  },
  {
    "provider_id": "11111111-1111-1111-1111-111111111111",
    "business_name": "Anna Caterers",
    "provider_type": "Catering Services",
    "address": "Kodambakkam, Chennai",
    "distance_km": 1.64
  }
]
```

### `get_nearby_food_events`

```json
[
  {
    "event_id": "e2222222-2222-2222-2222-222222222222",
    "provider_id": "11111111-1111-1111-1111-111111111111",
    "provider_name": "Anna Caterers",
    "title": "Corporate Dinner Trays",
    "quantity": 85,
    "address": "Guindy, Chennai",
    "distance_km": 4.31,
    "created_at": "2026-04-15T12:30:00.000Z"
  }
]
```

## 4) Test Cases

Run these SQL calls in Supabase SQL editor.

1. T Nagar consumer gets nearby providers under 30km
```sql
select * from public.get_nearby_providers(13.041800, 80.233700, 30);
```

2. Tambaram consumer gets south-Chennai-biased nearby list
```sql
select * from public.get_nearby_providers(12.924900, 80.100000, 30);
```

3. Nearest sorting first
```sql
select * from public.get_nearby_providers(13.041800, 80.233700, 30);
```
Check `distance_km` increases monotonically.

4. Outside 30km excluded
```sql
select * from public.get_nearby_providers(12.924900, 80.100000, 30);
```
`Ennore Bay Cafe` should not appear for Tambaram.

5. Catering event nearby appears separately
```sql
select * from public.get_nearby_food_events(13.041800, 80.233700, 30);
```

## 5) Debug Checklist

- `postgis` extension exists:
```sql
select extname from pg_extension where extname = 'postgis';
```

- Locations are populated (not null):
```sql
select id, latitude, longitude, location is not null as has_point from public.providers;
select id, latitude, longitude, location is not null as has_point from public.consumers;
select id, latitude, longitude, location is not null as has_point from public.food_events;
```

- Spatial indexes exist:
```sql
select indexname, tablename
from pg_indexes
where schemaname='public'
  and indexname in ('idx_providers_location_gist','idx_consumers_location_gist','idx_food_events_location_gist');
```

- RPC callable by role:
```sql
select routine_name
from information_schema.routines
where routine_schema='public'
  and routine_name in ('get_nearby_providers', 'get_nearby_food_events');
```

- Radius units are KM at API layer and meters in PostGIS internals (`radius_km * 1000`).

## 6) Common Mistakes

- Swapping latitude/longitude order in `ST_MakePoint`.
  - Correct: `ST_MakePoint(longitude, latitude)`.

- Using geometry without SRID/geography cast.
  - This causes wrong distance units and poor filtering.

- Forgetting trigger/backfill after inserting lat/lng.
  - `location` remains null, so `ST_DWithin` returns no rows.

- Calling RPC with strings not numbers.
  - Ensure numeric inputs for `consumer_lat`, `consumer_lng`, `radius_km`.

- Enabling RLS but forgetting RPC grants.
  - RPC execute permissions are granted to `anon, authenticated` in migration.

- Expecting events with `status != 'active'` or expired `expires_at` to appear.

## 7) Scaling Notes

- Keep geography type for easy meter-based filtering.
- Add pagination at API layer for high-density areas.
- Add category/provider_type filters in RPC for map UI.
- Add materialized view cache for hotspot areas if query volume grows.
