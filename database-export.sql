

-- User table
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(191) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `password` VARCHAR(191) NOT NULL,
  `points` INT NOT NULL DEFAULT 0,
  `level` INT NOT NULL DEFAULT 1,
  `headline` VARCHAR(191) NULL,
  `bio` TEXT NULL,
  `location` VARCHAR(191) NULL,
  `profileImage` VARCHAR(191) NULL,
  `linkedinUrl` VARCHAR(191) NULL,
  `githubUrl` VARCHAR(191) NULL,
  `portfolio` VARCHAR(191) NULL,
  `phone` VARCHAR(191) NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `email_unique` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Startup table
CREATE TABLE IF NOT EXISTS `startups` (
  `id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `details` TEXT NOT NULL,
  `stage` VARCHAR(191) NOT NULL DEFAULT 'Idea',
  `logo` VARCHAR(191) NULL,
  `banner` VARCHAR(191) NULL,
  `location` VARCHAR(191) NULL,
  `industry` VARCHAR(191) NULL,
  `ownerId` VARCHAR(191) NOT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `startup_owner_idx` (`ownerId`),
  FOREIGN KEY (`ownerId`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Role table
CREATE TABLE IF NOT EXISTS `roles` (
  `id` VARCHAR(191) NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `roleType` VARCHAR(191) NOT NULL,
  `isOpen` BOOLEAN NOT NULL DEFAULT TRUE,
  `isPaid` BOOLEAN NOT NULL DEFAULT FALSE,
  `startupId` VARCHAR(191) NOT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `role_startup_idx` (`startupId`),
  FOREIGN KEY (`startupId`) REFERENCES `startups` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- UserRole table
CREATE TABLE IF NOT EXISTS `user_roles` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `roleId` VARCHAR(191) NOT NULL,
  `startupId` VARCHAR(191) NOT NULL,
  `joinedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `user_role_unique` (`userId`, `roleId`),
  INDEX `user_role_user_idx` (`userId`),
  INDEX `user_role_role_idx` (`roleId`),
  INDEX `user_role_startup_idx` (`startupId`),
  FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`roleId`) REFERENCES `roles` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`startupId`) REFERENCES `startups` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TaskStatus table
