ALTER TABLE `Notification` ADD `mobileId` integer REFERENCES Mobile(id);--> statement-breakpoint
ALTER TABLE `Notification` ADD `userId` integer REFERENCES User(id);