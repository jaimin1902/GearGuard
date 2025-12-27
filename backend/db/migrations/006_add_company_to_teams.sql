-- Add company field to maintenance_teams table
ALTER TABLE maintenance_teams 
ADD COLUMN IF NOT EXISTS company VARCHAR(255);

