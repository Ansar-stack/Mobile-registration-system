CREATE TABLE `Address` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`type` text NOT NULL,
	`province` text,
	`city` text,
	`district` text,
	`street` text,
	`postalCode` text,
	`customerId` integer NOT NULL,
	`createdAt` text DEFAULT (datetime('now')) NOT NULL,
	`updatedAt` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`customerId`) REFERENCES `Customer`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `Customer` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`firstName` text NOT NULL,
	`lastName` text NOT NULL,
	`gender` text NOT NULL,
	`idCardNumber` text NOT NULL,
	`phoneNumber` text NOT NULL,
	`idImage` text,
	`idImagePublicId` text,
	`addedBy` integer NOT NULL,
	`createdAt` text DEFAULT (datetime('now')) NOT NULL,
	`updatedAt` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`addedBy`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `Customer_idCardNumber_unique` ON `Customer` (`idCardNumber`);--> statement-breakpoint
CREATE UNIQUE INDEX `Customer_phoneNumber_unique` ON `Customer` (`phoneNumber`);--> statement-breakpoint
CREATE TABLE `Mobile` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`imei1` text NOT NULL,
	`imei2` text,
	`brand` text NOT NULL,
	`model` text NOT NULL,
	`color` text NOT NULL,
	`ram` text,
	`storage` text,
	`createdAt` text DEFAULT (datetime('now')) NOT NULL,
	`updatedAt` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `Mobile_imei1_unique` ON `Mobile` (`imei1`);--> statement-breakpoint
CREATE TABLE `Notification` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`type` text NOT NULL,
	`message` text NOT NULL,
	`imei` text NOT NULL,
	`isRead` integer DEFAULT false NOT NULL,
	`createdAt` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `StolenMobile` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`imei1` text NOT NULL,
	`imei2` text,
	`brand` text NOT NULL,
	`model` text NOT NULL,
	`color` text,
	`ram` text,
	`storage` text,
	`reporterName` text NOT NULL,
	`reporterPhone` text NOT NULL,
	`createdAt` text DEFAULT (datetime('now')) NOT NULL,
	`updatedAt` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `StolenMobile_imei1_unique` ON `StolenMobile` (`imei1`);--> statement-breakpoint
CREATE TABLE `Transaction` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`type` text NOT NULL,
	`price` real,
	`notes` text,
	`userId` integer NOT NULL,
	`mobileId` integer NOT NULL,
	`customerId` integer,
	`createdAt` text DEFAULT (datetime('now')) NOT NULL,
	`updatedAt` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`mobileId`) REFERENCES `Mobile`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`customerId`) REFERENCES `Customer`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `User` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text,
	`email` text NOT NULL,
	`password` text NOT NULL,
	`phone` text,
	`shopNumber` text,
	`role` text DEFAULT 'user' NOT NULL,
	`refreshToken` text,
	`createdAt` text DEFAULT (datetime('now')) NOT NULL,
	`updatedAt` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `User_email_unique` ON `User` (`email`);