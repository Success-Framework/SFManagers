-- Add estimated hours field to Task table
ALTER TABLE Task ADD COLUMN estimatedHours DECIMAL(8,2) NOT NULL DEFAULT 0 AFTER isFreelance;

-- Add hourly rate field to Task table
ALTER TABLE Task ADD COLUMN hourlyRate DECIMAL(8,2) NOT NULL DEFAULT 0 AFTER estimatedHours;

-- Add urgency level field (will be calculated by background job)
ALTER TABLE Task ADD COLUMN urgencyLevel ENUM('CRITICAL', 'HIGH', 'MEDIUM', 'LOW') NOT NULL DEFAULT 'MEDIUM' AFTER hourlyRate;

-- Add points fields
ALTER TABLE Task ADD COLUMN basePoints INT NOT NULL DEFAULT 0 AFTER urgencyLevel;
ALTER TABLE Task ADD COLUMN pointsMultiplier DECIMAL(3,2) NOT NULL DEFAULT 1.0 AFTER basePoints;
ALTER TABLE Task ADD COLUMN totalPoints INT NOT NULL DEFAULT 0 AFTER pointsMultiplier;

-- Create index for better performance
CREATE INDEX tasks_urgencyLevel_idx ON Task (urgencyLevel);
CREATE INDEX tasks_estimatedHours_idx ON Task (estimatedHours); 