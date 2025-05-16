-- Add the isFreelance column
ALTER TABLE Task ADD COLUMN isFreelance BOOLEAN NOT NULL DEFAULT FALSE AFTER totalTimeSpent;

-- Add the freelancerId column
ALTER TABLE Task ADD COLUMN freelancerId VARCHAR(191) NULL AFTER isFreelance;

-- Add an index to improve search performance for freelance tasks
CREATE INDEX tasks_isFreelance_idx ON Task (isFreelance);
CREATE INDEX tasks_freelancerId_idx ON Task (freelancerId);
