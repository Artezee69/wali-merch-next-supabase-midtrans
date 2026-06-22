-- =====================================================
-- Migration: Add shipping fields to orders table
-- Date: 2026-06-03
-- Reason: Checkout now calculates JNE shipping cost automatically
-- =====================================================

-- Add columns (idempotent — safe to re-run)
alter table orders
  add column if not exists subtotal integer not null default 0;

alter table orders
  add column if not exists shipping_cost integer not null default 0;

alter table orders
  add column if not exists shipping_service text;

-- Backfill existing rows: subtotal = total_amount (treat old orders as no-shipping)
update orders
  set subtotal = total_amount
  where subtotal = 0 and total_amount > 0;
