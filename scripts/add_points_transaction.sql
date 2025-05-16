-- Create Points Transaction table for tracking
CREATE TABLE PointsTransaction (
  id VARCHAR(191) NOT NULL PRIMARY KEY,
  userId VARCHAR(191) NOT NULL,
  taskId VARCHAR(191) NOT NULL,
  points INT NOT NULL,
  reason VARCHAR(255) NOT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES User(id),
  FOREIGN KEY (taskId) REFERENCES Task(id)
);

-- Create index for faster lookups
CREATE INDEX points_transaction_userId_idx ON PointsTransaction (userId);
CREATE INDEX points_transaction_taskId_idx ON PointsTransaction (taskId); 