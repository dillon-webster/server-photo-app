CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`password_hash` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE `albums` ADD `owner_id` text REFERENCES users(id);--> statement-breakpoint
ALTER TABLE `photos` ADD `owner_id` text REFERENCES users(id);--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);
