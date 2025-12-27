-- Add additional fields to work_centers table
ALTER TABLE work_centers 
    ADD COLUMN IF NOT EXISTS tag VARCHAR(255),
    ADD COLUMN IF NOT EXISTS alternative_workcenters TEXT, -- JSON array or comma-separated IDs
    ADD COLUMN IF NOT EXISTS cost_per_hour DECIMAL(10, 2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS capacity_time_efficiency DECIMAL(10, 2) DEFAULT 100.00,
    ADD COLUMN IF NOT EXISTS oee_target DECIMAL(10, 2) DEFAULT 0.00;

