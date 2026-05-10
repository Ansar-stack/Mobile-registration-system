CREATE TABLE `addresses` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`type` text NOT NULL,
	`province` text,
	`city` text,
	`district` text,
	`street` text,
	`postal_code` text,
	`customer_id` integer NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `customers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`gender` text NOT NULL,
	`id_card_number` text NOT NULL,
	`phone_number` text NOT NULL,
	`id_image` text,
	`id_image_public_id` text,
	`added_by` integer NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`added_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `customers_id_card_number_unique` ON `customers` (`id_card_number`);--> statement-breakpoint
CREATE UNIQUE INDEX `customers_phone_number_unique` ON `customers` (`phone_number`);--> statement-breakpoint
CREATE TABLE `detected_stolen_mobiles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`stolen_mobile_id` integer NOT NULL,
	`mobile_id` integer NOT NULL,
	`transaction_id` integer NOT NULL,
	`detected_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`stolen_mobile_id`) REFERENCES `stolen_mobiles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`mobile_id`) REFERENCES `mobiles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`transaction_id`) REFERENCES `transactions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `mobiles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`imei1` text NOT NULL,
	`imei2` text,
	`brand` text NOT NULL,
	`model` text NOT NULL,
	`color` text NOT NULL,
	`ram` text,
	`storage` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `mobiles_imei1_unique` ON `mobiles` (`imei1`);--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`type` text NOT NULL,
	`message` text NOT NULL,
	`imei` text NOT NULL,
	`is_read` integer DEFAULT false NOT NULL,
	`mobile_id` integer,
	`user_id` integer,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`mobile_id`) REFERENCES `mobiles`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `stolen_mobiles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`imei1` text NOT NULL,
	`imei2` text,
	`brand` text NOT NULL,
	`model` text NOT NULL,
	`color` text,
	`ram` text,
	`storage` text,
	`reporter_name` text NOT NULL,
	`reporter_phone` text NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `stolen_mobiles_imei1_unique` ON `stolen_mobiles` (`imei1`);--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`type` text NOT NULL,
	`price` real,
	`notes` text,
	`user_id` integer NOT NULL,
	`mobile_id` integer NOT NULL,
	`customer_id` integer,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`mobile_id`) REFERENCES `mobiles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text,
	`email` text NOT NULL,
	`password` text NOT NULL,
	`phone` text,
	`shop_number` text,
	`role` text DEFAULT 'user' NOT NULL,
	`refresh_token` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);