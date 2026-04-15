-- SupplyLink AI analytics queries
-- Use in PostgreSQL/Supabase.

-- 1) Weekly Surplus Trend
select
  coalesce(weekday_name, to_char(created_date, 'Day')) as weekday_name,
  round(avg(surplus_qty)::numeric, 2) as avg_surplus
from food_logs
group by 1
order by case lower(trim(coalesce(weekday_name, to_char(created_date, 'Day'))))
  when 'monday' then 1 when 'tuesday' then 2 when 'wednesday' then 3
  when 'thursday' then 4 when 'friday' then 5 when 'saturday' then 6
  when 'sunday' then 7 else 8 end;

-- 2) Festival Waste Analysis
select
  coalesce(festival_name, 'No Festival') as festival_name,
  round(avg(surplus_qty)::numeric, 2) as avg_surplus,
  round(avg(waste_qty)::numeric, 2) as avg_waste
from food_logs
group by 1
order by avg_waste desc nulls last;

-- 3) Top Waste Food Items
select
  food_name,
  sum(waste_qty)::bigint as total_waste,
  sum(surplus_qty)::bigint as total_surplus
from food_logs
group by food_name
order by total_waste desc, total_surplus desc
limit 10;

-- 4) Latest Prediction for each Supplier
select distinct on (supplier_id)
  id,
  supplier_id,
  prediction_date,
  predicted_surplus,
  confidence_score,
  suggested_action,
  created_at
from predictions
order by supplier_id, prediction_date desc, created_at desc;

-- 5) 7-day Moving Average Surplus
select
  supplier_id,
  created_date,
  surplus_qty,
  round(avg(surplus_qty) over (
    partition by supplier_id
    order by created_date
    rows between 6 preceding and current row
  )::numeric, 2) as moving_avg_7
from food_logs
order by supplier_id, created_date;

-- 6) Monthly Seasonal Trend
select
  date_trunc('month', created_date)::date as month_start,
  to_char(created_date, 'Mon') as month_name,
  round(avg(surplus_qty)::numeric, 2) as avg_surplus,
  round(avg(waste_qty)::numeric, 2) as avg_waste
from food_logs
group by 1, 2
order by 1;

-- 7) Supplier Performance Score
with supplier_stats as (
  select
    supplier_id,
    coalesce(avg(demand_score), 0) as avg_demand,
    coalesce(sum(waste_qty)::numeric / nullif(sum(prepared_qty), 0), 0) as waste_rate,
    coalesce(avg(surplus_qty), 0) as avg_surplus,
    coalesce(avg(surplus_qty) filter (where created_date >= current_date - interval '7 days'), 0) as recent_surplus,
    coalesce(avg(surplus_qty) filter (where created_date >= current_date - interval '30 days' and created_date < current_date - interval '7 days'), 0) as previous_surplus
  from food_logs
  group by supplier_id
)
select
  supplier_id,
  round((100 - (waste_rate * 100) + (avg_demand * 20) + greatest(0, (recent_surplus - previous_surplus) * -2))::numeric, 2) as performance_score,
  round(waste_rate::numeric, 4) as waste_rate,
  round(avg_demand::numeric, 2) as demand_score_avg,
  round((recent_surplus - previous_surplus)::numeric, 2) as surplus_trend
from supplier_stats
order by performance_score desc;
