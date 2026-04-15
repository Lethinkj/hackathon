-- SupplyLink AI surplus prediction migration
-- Apply after the base schema.

create extension if not exists "uuid-ossp";

create or replace function weekly_surplus_trend()
returns table (
  weekday_name text,
  avg_surplus numeric,
  log_count bigint
)
language sql
stable
as $$
  select
    coalesce(weekday_name, to_char(created_date, 'Day')) as weekday_name,
    round(avg(surplus_qty)::numeric, 2) as avg_surplus,
    count(*)::bigint as log_count
  from food_logs
  group by 1
  order by case lower(trim(coalesce(weekday_name, to_char(created_date, 'Day'))))
    when 'monday' then 1 when 'tuesday' then 2 when 'wednesday' then 3
    when 'thursday' then 4 when 'friday' then 5 when 'saturday' then 6
    when 'sunday' then 7 else 8 end;
$$;

create or replace function festival_waste_analysis()
returns table (
  festival_name text,
  avg_surplus numeric,
  avg_waste numeric,
  log_count bigint
)
language sql
stable
as $$
  select
    coalesce(festival_name, 'No Festival') as festival_name,
    round(avg(surplus_qty)::numeric, 2) as avg_surplus,
    round(avg(waste_qty)::numeric, 2) as avg_waste,
    count(*)::bigint as log_count
  from food_logs
  group by 1
  order by avg_waste desc nulls last, festival_name asc;
$$;

create or replace function top_waste_food_items()
returns table (
  food_name text,
  total_waste bigint,
  total_surplus bigint,
  log_count bigint
)
language sql
stable
as $$
  select
    food_name,
    sum(waste_qty)::bigint as total_waste,
    sum(surplus_qty)::bigint as total_surplus,
    count(*)::bigint as log_count
  from food_logs
  group by food_name
  order by total_waste desc, total_surplus desc, food_name asc;
$$;

create or replace function latest_prediction_for_supplier(p_supplier_id uuid)
returns table (
  id uuid,
  supplier_id uuid,
  prediction_date date,
  predicted_surplus numeric,
  confidence_score numeric,
  suggested_action text,
  created_at timestamp with time zone
)
language sql
stable
as $$
  select
    p.id,
    p.supplier_id,
    p.prediction_date,
    p.predicted_surplus,
    p.confidence_score,
    p.suggested_action,
    p.created_at
  from predictions p
  where p.supplier_id = p_supplier_id
  order by p.prediction_date desc, p.created_at desc
  limit 1;
$$;

create or replace function seven_day_moving_average_surplus(p_supplier_id uuid)
returns table (
  created_date date,
  surplus_qty numeric,
  moving_avg_7 numeric
)
language sql
stable
as $$
  select
    created_date,
    surplus_qty,
    round(avg(surplus_qty) over (
      partition by supplier_id
      order by created_date
      rows between 6 preceding and current row
    )::numeric, 2) as moving_avg_7
  from food_logs
  where supplier_id = p_supplier_id
  order by created_date asc;
$$;

create or replace function monthly_seasonal_trend()
returns table (
  month_name text,
  avg_surplus numeric,
  avg_waste numeric,
  log_count bigint
)
language sql
stable
as $$
  select
    to_char(created_date, 'Mon') as month_name,
    round(avg(surplus_qty)::numeric, 2) as avg_surplus,
    round(avg(waste_qty)::numeric, 2) as avg_waste,
    count(*)::bigint as log_count
  from food_logs
  group by 1, extract(month from created_date)
  order by extract(month from min(created_date));
$$;

create or replace function supplier_performance_score(p_supplier_id uuid)
returns table (
  supplier_id uuid,
  performance_score numeric,
  waste_rate numeric,
  demand_score_avg numeric,
  surplus_trend numeric
)
language sql
stable
as $$
  with supplier_stats as (
    select
      supplier_id,
      coalesce(avg(demand_score), 0) as avg_demand,
      coalesce(sum(waste_qty)::numeric / nullif(sum(prepared_qty), 0), 0) as waste_rate,
      coalesce(avg(surplus_qty), 0) as avg_surplus,
      coalesce(avg(surplus_qty) filter (where created_date >= current_date - interval '7 days'), 0) as recent_surplus,
      coalesce(avg(surplus_qty) filter (where created_date >= current_date - interval '30 days' and created_date < current_date - interval '7 days'), 0) as previous_surplus
    from food_logs
    where supplier_id = p_supplier_id
    group by supplier_id
  )
  select
    supplier_id,
    round((100 - (waste_rate * 100) + (avg_demand * 20) + greatest(0, (recent_surplus - previous_surplus) * -2))::numeric, 2) as performance_score,
    round(waste_rate::numeric, 4) as waste_rate,
    round(avg_demand::numeric, 2) as demand_score_avg,
    round((recent_surplus - previous_surplus)::numeric, 2) as surplus_trend
  from supplier_stats;
$$;

create or replace view supplier_daily_surplus_summary as
select
  supplier_id,
  created_date,
  sum(prepared_qty) as prepared_qty,
  sum(sold_qty) as sold_qty,
  sum(surplus_qty) as surplus_qty,
  sum(waste_qty) as waste_qty,
  avg(demand_score) as demand_score,
  max(festival_name) as festival_name,
  max(weekday_name) as weekday_name
from food_logs
group by supplier_id, created_date;
