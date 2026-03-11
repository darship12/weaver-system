-- Weaver System - PostgreSQL Initialization
-- This runs automatically when the postgres container starts for the first time

-- Enable useful extensions
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Performance indexes (Django will create the model indexes, these are extras)
-- Run after Django migrations via: python manage.py migrate

-- Useful view for quick dashboard queries
CREATE OR REPLACE VIEW v_daily_production AS
  SELECT
    p.date,
    e.name        AS employee_name,
    e.employee_id AS employee_code,
    e.loom_type,
    p.loom_number,
    p.saree_type,
    p.saree_length,
    p.quantity,
    p.defects,
    p.wage_earned,
    p.saree_revenue,
    p.saree_profit
  FROM production_entries p
  JOIN employees e ON p.employee_id = e.id;

-- Weekly summary view
CREATE OR REPLACE VIEW v_weekly_summary AS
  SELECT
    date_trunc('week', date) AS week_start,
    e.name                   AS employee_name,
    SUM(quantity)            AS total_sarees,
    SUM(defects)             AS total_defects,
    ROUND(COALESCE(SUM(defects)::numeric / NULLIF(SUM(quantity),0) * 100, 0), 2) AS defect_pct,
    SUM(wage_earned)         AS total_wage,
    SUM(saree_revenue)       AS total_revenue,
    SUM(saree_profit)        AS total_profit
  FROM production_entries p
  JOIN employees e ON p.employee_id = e.id
  GROUP BY week_start, e.name
  ORDER BY week_start DESC, total_sarees DESC;
