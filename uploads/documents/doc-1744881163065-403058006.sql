-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Apr 17, 2025 at 08:53 AM
-- Server version: 10.6.21-MariaDB
-- PHP Version: 8.4.5

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `hdadmin_sfm`
--

-- --------------------------------------------------------

--
-- Table structure for table `AffiliateClick`
--

CREATE TABLE `AffiliateClick` (
  `id` varchar(191) NOT NULL,
  `linkId` varchar(191) NOT NULL,
  `ip` varchar(191) NOT NULL,
  `userAgent` text DEFAULT NULL,
  `referrer` text DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `AffiliateClick`
--

INSERT INTO `AffiliateClick` (`id`, `linkId`, `ip`, `userAgent`, `referrer`, `createdAt`) VALUES
('b50f3e48-f6f5-4b3d-8e27-9444d2c39717', '29e49837-adbb-48a1-9cde-77d37c16e946', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36', '', '2025-04-16 12:51:25');

-- --------------------------------------------------------

--
-- Table structure for table `AffiliateLink`
--

CREATE TABLE `AffiliateLink` (
  `id` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `code` varchar(191) NOT NULL,
  `userId` varchar(191) NOT NULL,
  `startupId` varchar(191) NOT NULL,
  `clicks` int(11) NOT NULL DEFAULT 0,
  `conversions` int(11) NOT NULL DEFAULT 0,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  `updatedAt` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `AffiliateLink`
--

INSERT INTO `AffiliateLink` (`id`, `name`, `code`, `userId`, `startupId`, `clicks`, `conversions`, `createdAt`, `updatedAt`) VALUES
('29e49837-adbb-48a1-9cde-77d37c16e946', 'Ayush Gupta', 'c3851a31', '809f01e4-4f2c-4095-b95e-fd9954109f8d', '16179e82-5e1a-4a13-93e6-8ecbf4e5f155', 1, 0, '2025-04-16 10:51:15', '2025-04-16 12:51:25'),
('8e915eef-e64d-4eb4-871c-1ef08bb4850f', 'Oskar Konstanciak', '0c1bd6ce', '3bd96dc7-c2ce-4fa0-8e54-cb8013f1dfac', '5a168d8d-3f67-4e8a-8617-6940692f2d7b', 0, 0, '2025-04-17 00:25:24', '2025-04-17 00:25:24');

-- --------------------------------------------------------

--
-- Table structure for table `chat_groups`
--

CREATE TABLE `chat_groups` (
  `id` varchar(191) NOT NULL,
  `name` varchar(255) NOT NULL,
  `startup_id` varchar(36) NOT NULL,
  `created_by` varchar(36) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Discussion`
--

CREATE TABLE `Discussion` (
  `id` varchar(191) NOT NULL,
  `title` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `startupId` varchar(191) NOT NULL,
  `userId` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `DiscussionComment`
--

CREATE TABLE `DiscussionComment` (
  `id` varchar(191) NOT NULL,
  `content` text NOT NULL,
  `discussionId` varchar(191) NOT NULL,
  `userId` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `documents`
--

CREATE TABLE `documents` (
  `id` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `description` text DEFAULT NULL,
  `filePath` varchar(191) NOT NULL,
  `fileType` varchar(191) NOT NULL,
  `fileSize` int(11) NOT NULL,
  `startupId` varchar(191) NOT NULL,
  `userId` varchar(191) NOT NULL,
  `createdAt` datetime(3) DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Education`
--

CREATE TABLE `Education` (
  `id` varchar(36) NOT NULL,
  `userId` varchar(36) NOT NULL,
  `institution` varchar(255) NOT NULL,
  `degree` varchar(255) NOT NULL,
  `fieldOfStudy` varchar(255) NOT NULL,
  `startDate` date NOT NULL,
  `endDate` date DEFAULT NULL,
  `description` text DEFAULT NULL,
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `Education`
--

INSERT INTO `Education` (`id`, `userId`, `institution`, `degree`, `fieldOfStudy`, `startDate`, `endDate`, `description`, `createdAt`, `updatedAt`) VALUES
('fdea741d-1b41-11f0-87d4-bc2411fc335d', '62283eb6-0720-4033-98d8-ab769f3b652a', 'University of Warsaw', 'Masters', 'Computer Science', '2015-09-01', '2020-06-30', 'Computer Science with focus on AI and Machine Learning', '2025-04-17 06:11:09', '2025-04-17 06:11:09');

-- --------------------------------------------------------

--
-- Table structure for table `Experience`
--

CREATE TABLE `Experience` (
  `id` varchar(36) NOT NULL,
  `userId` varchar(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `company` varchar(255) NOT NULL,
  `location` varchar(255) DEFAULT NULL,
  `startDate` date NOT NULL,
  `endDate` date DEFAULT NULL,
  `current` tinyint(1) DEFAULT 0,
  `description` text DEFAULT NULL,
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `Experience`
--

INSERT INTO `Experience` (`id`, `userId`, `title`, `company`, `location`, `startDate`, `endDate`, `current`, `description`, `createdAt`, `updatedAt`) VALUES
('f81915d4-1b41-11f0-87d4-bc2411fc335d', '62283eb6-0720-4033-98d8-ab769f3b652a', 'Senior Developer', 'Tech Company', 'Warsaw, Poland', '2020-01-01', '2023-01-01', 0, 'Led development of web applications', '2025-04-17 06:10:59', '2025-04-17 06:10:59');

-- --------------------------------------------------------

--
-- Table structure for table `Friends`
--

CREATE TABLE `Friends` (
  `id` varchar(36) NOT NULL,
  `userId` varchar(36) NOT NULL,
  `friendId` varchar(36) NOT NULL,
  `status` enum('pending','accepted','rejected') NOT NULL DEFAULT 'pending',
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  `updatedAt` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `GamificationAction`
--

CREATE TABLE `GamificationAction` (
  `id` int(11) NOT NULL,
  `action_key` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `default_points` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `GamificationAction`
--

INSERT INTO `GamificationAction` (`id`, `action_key`, `description`, `default_points`) VALUES
(1, 'complete_task', 'Complete a task', 10),
(2, 'create_startup', 'Create a new startup', 50),
(3, 'join_startup', 'Join a startup', 20),
(4, 'submit_idea', 'Submit a new idea', 15),
(5, 'daily_login', 'Log in daily', 5);

-- --------------------------------------------------------

--
-- Table structure for table `group_members`
--

CREATE TABLE `group_members` (
  `group_id` varchar(191) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `joined_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `HourlyRateConfig`
--

CREATE TABLE `HourlyRateConfig` (
  `id` varchar(191) NOT NULL,
  `skillType` varchar(191) NOT NULL,
  `hourlyRate` decimal(8,2) NOT NULL,
  `description` text DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  `updatedAt` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `JoinRequest`
--

CREATE TABLE `JoinRequest` (
  `id` varchar(191) NOT NULL,
  `userId` varchar(191) NOT NULL,
  `startupId` varchar(191) NOT NULL,
  `roleId` varchar(191) NOT NULL,
  `status` varchar(191) NOT NULL,
  `message` varchar(191) DEFAULT NULL,
  `receiverId` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `JoinRequest`
--

INSERT INTO `JoinRequest` (`id`, `userId`, `startupId`, `roleId`, `status`, `message`, `receiverId`, `createdAt`, `updatedAt`) VALUES
('1ecc1bb3-d96c-4a27-99c0-3b686750f7be', 'b0b27299-a9cc-416d-884d-af50a1663e8b', '16179e82-5e1a-4a13-93e6-8ecbf4e5f155', '42f97523-4d45-442e-91b3-2a616c6b8942', 'ACCEPTED', 'I want to join the startup', '809f01e4-4f2c-4095-b95e-fd9954109f8d', '2025-04-16 13:03:39.913', '2025-04-16 13:04:36.791');

-- --------------------------------------------------------

--
-- Table structure for table `Lead`
--

CREATE TABLE `Lead` (
  `id` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `email` varchar(191) NOT NULL,
  `phone` varchar(191) NOT NULL,
  `status` varchar(191) NOT NULL,
  `source` varchar(191) NOT NULL,
  `notes` varchar(191) DEFAULT NULL,
  `salesAmount` double NOT NULL,
  `nextActionDate` datetime(3) DEFAULT NULL,
  `assignedToId` varchar(191) DEFAULT NULL,
  `startupId` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `LeadComment`
--

CREATE TABLE `LeadComment` (
  `id` varchar(191) NOT NULL,
  `content` varchar(191) NOT NULL,
  `leadId` varchar(191) NOT NULL,
  `userId` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `meetings`
--

CREATE TABLE `meetings` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `meeting_link` varchar(255) DEFAULT NULL,
  `start_time` datetime NOT NULL,
  `end_time` datetime NOT NULL,
  `startup_id` varchar(191) NOT NULL,
  `created_by` varchar(191) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `meeting_assignees`
--

CREATE TABLE `meeting_assignees` (
  `meeting_id` int(11) NOT NULL,
  `user_id` varchar(191) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Message`
--

CREATE TABLE `Message` (
  `id` varchar(36) NOT NULL,
  `senderId` varchar(36) NOT NULL,
  `receiverId` varchar(36) NOT NULL,
  `groupId` varchar(36) DEFAULT NULL,
  `content` text NOT NULL,
  `isRead` tinyint(1) DEFAULT 0,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  `updatedAt` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `startupId` varchar(36) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Notification`
--

CREATE TABLE `Notification` (
  `id` varchar(36) NOT NULL,
  `userId` varchar(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `type` varchar(50) NOT NULL,
  `isRead` tinyint(1) DEFAULT 0,
  `data` text DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `Notification`
--

INSERT INTO `Notification` (`id`, `userId`, `title`, `message`, `type`, `isRead`, `data`, `createdAt`, `updatedAt`) VALUES
('12d3ef9d-48fb-4c6b-9900-e451fcc1a16c', '809f01e4-4f2c-4095-b95e-fd9954109f8d', 'New Join Request', 'sakif wants to join your startup as Test Role 1', 'INFO', 1, '{\"startupId\":\"16179e82-5e1a-4a13-93e6-8ecbf4e5f155\",\"roleId\":\"42f97523-4d45-442e-91b3-2a616c6b8942\",\"requestId\":\"1ecc1bb3-d96c-4a27-99c0-3b686750f7be\",\"userId\":\"b0b27299-a9cc-416d-884d-af50a1663e8b\"}', '2025-04-16 13:03:39', '2025-04-16 13:04:32'),
('602303dd-db63-4884-9d84-d5c3bfb71b70', 'b0b27299-a9cc-416d-884d-af50a1663e8b', 'Join Request Accepted', 'Your request to join test community as Test Role 1 has been accepted!', 'SUCCESS', 0, '{\"startupId\":\"16179e82-5e1a-4a13-93e6-8ecbf4e5f155\",\"roleId\":\"42f97523-4d45-442e-91b3-2a616c6b8942\",\"requestId\":\"1ecc1bb3-d96c-4a27-99c0-3b686750f7be\"}', '2025-04-16 13:04:36', '2025-04-16 13:04:36');

-- --------------------------------------------------------

--
-- Table structure for table `Opportunity`
--

CREATE TABLE `Opportunity` (
  `id` varchar(191) NOT NULL,
  `position` varchar(191) NOT NULL,
  `experience` varchar(191) NOT NULL,
  `description` varchar(191) NOT NULL,
  `openings` int(11) NOT NULL DEFAULT 1,
  `startupId` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `PointsTransaction`
--

CREATE TABLE `PointsTransaction` (
  `id` varchar(36) NOT NULL,
  `userId` varchar(36) NOT NULL,
  `points` int(11) NOT NULL,
  `description` varchar(255) NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Role`
--

CREATE TABLE `Role` (
  `id` varchar(191) NOT NULL,
  `title` varchar(191) NOT NULL,
  `roleType` varchar(191) NOT NULL,
  `isOpen` tinyint(1) NOT NULL DEFAULT 1,
  `isPaid` tinyint(1) NOT NULL DEFAULT 0,
  `startupId` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `Role`
--

INSERT INTO `Role` (`id`, `title`, `roleType`, `isOpen`, `isPaid`, `startupId`, `createdAt`, `updatedAt`) VALUES
('178f7a5b-4508-4563-8756-8f76e2426de0', 'Developer', 'Employee - Tech and Design', 1, 0, '5a168d8d-3f67-4e8a-8617-6940692f2d7b', '2025-04-16 16:09:48.534', '2025-04-16 16:09:48.534'),
('42f97523-4d45-442e-91b3-2a616c6b8942', 'Test Role 1', 'Employee - Tech and Design', 0, 0, '16179e82-5e1a-4a13-93e6-8ecbf4e5f155', '2025-04-16 12:50:45.626', '2025-04-16 13:04:36.792'),
('549cc468-301f-41b9-a133-1e2b04556341', 'New', 'Technical', 1, 0, '1465f4a8-8193-4da1-aad2-f54f6e88fbe2', '2025-04-16 16:27:37.837', '2025-04-16 16:27:37.837'),
('64aff22e-ae5f-4b6a-8a31-4a42dff02f8b', 'Marketing', 'Employee - Operations, Sales, and Marketing', 1, 0, '5a168d8d-3f67-4e8a-8617-6940692f2d7b', '2025-04-16 16:09:48.534', '2025-04-16 16:09:48.534'),
('9a5f08e7-531e-450d-b6ac-5c31d641905d', 'Test Role 2', 'Employee - Operations, Sales, and Marketing', 1, 0, '16179e82-5e1a-4a13-93e6-8ecbf4e5f155', '2025-04-16 12:50:45.627', '2025-04-16 12:50:45.627'),
('a27773ab-6b08-4a4f-8d69-d3e49c1664c8', 'dsdv', 'Technical', 1, 0, 'b46f39ca-096c-46df-88b3-bdf0fb32100d', '2025-04-17 08:35:21.268', '2025-04-17 08:35:21.268'),
('c9f344a3-deed-4aa0-9f02-91ce9d8610ac', 'Social Media', 'Employee - Tech and Design', 1, 0, '5a168d8d-3f67-4e8a-8617-6940692f2d7b', '2025-04-16 16:09:48.534', '2025-04-16 16:09:48.534');

-- --------------------------------------------------------

--
-- Table structure for table `roles`
--

CREATE TABLE `roles` (
  `id` varchar(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `role_type` varchar(50) NOT NULL,
  `is_open` tinyint(1) DEFAULT 1,
  `is_paid` tinyint(1) DEFAULT 0,
  `startup_id` varchar(36) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `SFCollabUsers`
--

CREATE TABLE `SFCollabUsers` (
  `id` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `sfmanagersId` varchar(36) DEFAULT NULL,
  `profileImage` varchar(255) DEFAULT NULL,
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `SFCollabUsers`
--

INSERT INTO `SFCollabUsers` (`id`, `name`, `email`, `sfmanagersId`, `profileImage`, `createdAt`, `updatedAt`) VALUES
('c0604d90-65dd-404e-a068-90fefd42196d', 'Test User', 'test@example.com', '123e4567-e89b-12d3-a456-426614174000', 'test-profile.jpg', '2025-04-17 05:42:37', '2025-04-17 05:42:37');

-- --------------------------------------------------------

--
-- Table structure for table `Skill`
--

CREATE TABLE `Skill` (
  `id` varchar(36) NOT NULL,
  `userId` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `level` varchar(50) NOT NULL,
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `Skill`
--

INSERT INTO `Skill` (`id`, `userId`, `name`, `level`, `createdAt`, `updatedAt`) VALUES
('835d3cf1-360f-44cc-934d-cebe09fbc90e', '62283eb6-0720-4033-98d8-ab769f3b652a', 'JavaScript', 'Intermediate', '2025-04-17 06:10:23', '2025-04-17 06:10:23'),
('88e9706c-7d35-4358-a409-67dfbdeff042', '62283eb6-0720-4033-98d8-ab769f3b652a', 'TypeScript', 'Intermediate', '2025-04-17 06:10:23', '2025-04-17 06:10:23'),
('8b93fc9f-822e-42bf-903d-f5e0a2420d67', '62283eb6-0720-4033-98d8-ab769f3b652a', 'MySQL', 'Intermediate', '2025-04-17 06:10:23', '2025-04-17 06:10:23'),
('aa70a5bf-4c1c-47ed-9e26-cf1f767a5c9f', '62283eb6-0720-4033-98d8-ab769f3b652a', 'Node.js', 'Intermediate', '2025-04-17 06:10:23', '2025-04-17 06:10:23'),
('f633893f-8ace-490a-8dd5-2ba5c5ebc7e8', '62283eb6-0720-4033-98d8-ab769f3b652a', 'React', 'Intermediate', '2025-04-17 06:10:23', '2025-04-17 06:10:23');

-- --------------------------------------------------------

--
-- Table structure for table `Startup`
--

CREATE TABLE `Startup` (
  `id` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `details` varchar(191) NOT NULL,
  `stage` varchar(191) NOT NULL DEFAULT 'Idea',
  `logo` varchar(191) DEFAULT NULL,
  `logo_url` varchar(255) DEFAULT NULL,
  `banner` varchar(191) DEFAULT NULL,
  `banner_url` varchar(255) DEFAULT NULL,
  `location` varchar(191) DEFAULT NULL,
  `industry` varchar(191) DEFAULT NULL,
  `ownerId` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `website` varchar(191) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `Startup`
--

INSERT INTO `Startup` (`id`, `name`, `details`, `stage`, `logo`, `logo_url`, `banner`, `banner_url`, `location`, `industry`, `ownerId`, `createdAt`, `updatedAt`, `website`) VALUES
('1465f4a8-8193-4da1-aad2-f54f6e88fbe2', 'New Test', 'New', 'Idea', NULL, NULL, NULL, NULL, 'India', 'Media & Entertainment', '809f01e4-4f2c-4095-b95e-fd9954109f8d', '2025-04-16 16:27:37.836', '2025-04-16 16:27:37.836', NULL),
('16179e82-5e1a-4a13-93e6-8ecbf4e5f155', 'test community', 'Test', 'Idea', NULL, NULL, NULL, NULL, 'London', 'Technology', '809f01e4-4f2c-4095-b95e-fd9954109f8d', '2025-04-16 12:50:45.625', '2025-04-16 12:50:45.625', NULL),
('5a168d8d-3f67-4e8a-8617-6940692f2d7b', 'SFORGER', 'SForger', 'Idea', '/uploads/logo-1744857365339-220934196.jpg', NULL, '/uploads/banner-1744857365339-648378865.jpg', NULL, 'Poland', 'Technology', '3bd96dc7-c2ce-4fa0-8e54-cb8013f1dfac', '2025-04-16 16:09:48.532', '2025-04-16 16:09:48.532', ''),
('b46f39ca-096c-46df-88b3-bdf0fb32100d', 'test 3', 'csd sdv sdvs vds dv sv sdv', 'Idea', NULL, NULL, NULL, NULL, 'India', 'Travel & Hospitality', '07e7941d-eed6-4cdd-a26f-f00ce272fb4f', '2025-04-17 08:35:21.266', '2025-04-17 08:35:21.266', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `startups`
--

CREATE TABLE `startups` (
  `id` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `details` text DEFAULT NULL,
  `owner_id` varchar(36) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `startup_members`
--

CREATE TABLE `startup_members` (
  `id` varchar(191) NOT NULL,
  `userId` varchar(191) NOT NULL,
  `startupId` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `startup_members`
--

INSERT INTO `startup_members` (`id`, `userId`, `startupId`, `createdAt`, `updatedAt`) VALUES
('44645a1e-1ae0-11f0-87d4-bc2411fc335d', '3bd96dc7-c2ce-4fa0-8e54-cb8013f1dfac', '5a168d8d-3f67-4e8a-8617-6940692f2d7b', '2025-04-16 18:31:37.000', '2025-04-16 18:31:37.000'),
('44647287-1ae0-11f0-87d4-bc2411fc335d', '809f01e4-4f2c-4095-b95e-fd9954109f8d', '1465f4a8-8193-4da1-aad2-f54f6e88fbe2', '2025-04-16 18:31:37.000', '2025-04-16 18:31:37.000'),
('44648207-1ae0-11f0-87d4-bc2411fc335d', '809f01e4-4f2c-4095-b95e-fd9954109f8d', '16179e82-5e1a-4a13-93e6-8ecbf4e5f155', '2025-04-16 18:31:37.000', '2025-04-16 18:31:37.000');

-- --------------------------------------------------------

--
-- Table structure for table `SystemRoles`
--

CREATE TABLE `SystemRoles` (
  `id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `SystemRoles`
--

INSERT INTO `SystemRoles` (`id`, `name`, `description`, `created_at`) VALUES
(1, 'super_admin', 'Super Administrator with access to all system functions including gamification', '2025-04-16 22:41:09');

-- --------------------------------------------------------

--
-- Table structure for table `Task`
--

CREATE TABLE `Task` (
  `id` varchar(191) NOT NULL,
  `isMeeting` tinyint(1) NOT NULL DEFAULT 0,
  `title` varchar(191) NOT NULL,
  `description` varchar(191) NOT NULL,
  `meetingLink` varchar(255) DEFAULT NULL,
  `statusId` varchar(191) NOT NULL,
  `priority` varchar(191) NOT NULL,
  `dueDate` datetime(3) DEFAULT NULL,
  `startTime` datetime DEFAULT NULL,
  `endTime` datetime DEFAULT NULL,
  `startupId` varchar(191) NOT NULL,
  `createdBy` varchar(191) NOT NULL,
  `isTimerRunning` tinyint(1) NOT NULL DEFAULT 0,
  `timerStartedAt` datetime(3) DEFAULT NULL,
  `totalTimeSpent` int(11) NOT NULL DEFAULT 0,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `isFreelance` tinyint(1) NOT NULL DEFAULT 0,
  `estimatedHours` decimal(8,2) NOT NULL DEFAULT 0.00,
  `hourlyRate` decimal(8,2) NOT NULL DEFAULT 0.00,
  `urgencyLevel` enum('CRITICAL','HIGH','MEDIUM','LOW') NOT NULL DEFAULT 'MEDIUM',
  `basePoints` int(11) NOT NULL DEFAULT 0,
  `pointsMultiplier` decimal(3,2) NOT NULL DEFAULT 1.00,
  `totalPoints` int(11) NOT NULL DEFAULT 0,
  `freelancerId` varchar(191) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `TaskAssignee`
--

CREATE TABLE `TaskAssignee` (
  `id` varchar(191) NOT NULL,
  `taskId` varchar(191) NOT NULL,
  `userId` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `TaskStatus`
--

CREATE TABLE `TaskStatus` (
  `id` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `startupId` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `TaskStatus`
--

INSERT INTO `TaskStatus` (`id`, `name`, `startupId`, `createdAt`, `updatedAt`) VALUES
('0d3c4a2b-5cbf-4578-9969-6b52f3e63ec3', 'To Do', 'b46f39ca-096c-46df-88b3-bdf0fb32100d', '2025-04-17 08:36:04.466', '2025-04-17 08:36:04.466'),
('17bb7ac0-524b-423c-8146-76e3909abeff', 'Done', '1465f4a8-8193-4da1-aad2-f54f6e88fbe2', '2025-04-16 16:27:46.525', '2025-04-16 16:27:46.525'),
('29fe0ad1-4264-48a7-8ac7-0663dd03419f', 'Done', '16179e82-5e1a-4a13-93e6-8ecbf4e5f155', '2025-04-16 12:50:54.865', '2025-04-16 12:50:54.865'),
('36f9527d-7d44-40c4-adb2-7f394e3e8e8a', 'To Do', '5a168d8d-3f67-4e8a-8617-6940692f2d7b', '2025-04-16 23:01:10.393', '2025-04-16 23:01:10.393'),
('540e1c92-b765-44d3-856f-9a2307c7973d', 'Done', '5a168d8d-3f67-4e8a-8617-6940692f2d7b', '2025-04-16 23:01:10.394', '2025-04-16 23:01:10.394'),
('54ca24c9-0435-40f9-bce2-3b0e68b22359', 'In Progress', 'b46f39ca-096c-46df-88b3-bdf0fb32100d', '2025-04-17 08:36:04.468', '2025-04-17 08:36:04.468'),
('5539c484-40c1-4ef7-ba33-6e170eec4046', 'To Do', '16179e82-5e1a-4a13-93e6-8ecbf4e5f155', '2025-04-16 12:50:54.862', '2025-04-16 12:50:54.862'),
('798309e1-659d-4649-8081-8cf0d3dcdc16', 'Done', 'b46f39ca-096c-46df-88b3-bdf0fb32100d', '2025-04-17 08:36:04.468', '2025-04-17 08:36:04.468'),
('aa4e11f7-9f43-46f1-a6c3-2e7dbd055729', 'In Progress', '16179e82-5e1a-4a13-93e6-8ecbf4e5f155', '2025-04-16 12:50:54.865', '2025-04-16 12:50:54.865'),
('d303600c-cb0f-4e5b-a42d-28b06671bc1f', 'In Progress', '5a168d8d-3f67-4e8a-8617-6940692f2d7b', '2025-04-16 23:01:10.394', '2025-04-16 23:01:10.394'),
('f6fde8df-ab79-4ddf-a701-1f73ea82db76', 'In Progress', '1465f4a8-8193-4da1-aad2-f54f6e88fbe2', '2025-04-16 16:27:46.525', '2025-04-16 16:27:46.525'),
('f87137dd-9365-42d9-a903-542a55308d54', 'To Do', '1465f4a8-8193-4da1-aad2-f54f6e88fbe2', '2025-04-16 16:27:46.524', '2025-04-16 16:27:46.524');

-- --------------------------------------------------------

--
-- Stand-in structure for view `task_statuses`
-- (See below for the actual view)
--
CREATE TABLE `task_statuses` (
`id` varchar(191)
,`name` varchar(191)
,`startupId` varchar(191)
,`createdAt` datetime(3)
,`updatedAt` datetime(3)
);

-- --------------------------------------------------------

--
-- Table structure for table `TeamMessages`
--

CREATE TABLE `TeamMessages` (
  `id` varchar(191) NOT NULL,
  `content` text NOT NULL,
  `userId` varchar(191) NOT NULL,
  `startupId` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `TimeTrackingLog`
--

CREATE TABLE `TimeTrackingLog` (
  `id` varchar(191) NOT NULL,
  `taskId` varchar(191) NOT NULL,
  `userId` varchar(191) NOT NULL,
  `startTime` datetime(3) NOT NULL,
  `endTime` datetime(3) DEFAULT NULL,
  `duration` int(11) NOT NULL DEFAULT 0,
  `note` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `User`
--

CREATE TABLE `User` (
  `id` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `points` int(11) DEFAULT 0,
  `level` int(11) DEFAULT 1,
  `headline` varchar(255) DEFAULT NULL,
  `bio` text DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `profileImage` varchar(255) DEFAULT NULL,
  `linkedinUrl` varchar(255) DEFAULT NULL,
  `githubUrl` varchar(255) DEFAULT NULL,
  `portfolio` varchar(255) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `sfcollabId` varchar(36) DEFAULT NULL,
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `User`
--

INSERT INTO `User` (`id`, `name`, `email`, `password`, `points`, `level`, `headline`, `bio`, `location`, `profileImage`, `linkedinUrl`, `githubUrl`, `portfolio`, `phone`, `sfcollabId`, `createdAt`, `updatedAt`) VALUES
('07e7941d-eed6-4cdd-a26f-f00ce272fb4f', 'Ayush Gupta', 'trial@sfm.com', '$2b$10$yO3xRAkMfKDWsjRCbvPqX.cNjvzmJwVQfa9wLzGJr.u.LYzB.g932', 0, 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-04-17 06:27:37', '2025-04-17 06:27:37'),
('3bd96dc7-c2ce-4fa0-8e54-cb8013f1dfac', 'Original Owner', 'originalowner@example.com', '$2b$10$EQG5rbad34e9zxIrzxQsBuePt55/SLIuh8hpp7ZDbfFyxNGm31vmW', 0, 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-04-17 06:29:49', '2025-04-17 06:29:49'),
('62283eb6-0720-4033-98d8-ab769f3b652a', 'Oskar Konstanciak', 'oskarkonstanciakpl@hotmail.com', '$2b$10$EQG5rbad34e9zxIrzxQsBuePt55/SLIuh8hpp7ZDbfFyxNGm31vmW', 0, 1, 'Software Developer', 'Experienced developer with a passion for building great products', 'Poland', NULL, 'https://linkedin.com/in/oskar', 'https://github.com/oskar', 'https://oskar.dev', '+48123456789', NULL, '2025-04-17 06:04:01', '2025-04-17 06:10:23');

-- --------------------------------------------------------

--
-- Table structure for table `UserPointsLog`
--

CREATE TABLE `UserPointsLog` (
  `id` int(11) NOT NULL,
  `user_id` varchar(191) NOT NULL,
  `action_key` varchar(100) NOT NULL,
  `points_awarded` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `UserRole`
--

CREATE TABLE `UserRole` (
  `id` varchar(191) NOT NULL,
  `userId` varchar(191) NOT NULL,
  `roleId` varchar(191) NOT NULL,
  `startupId` varchar(191) NOT NULL,
  `joinedAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `UserRole`
--

INSERT INTO `UserRole` (`id`, `userId`, `roleId`, `startupId`, `joinedAt`, `createdAt`, `updatedAt`) VALUES
('3cf17feb-007a-4f68-8afa-716446964f62', 'b0b27299-a9cc-416d-884d-af50a1663e8b', '42f97523-4d45-442e-91b3-2a616c6b8942', '16179e82-5e1a-4a13-93e6-8ecbf4e5f155', '2025-04-16 13:04:36.793', '2025-04-16 13:04:36.793', '2025-04-16 13:04:36.793');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `user_type` varchar(50) DEFAULT 'user'
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `password`, `created_at`, `user_type`) VALUES
('1', 'Admin User', 'admin@example.com', 'b', '2025-04-16 14:51:48', 'super_admin'),
('2', 'Super Admin', 'superadmin@example.com', 'b.XmrsIRD6c1jQHKhiYOI3dJPnkNgUbEm', '2025-04-16 14:52:57', 'super_admin');

-- --------------------------------------------------------

--
-- Table structure for table `UserSystemRoles`
--

CREATE TABLE `UserSystemRoles` (
  `id` int(11) NOT NULL,
  `user_id` varchar(191) NOT NULL,
  `role_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `UserSystemRoles`
--

INSERT INTO `UserSystemRoles` (`id`, `user_id`, `role_id`, `created_at`) VALUES
(1, '3bd96dc7-c2ce-4fa0-8e54-cb8013f1dfac', 1, '2025-04-16 22:41:31'),
(3, '3bd96dc7-c2ce-4fa0-8e54-cb8013f1dfac', 1, '2025-04-17 04:17:22');

-- --------------------------------------------------------

--
-- Table structure for table `_UserRoles`
--

CREATE TABLE `_UserRoles` (
  `A` varchar(191) NOT NULL,
  `B` varchar(191) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `AffiliateClick`
--
ALTER TABLE `AffiliateClick`
  ADD PRIMARY KEY (`id`),
  ADD KEY `linkId` (`linkId`);

--
-- Indexes for table `AffiliateLink`
--
ALTER TABLE `AffiliateLink`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`),
  ADD KEY `userId` (`userId`),
  ADD KEY `startupId` (`startupId`);

--
-- Indexes for table `chat_groups`
--
ALTER TABLE `chat_groups`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_chat_groups_startup` (`startup_id`),
  ADD KEY `idx_chat_groups_created_by` (`created_by`);

--
-- Indexes for table `Discussion`
--
ALTER TABLE `Discussion`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_startup` (`startupId`),
  ADD KEY `idx_user` (`userId`);

--
-- Indexes for table `DiscussionComment`
--
ALTER TABLE `DiscussionComment`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_discussion` (`discussionId`),
  ADD KEY `idx_user` (`userId`);

--
-- Indexes for table `documents`
--
ALTER TABLE `documents`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `Education`
--
ALTER TABLE `Education`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_id` (`userId`);

--
-- Indexes for table `Experience`
--
ALTER TABLE `Experience`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_id` (`userId`);

--
-- Indexes for table `Friends`
--
ALTER TABLE `Friends`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_friendship` (`userId`,`friendId`),
  ADD KEY `idx_user_id` (`userId`),
  ADD KEY `idx_friend_id` (`friendId`);

--
-- Indexes for table `GamificationAction`
--
ALTER TABLE `GamificationAction`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `action_key` (`action_key`);

--
-- Indexes for table `group_members`
--
ALTER TABLE `group_members`
  ADD PRIMARY KEY (`group_id`,`user_id`),
  ADD KEY `idx_group_members_user` (`user_id`);

--
-- Indexes for table `HourlyRateConfig`
--
ALTER TABLE `HourlyRateConfig`
  ADD PRIMARY KEY (`id`),
  ADD KEY `hourly_rate_config_skillType_idx` (`skillType`);

--
-- Indexes for table `JoinRequest`
--
ALTER TABLE `JoinRequest`
  ADD PRIMARY KEY (`id`),
  ADD KEY `JoinRequest_userId_fkey` (`userId`),
  ADD KEY `JoinRequest_startupId_fkey` (`startupId`),
  ADD KEY `JoinRequest_roleId_fkey` (`roleId`),
  ADD KEY `JoinRequest_receiverId_fkey` (`receiverId`);

--
-- Indexes for table `Lead`
--
ALTER TABLE `Lead`
  ADD PRIMARY KEY (`id`),
  ADD KEY `Lead_assignedToId_fkey` (`assignedToId`),
  ADD KEY `Lead_startupId_fkey` (`startupId`);

--
-- Indexes for table `LeadComment`
--
ALTER TABLE `LeadComment`
  ADD PRIMARY KEY (`id`),
  ADD KEY `LeadComment_leadId_fkey` (`leadId`),
  ADD KEY `LeadComment_userId_fkey` (`userId`);

--
-- Indexes for table `meetings`
--
ALTER TABLE `meetings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_startup_id` (`startup_id`),
  ADD KEY `idx_created_by` (`created_by`),
  ADD KEY `idx_start_time` (`start_time`),
  ADD KEY `idx_end_time` (`end_time`);

--
-- Indexes for table `meeting_assignees`
--
ALTER TABLE `meeting_assignees`
  ADD PRIMARY KEY (`meeting_id`,`user_id`),
  ADD KEY `idx_meeting_id` (`meeting_id`),
  ADD KEY `idx_user_id` (`user_id`);

--
-- Indexes for table `Message`
--
ALTER TABLE `Message`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_sender_id` (`senderId`),
  ADD KEY `idx_receiver_id` (`receiverId`),
  ADD KEY `idx_group_id` (`groupId`),
  ADD KEY `idx_message_group` (`groupId`),
  ADD KEY `idx_message_startup` (`startupId`);

--
-- Indexes for table `Notification`
--
ALTER TABLE `Notification`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_notification_userId` (`userId`);

--
-- Indexes for table `Opportunity`
--
ALTER TABLE `Opportunity`
  ADD PRIMARY KEY (`id`),
  ADD KEY `Opportunity_startupId_fkey` (`startupId`);

--
-- Indexes for table `PointsTransaction`
--
ALTER TABLE `PointsTransaction`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_id` (`userId`);

--
-- Indexes for table `Role`
--
ALTER TABLE `Role`
  ADD PRIMARY KEY (`id`),
  ADD KEY `Role_startupId_fkey` (`startupId`);

--
-- Indexes for table `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`),
  ADD KEY `startup_id` (`startup_id`);

--
-- Indexes for table `SFCollabUsers`
--
ALTER TABLE `SFCollabUsers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `Skill`
--
ALTER TABLE `Skill`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_id` (`userId`);

--
-- Indexes for table `Startup`
--
ALTER TABLE `Startup`
  ADD PRIMARY KEY (`id`),
  ADD KEY `Startup_ownerId_fkey` (`ownerId`);

--
-- Indexes for table `startups`
--
ALTER TABLE `startups`
  ADD PRIMARY KEY (`id`),
  ADD KEY `owner_id` (`owner_id`);

--
-- Indexes for table `startup_members`
--
ALTER TABLE `startup_members`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `startup_member_unique` (`userId`,`startupId`),
  ADD KEY `startup_members_startup_idx` (`startupId`),
  ADD KEY `startup_members_user_idx` (`userId`);

--
-- Indexes for table `SystemRoles`
--
ALTER TABLE `SystemRoles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `Task`
--
ALTER TABLE `Task`
  ADD PRIMARY KEY (`id`),
  ADD KEY `Task_statusId_fkey` (`statusId`),
  ADD KEY `Task_startupId_fkey` (`startupId`),
  ADD KEY `Task_createdBy_fkey` (`createdBy`),
  ADD KEY `tasks_urgencyLevel_idx` (`urgencyLevel`),
  ADD KEY `tasks_estimatedHours_idx` (`estimatedHours`),
  ADD KEY `idx_isMeeting` (`isMeeting`);

--
-- Indexes for table `TaskAssignee`
--
ALTER TABLE `TaskAssignee`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `TaskAssignee_taskId_userId_key` (`taskId`,`userId`),
  ADD KEY `TaskAssignee_userId_fkey` (`userId`);

--
-- Indexes for table `TaskStatus`
--
ALTER TABLE `TaskStatus`
  ADD PRIMARY KEY (`id`),
  ADD KEY `TaskStatus_startupId_fkey` (`startupId`);

--
-- Indexes for table `TeamMessages`
--
ALTER TABLE `TeamMessages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_startup` (`startupId`),
  ADD KEY `idx_user` (`userId`);

--
-- Indexes for table `TimeTrackingLog`
--
ALTER TABLE `TimeTrackingLog`
  ADD PRIMARY KEY (`id`),
  ADD KEY `TimeTrackingLog_userId_fkey` (`userId`),
  ADD KEY `TimeTrackingLog_taskId_fkey` (`taskId`);

--
-- Indexes for table `User`
--
ALTER TABLE `User`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `UserPointsLog`
--
ALTER TABLE `UserPointsLog`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `UserRole`
--
ALTER TABLE `UserRole`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `UserRole_userId_roleId_key` (`userId`,`roleId`),
  ADD KEY `UserRole_roleId_fkey` (`roleId`),
  ADD KEY `UserRole_startupId_fkey` (`startupId`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `UserSystemRoles`
--
ALTER TABLE `UserSystemRoles`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `_UserRoles`
--
ALTER TABLE `_UserRoles`
  ADD UNIQUE KEY `_UserRoles_AB_unique` (`A`,`B`),
  ADD KEY `_UserRoles_B_index` (`B`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `GamificationAction`
--
ALTER TABLE `GamificationAction`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `meetings`
--
ALTER TABLE `meetings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `SystemRoles`
--
ALTER TABLE `SystemRoles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `UserPointsLog`
--
ALTER TABLE `UserPointsLog`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `UserSystemRoles`
--
ALTER TABLE `UserSystemRoles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

-- --------------------------------------------------------

--
-- Structure for view `task_statuses`
--
DROP TABLE IF EXISTS `task_statuses`;

CREATE ALGORITHM=UNDEFINED DEFINER=`hdadmin_sfm`@`localhost` SQL SECURITY DEFINER VIEW `task_statuses`  AS SELECT `TaskStatus`.`id` AS `id`, `TaskStatus`.`name` AS `name`, `TaskStatus`.`startupId` AS `startupId`, `TaskStatus`.`createdAt` AS `createdAt`, `TaskStatus`.`updatedAt` AS `updatedAt` FROM `TaskStatus` ;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `AffiliateClick`
--
ALTER TABLE `AffiliateClick`
  ADD CONSTRAINT `AffiliateClick_ibfk_1` FOREIGN KEY (`linkId`) REFERENCES `AffiliateLink` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `AffiliateLink`
--
ALTER TABLE `AffiliateLink`
  ADD CONSTRAINT `AffiliateLink_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `AffiliateLink_ibfk_2` FOREIGN KEY (`startupId`) REFERENCES `Startup` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `Discussion`
--
ALTER TABLE `Discussion`
  ADD CONSTRAINT `Discussion_ibfk_1` FOREIGN KEY (`startupId`) REFERENCES `Startup` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `Discussion_ibfk_2` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `DiscussionComment`
--
ALTER TABLE `DiscussionComment`
  ADD CONSTRAINT `DiscussionComment_ibfk_1` FOREIGN KEY (`discussionId`) REFERENCES `Discussion` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `DiscussionComment_ibfk_2` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `Education`
--
ALTER TABLE `Education`
  ADD CONSTRAINT `Education_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `Experience`
--
ALTER TABLE `Experience`
  ADD CONSTRAINT `Experience_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `Friends`
--
ALTER TABLE `Friends`
  ADD CONSTRAINT `Friends_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `Friends_ibfk_2` FOREIGN KEY (`friendId`) REFERENCES `User` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `JoinRequest`
--
ALTER TABLE `JoinRequest`
  ADD CONSTRAINT `JoinRequest_receiverId_fkey` FOREIGN KEY (`receiverId`) REFERENCES `User` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `JoinRequest_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `Role` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `JoinRequest_startupId_fkey` FOREIGN KEY (`startupId`) REFERENCES `Startup` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `JoinRequest_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `Lead`
--
ALTER TABLE `Lead`
  ADD CONSTRAINT `Lead_assignedToId_fkey` FOREIGN KEY (`assignedToId`) REFERENCES `User` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `Lead_startupId_fkey` FOREIGN KEY (`startupId`) REFERENCES `Startup` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `LeadComment`
--
ALTER TABLE `LeadComment`
  ADD CONSTRAINT `LeadComment_leadId_fkey` FOREIGN KEY (`leadId`) REFERENCES `Lead` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `LeadComment_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `meetings`
--
ALTER TABLE `meetings`
  ADD CONSTRAINT `fk_meetings_creator` FOREIGN KEY (`created_by`) REFERENCES `User` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_meetings_startup` FOREIGN KEY (`startup_id`) REFERENCES `Startup` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `meeting_assignees`
--
ALTER TABLE `meeting_assignees`
  ADD CONSTRAINT `fk_meeting_assignees_meeting` FOREIGN KEY (`meeting_id`) REFERENCES `meetings` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_meeting_assignees_user` FOREIGN KEY (`user_id`) REFERENCES `User` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `Message`
--
ALTER TABLE `Message`
  ADD CONSTRAINT `Message_ibfk_1` FOREIGN KEY (`senderId`) REFERENCES `User` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `Message_ibfk_2` FOREIGN KEY (`receiverId`) REFERENCES `User` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `Opportunity`
--
ALTER TABLE `Opportunity`
  ADD CONSTRAINT `Opportunity_startupId_fkey` FOREIGN KEY (`startupId`) REFERENCES `Startup` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `PointsTransaction`
--
ALTER TABLE `PointsTransaction`
  ADD CONSTRAINT `PointsTransaction_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `Role`
--
ALTER TABLE `Role`
  ADD CONSTRAINT `Role_startupId_fkey` FOREIGN KEY (`startupId`) REFERENCES `Startup` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `roles`
--
ALTER TABLE `roles`
  ADD CONSTRAINT `roles_ibfk_1` FOREIGN KEY (`startup_id`) REFERENCES `startups` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `Skill`
--
ALTER TABLE `Skill`
  ADD CONSTRAINT `Skill_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `startups`
--
ALTER TABLE `startups`
  ADD CONSTRAINT `startups_ibfk_1` FOREIGN KEY (`owner_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `startup_members`
--
ALTER TABLE `startup_members`
  ADD CONSTRAINT `startup_members_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `startup_members_ibfk_2` FOREIGN KEY (`startupId`) REFERENCES `Startup` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `Task`
--
ALTER TABLE `Task`
  ADD CONSTRAINT `Task_createdBy_fkey` FOREIGN KEY (`createdBy`) REFERENCES `User` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `Task_startupId_fkey` FOREIGN KEY (`startupId`) REFERENCES `Startup` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `Task_statusId_fkey` FOREIGN KEY (`statusId`) REFERENCES `TaskStatus` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `TaskAssignee`
--
ALTER TABLE `TaskAssignee`
  ADD CONSTRAINT `TaskAssignee_taskId_fkey` FOREIGN KEY (`taskId`) REFERENCES `Task` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `TaskAssignee_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `TaskStatus`
--
ALTER TABLE `TaskStatus`
  ADD CONSTRAINT `TaskStatus_startupId_fkey` FOREIGN KEY (`startupId`) REFERENCES `Startup` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `TeamMessages`
--
ALTER TABLE `TeamMessages`
  ADD CONSTRAINT `TeamMessages_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `TeamMessages_ibfk_2` FOREIGN KEY (`startupId`) REFERENCES `Startup` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `TimeTrackingLog`
--
ALTER TABLE `TimeTrackingLog`
  ADD CONSTRAINT `TimeTrackingLog_taskId_fkey` FOREIGN KEY (`taskId`) REFERENCES `Task` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `TimeTrackingLog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `UserRole`
--
ALTER TABLE `UserRole`
  ADD CONSTRAINT `UserRole_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `Role` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `UserRole_startupId_fkey` FOREIGN KEY (`startupId`) REFERENCES `Startup` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `UserRole_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `_UserRoles`
--
ALTER TABLE `_UserRoles`
  ADD CONSTRAINT `_UserRoles_A_fkey` FOREIGN KEY (`A`) REFERENCES `Role` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `_UserRoles_B_fkey` FOREIGN KEY (`B`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
