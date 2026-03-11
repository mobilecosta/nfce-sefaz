CREATE TABLE `audit_logs` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`action` varchar(50) NOT NULL,
	`resourceType` varchar(50),
	`resourceId` varchar(50),
	`cnpj` varchar(14),
	`details` json,
	`ipAddress` varchar(45),
	`userAgent` text,
	`status` enum('success','error','warning') DEFAULT 'success',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `certificates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`cnpj` varchar(14) NOT NULL,
	`certificateKey` varchar(255) NOT NULL,
	`certificateName` varchar(255) NOT NULL,
	`issuer` text,
	`subject` text,
	`validFrom` timestamp,
	`validUntil` timestamp,
	`fingerprint` varchar(64),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `certificates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `nfce_access_keys` (
	`id` int AUTO_INCREMENT NOT NULL,
	`queryId` int NOT NULL,
	`accessKey` varchar(44) NOT NULL,
	`nfceNumber` varchar(9),
	`series` varchar(3),
	`emissionDate` timestamp,
	`totalValue` decimal(15,2),
	`xmlDownloaded` boolean DEFAULT false,
	`xmlKey` varchar(255),
	`downloadedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `nfce_access_keys_id` PRIMARY KEY(`id`),
	CONSTRAINT `nfce_access_keys_accessKey_unique` UNIQUE(`accessKey`)
);
--> statement-breakpoint
CREATE TABLE `nfce_queries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`certificateId` int NOT NULL,
	`cnpj` varchar(14) NOT NULL,
	`startDate` timestamp NOT NULL,
	`endDate` timestamp NOT NULL,
	`totalKeysFound` int DEFAULT 0,
	`status` enum('pending','success','error') DEFAULT 'pending',
	`errorMessage` text,
	`responseData` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `nfce_queries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `isActive` boolean DEFAULT true NOT NULL;