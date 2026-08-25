-- Migration: Add isFullTank flag and tankCapacity
-- Run this against your Supabase instance.

-- 1. fuel_fillups: distinguish full-tank vs partial fill-ups
ALTER TABLE fuel_fillups
  ADD COLUMN IF NOT EXISTS "isFullTank" boolean NOT NULL DEFAULT true;

-- 2. vehicles: optional tank capacity in litres
ALTER TABLE vehicles
  ADD COLUMN IF NOT EXISTS "tankCapacity" numeric;
