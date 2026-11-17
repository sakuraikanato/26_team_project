CREATE TABLE `posts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`keeper_id` integer,
	`title` text NOT NULL,
	`description` text,
	`image_url` text,
	`tags` text DEFAULT '[]' NOT NULL,
	`mood` text DEFAULT 'kiritto' NOT NULL,
	`taken_at` text NOT NULL,
	`weather` text,
	`weather_code` integer,
	`temperature` real,
	`like_count` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`keeper_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `comments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`post_id` integer NOT NULL,
	`name` text DEFAULT 'あなた' NOT NULL,
	`text` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`keeper_id` integer NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`location` text,
	`tags` text DEFAULT '[]' NOT NULL,
	`start_date` text NOT NULL,
	`end_date` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`keeper_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `user` ADD `role` text DEFAULT 'KEEPER' NOT NULL;
--> statement-breakpoint
UPDATE `user` SET `role` = 'KEEPER' WHERE `role` = 'USER';