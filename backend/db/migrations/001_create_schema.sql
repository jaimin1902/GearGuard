-- Create Departments table
CREATE TABLE IF NOT EXISTS departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Users table (for technicians, managers, and regular users)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'user', -- 'user', 'technician', 'manager', 'admin'
    department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
    avatar_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Maintenance Teams table
CREATE TABLE IF NOT EXISTS maintenance_teams (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Team Members table (junction table)
CREATE TABLE IF NOT EXISTS team_members (
    id SERIAL PRIMARY KEY,
    team_id INTEGER NOT NULL REFERENCES maintenance_teams(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(team_id, user_id)
);

-- Create Equipment table
CREATE TABLE IF NOT EXISTS equipment (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    serial_number VARCHAR(255) UNIQUE,
    category VARCHAR(255), -- e.g., 'CNC Machine', 'Laptop', 'Vehicle'
    purchase_date DATE,
    warranty_expiry_date DATE,
    location VARCHAR(255),
    department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
    assigned_to_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    maintenance_team_id INTEGER NOT NULL REFERENCES maintenance_teams(id) ON DELETE RESTRICT,
    default_technician_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    is_scrapped BOOLEAN DEFAULT FALSE,
    scrapped_at TIMESTAMP,
    scrapped_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Maintenance Requests table
CREATE TABLE IF NOT EXISTS maintenance_requests (
    id SERIAL PRIMARY KEY,
    subject VARCHAR(255) NOT NULL,
    description TEXT,
    request_type VARCHAR(50) NOT NULL, -- 'corrective' or 'preventive'
    status VARCHAR(50) NOT NULL DEFAULT 'new', -- 'new', 'in_progress', 'repaired', 'scrapped'
    equipment_id INTEGER NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
    maintenance_team_id INTEGER NOT NULL REFERENCES maintenance_teams(id) ON DELETE RESTRICT,
    assigned_to_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    scheduled_date DATE,
    duration_hours DECIMAL(10, 2),
    completed_at TIMESTAMP,
    created_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_equipment_department ON equipment(department_id);
CREATE INDEX IF NOT EXISTS idx_equipment_user ON equipment(assigned_to_user_id);
CREATE INDEX IF NOT EXISTS idx_equipment_team ON equipment(maintenance_team_id);
CREATE INDEX IF NOT EXISTS idx_requests_equipment ON maintenance_requests(equipment_id);
CREATE INDEX IF NOT EXISTS idx_requests_team ON maintenance_requests(maintenance_team_id);
CREATE INDEX IF NOT EXISTS idx_requests_status ON maintenance_requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_scheduled_date ON maintenance_requests(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_requests_type ON maintenance_requests(request_type);
CREATE INDEX IF NOT EXISTS idx_team_members_team ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON team_members(user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_maintenance_teams_updated_at BEFORE UPDATE ON maintenance_teams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_equipment_updated_at BEFORE UPDATE ON equipment
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_maintenance_requests_updated_at BEFORE UPDATE ON maintenance_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

