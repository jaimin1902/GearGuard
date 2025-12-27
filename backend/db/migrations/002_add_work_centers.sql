-- Create Work Centers table
CREATE TABLE IF NOT EXISTS work_centers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(255) UNIQUE,
    location VARCHAR(255),
    department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
    maintenance_team_id INTEGER NOT NULL REFERENCES maintenance_teams(id) ON DELETE RESTRICT,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Update maintenance_requests to support both Equipment and Work Center
-- First, make equipment_id nullable
ALTER TABLE maintenance_requests 
    ALTER COLUMN equipment_id DROP NOT NULL;

-- Add new columns
ALTER TABLE maintenance_requests 
    ADD COLUMN IF NOT EXISTS work_center_id INTEGER REFERENCES work_centers(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS maintenance_for VARCHAR(50) DEFAULT 'equipment',
    ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 1,
    ADD COLUMN IF NOT EXISTS notes TEXT,
    ADD COLUMN IF NOT EXISTS instructions TEXT,
    ADD COLUMN IF NOT EXISTS scheduled_datetime TIMESTAMP;

-- Update existing rows to have maintenance_for = 'equipment' if they have equipment_id
UPDATE maintenance_requests 
SET maintenance_for = 'equipment' 
WHERE maintenance_for IS NULL AND equipment_id IS NOT NULL;

-- Drop constraint if it exists (in case of re-running migration)
ALTER TABLE maintenance_requests DROP CONSTRAINT IF EXISTS check_maintenance_for;

-- Add constraint to ensure data integrity
ALTER TABLE maintenance_requests 
    ADD CONSTRAINT check_maintenance_for CHECK (
        (maintenance_for = 'equipment' AND equipment_id IS NOT NULL AND work_center_id IS NULL) OR
        (maintenance_for = 'work_center' AND work_center_id IS NOT NULL AND equipment_id IS NULL)
    );

-- Create index for work centers
CREATE INDEX IF NOT EXISTS idx_work_centers_team ON work_centers(maintenance_team_id);
CREATE INDEX IF NOT EXISTS idx_requests_work_center ON maintenance_requests(work_center_id);

-- Create trigger for work_centers updated_at
DROP TRIGGER IF EXISTS update_work_centers_updated_at ON work_centers;
CREATE TRIGGER update_work_centers_updated_at BEFORE UPDATE ON work_centers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

