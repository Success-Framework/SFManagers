-- Create Hourly Rate Configuration table
CREATE TABLE HourlyRateConfig (
  id VARCHAR(191) NOT NULL PRIMARY KEY,
  skillType VARCHAR(191) NOT NULL,
  hourlyRate DECIMAL(8,2) NOT NULL,
  description TEXT,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default rates
INSERT INTO HourlyRateConfig (id, skillType, hourlyRate, description)
VALUES 
  (UUID(), 'Design', 15.00, 'Design tasks like logo creation, UI/UX work'),
  (UUID(), 'Development', 25.00, 'Software development tasks'),
  (UUID(), 'Marketing', 20.00, 'Marketing and content creation'),
  (UUID(), 'Admin', 10.00, 'Administrative tasks and data entry');

-- Create index for faster lookups
CREATE INDEX hourly_rate_config_skillType_idx ON HourlyRateConfig (skillType); 