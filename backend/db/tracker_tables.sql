-- Create screenshots table
CREATE TABLE IF NOT EXISTS screenshots (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(191) NOT NULL,
    startup_id VARCHAR(191) NOT NULL,
    file_path TEXT NOT NULL,
    task_name VARCHAR(255) NULL,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX idx_screenshots_user_id ON screenshots(user_id);
CREATE INDEX idx_screenshots_startup_id ON screenshots(startup_id);
CREATE INDEX idx_screenshots_timestamp ON screenshots(timestamp);