CREATE TABLE IF NOT EXISTS `task_statuses` (
  `id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `startupId` VARCHAR(191) NOT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `task_status_startup_idx` (`startupId`),
  FOREIGN KEY (`startupId`) REFERENCES `startups` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Task table
CREATE TABLE IF NOT EXISTS `tasks` (
  `id` VARCHAR(191) NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `description` TEXT NOT NULL,
  `statusId` VARCHAR(191) NOT NULL,
  `priority` VARCHAR(191) NOT NULL,
  `dueDate` DATETIME NULL,
  `startupId` VARCHAR(191) NOT NULL,
  `createdBy` VARCHAR(191) NOT NULL,
  `isTimerRunning` BOOLEAN NOT NULL DEFAULT FALSE,
  `timerStartedAt` DATETIME NULL,
  `totalTimeSpent` INT NOT NULL DEFAULT 0,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `task_status_idx` (`statusId`),
  INDEX `task_startup_idx` (`startupId`),
  INDEX `task_creator_idx` (`createdBy`),
  FOREIGN KEY (`statusId`) REFERENCES `task_statuses` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`startupId`) REFERENCES `startups` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`createdBy`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TaskAssignee table
CREATE TABLE IF NOT EXISTS `task_assignees` (
  `id` VARCHAR(191) NOT NULL,
  `taskId` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `task_assignee_unique` (`taskId`, `userId`),
  INDEX `task_assignee_task_idx` (`taskId`),
  INDEX `task_assignee_user_idx` (`userId`),
  FOREIGN KEY (`taskId`) REFERENCES `tasks` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TimeTrackingLog table
CREATE TABLE IF NOT EXISTS `time_tracking_logs` (
  `id` VARCHAR(191) NOT NULL,
  `taskId` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `startTime` DATETIME NOT NULL,
  `endTime` DATETIME NULL,
  `duration` INT NOT NULL DEFAULT 0,
  `note` TEXT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `time_log_task_idx` (`taskId`),
  INDEX `time_log_user_idx` (`userId`),
  FOREIGN KEY (`taskId`) REFERENCES `tasks` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Skill table
CREATE TABLE IF NOT EXISTS `skills` (
  `id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `level` INT NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `skill_user_idx` (`userId`),
  FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Education table
CREATE TABLE IF NOT EXISTS `education` (
  `id` VARCHAR(191) NOT NULL,
  `school` VARCHAR(191) NOT NULL,
  `degree` VARCHAR(191) NOT NULL,
  `field` VARCHAR(191) NOT NULL,
  `startDate` DATETIME NOT NULL,
  `endDate` DATETIME NULL,
  `userId` VARCHAR(191) NOT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `education_user_idx` (`userId`),
  FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Experience table
CREATE TABLE IF NOT EXISTS `experiences` (
  `id` VARCHAR(191) NOT NULL,
  `company` VARCHAR(191) NOT NULL,
  `position` VARCHAR(191) NOT NULL,
  `startDate` DATETIME NOT NULL,
  `endDate` DATETIME NULL,
  `description` TEXT NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `experience_user_idx` (`userId`),
  FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- PointsTransaction table
CREATE TABLE IF NOT EXISTS `points_transactions` (
  `id` VARCHAR(191) NOT NULL,
  `points` INT NOT NULL,
  `reason` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `points_user_idx` (`userId`),
  FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Lead table
CREATE TABLE IF NOT EXISTS `leads` (
  `id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `phone` VARCHAR(191) NOT NULL,
  `status` VARCHAR(191) NOT NULL,
  `source` VARCHAR(191) NOT NULL,
  `notes` TEXT NULL,
  `salesAmount` FLOAT NOT NULL,
  `nextActionDate` DATETIME NULL,
  `assignedToId` VARCHAR(191) NULL,
  `startupId` VARCHAR(191) NOT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `lead_assignee_idx` (`assignedToId`),
  INDEX `lead_startup_idx` (`startupId`),
  FOREIGN KEY (`assignedToId`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  FOREIGN KEY (`startupId`) REFERENCES `startups` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- LeadComment table
CREATE TABLE IF NOT EXISTS `lead_comments` (
  `id` VARCHAR(191) NOT NULL,
  `content` TEXT NOT NULL,
  `leadId` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `lead_comment_lead_idx` (`leadId`),
  INDEX `lead_comment_user_idx` (`userId`),
  FOREIGN KEY (`leadId`) REFERENCES `leads` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Opportunity table
CREATE TABLE IF NOT EXISTS `opportunities` (
  `id` VARCHAR(191) NOT NULL,
  `position` VARCHAR(191) NOT NULL,
  `experience` VARCHAR(191) NOT NULL,
  `description` TEXT NOT NULL,
  `openings` INT NOT NULL DEFAULT 1,
  `startupId` VARCHAR(191) NOT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `opportunity_startup_idx` (`startupId`),
  FOREIGN KEY (`startupId`) REFERENCES `startups` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- JoinRequest table
CREATE TABLE IF NOT EXISTS `join_requests` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `roleId` VARCHAR(191) NOT NULL,
  `startupId` VARCHAR(191) NOT NULL,
  `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
  `message` TEXT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `join_request_user_idx` (`userId`),
  INDEX `join_request_role_idx` (`roleId`),
  INDEX `join_request_startup_idx` (`startupId`),
  FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`roleId`) REFERENCES `roles` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`startupId`) REFERENCES `startups` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- AffiliateLink table
CREATE TABLE IF NOT EXISTS `affiliate_links` (
  `id` VARCHAR(191) NOT NULL,
  `code` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `startupId` VARCHAR(191) NOT NULL,
  `clickCount` INT NOT NULL DEFAULT 0,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `affiliate_code_unique` (`code`),
  INDEX `affiliate_user_idx` (`userId`),
  INDEX `affiliate_startup_idx` (`startupId`),
  FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`startupId`) REFERENCES `startups` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- AffiliateClick table
CREATE TABLE IF NOT EXISTS `affiliate_clicks` (
  `id` VARCHAR(191) NOT NULL,
  `linkId` VARCHAR(191) NOT NULL,
  `ip` VARCHAR(191) NOT NULL,
  `userAgent` TEXT NULL,
  `referrer` TEXT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `affiliate_click_link_idx` (`linkId`),
  FOREIGN KEY (`linkId`) REFERENCES `affiliate_links` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Default Task Statuses
INSERT INTO `task_statuses` (`id`, `name`, `startupId`)
SELECT 
  UUID(), 
  name,
  startup_id
FROM (
  SELECT 'To Do' as name, id as startup_id FROM `startups`
  UNION ALL
  SELECT 'In Progress' as name, id as startup_id FROM `startups`
  UNION ALL
  SELECT 'Done' as name, id as startup_id FROM `startups`
) as default_statuses; 