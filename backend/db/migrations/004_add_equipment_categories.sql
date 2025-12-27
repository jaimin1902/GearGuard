-- Create Equipment Categories table
CREATE TABLE IF NOT EXISTS equipment_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    responsible_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add updated_at trigger for equipment_categories
DROP TRIGGER IF EXISTS update_equipment_categories_updated_at ON equipment_categories;
CREATE TRIGGER update_equipment_categories_updated_at BEFORE UPDATE ON equipment_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create index
CREATE INDEX IF NOT EXISTS idx_equipment_categories_responsible ON equipment_categories(responsible_user_id);

