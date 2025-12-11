-- Trips table for GaugeIQ
create table if not exists trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  vehicle_id uuid not null references vehicles(id) on delete cascade,
  start_date timestamptz not null,
  end_date timestamptz not null,
  start_odometer numeric not null,
  end_odometer numeric not null,
  distance numeric generated always as (end_odometer - start_odometer) stored,
  fuelVolume numeric,
  totalCost numeric,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists trips_user_idx on trips(user_id);
create index if not exists trips_vehicle_idx on trips(vehicle_id);
