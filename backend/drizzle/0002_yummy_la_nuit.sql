CREATE TABLE `DetectedStolenMobile` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`stolenMobileId` integer NOT NULL,
	`mobileId` integer NOT NULL,
	`transactionId` integer NOT NULL,
	`detectedAt` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`stolenMobileId`) REFERENCES `StolenMobile`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`mobileId`) REFERENCES `Mobile`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`transactionId`) REFERENCES `Transaction`(`id`) ON UPDATE no action ON DELETE cascade
);
