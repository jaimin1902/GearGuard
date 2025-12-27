-- Add new fields to equipment table to match wireframe
ALTER TABLE equipment 
ADD COLUMN IF NOT EXISTS company VARCHAR(255),
ADD COLUMN IF NOT EXISTS used_by VARCHAR(50) DEFAULT 'employee', -- 'employee' or 'department'
ADD COLUMN IF NOT EXISTS assigned_date DATE,
ADD COLUMN IF NOT EXISTS scrap_date DATE,
ADD COLUMN IF NOT EXISTS used_in_location VARCHAR(255),
ADD COLUMN IF NOT EXISTS work_center_id INTEGER REFERENCES work_centers(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS equipment_category_id INTEGER REFERENCES equipment_categories(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS description TEXT;

-- Create index for equipment_category_id
CREATE INDEX IF NOT EXISTS idx_equipment_category ON equipment(equipment_category_id);

-- Create index for work_center_id
CREATE INDEX IF NOT EXISTS idx_equipment_work_center ON equipment(work_center_id);

