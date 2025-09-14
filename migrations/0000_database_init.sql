CREATE TABLE `asset` (
	`uuid` text PRIMARY KEY NOT NULL,
	`file_id` text NOT NULL,
	`work_uuid` text NOT NULL,
	`asset_type` text NOT NULL,
	`file_name` text NOT NULL,
	`is_previewpic` integer,
	`language` text,
	FOREIGN KEY (`work_uuid`) REFERENCES `work`(`uuid`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `asset_creator` (
	`asset_uuid` text NOT NULL,
	`creator_uuid` text NOT NULL,
	`role` text NOT NULL,
	PRIMARY KEY(`asset_uuid`, `creator_uuid`),
	FOREIGN KEY (`asset_uuid`) REFERENCES `asset`(`uuid`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`creator_uuid`) REFERENCES `creator`(`uuid`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `category` (
	`uuid` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`parent_uuid` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `category_name_unique` ON `category` (`name`);--> statement-breakpoint
CREATE TABLE `creator` (
	`uuid` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `creator_wiki` (
	`creator_uuid` text NOT NULL,
	`platform` text NOT NULL,
	`identifier` text NOT NULL,
	PRIMARY KEY(`creator_uuid`, `platform`),
	FOREIGN KEY (`creator_uuid`) REFERENCES `creator`(`uuid`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `footer_settings` (
	`uuid` text PRIMARY KEY NOT NULL,
	`item_type` text NOT NULL,
	`text` text NOT NULL,
	`url` text,
	`icon_class` text
);
--> statement-breakpoint
CREATE TABLE `media_source` (
	`uuid` text PRIMARY KEY NOT NULL,
	`work_uuid` text NOT NULL,
	`is_music` integer NOT NULL,
	`file_name` text NOT NULL,
	`url` text NOT NULL,
	`mime_type` text NOT NULL,
	`info` text NOT NULL,
	FOREIGN KEY (`work_uuid`) REFERENCES `work`(`uuid`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `tag` (
	`uuid` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tag_name_unique` ON `tag` (`name`);--> statement-breakpoint
CREATE TABLE `work` (
	`uuid` text PRIMARY KEY NOT NULL,
	`copyright_basis` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `work_category` (
	`work_uuid` text NOT NULL,
	`category_uuid` text NOT NULL,
	PRIMARY KEY(`work_uuid`, `category_uuid`),
	FOREIGN KEY (`work_uuid`) REFERENCES `work`(`uuid`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`category_uuid`) REFERENCES `category`(`uuid`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `work_creator` (
	`work_uuid` text NOT NULL,
	`creator_uuid` text NOT NULL,
	`role` text NOT NULL,
	PRIMARY KEY(`work_uuid`, `creator_uuid`, `role`),
	FOREIGN KEY (`work_uuid`) REFERENCES `work`(`uuid`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`creator_uuid`) REFERENCES `creator`(`uuid`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `work_license` (
	`work_uuid` text PRIMARY KEY NOT NULL,
	`license_type` text NOT NULL,
	FOREIGN KEY (`work_uuid`) REFERENCES `work`(`uuid`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `work_relation` (
	`uuid` text PRIMARY KEY NOT NULL,
	`from_work_uuid` text NOT NULL,
	`to_work_uuid` text NOT NULL,
	`relation_type` text NOT NULL,
	FOREIGN KEY (`from_work_uuid`) REFERENCES `work`(`uuid`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`to_work_uuid`) REFERENCES `work`(`uuid`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `work_tag` (
	`work_uuid` text NOT NULL,
	`tag_uuid` text NOT NULL,
	PRIMARY KEY(`work_uuid`, `tag_uuid`),
	FOREIGN KEY (`work_uuid`) REFERENCES `work`(`uuid`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tag_uuid`) REFERENCES `tag`(`uuid`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `work_title` (
	`work_uuid` text NOT NULL,
	`is_official` integer NOT NULL,
	`language` text NOT NULL,
	`title` text NOT NULL,
	PRIMARY KEY(`work_uuid`, `language`),
	FOREIGN KEY (`work_uuid`) REFERENCES `work`(`uuid`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `work_wiki` (
	`work_uuid` text NOT NULL,
	`platform` text NOT NULL,
	`identifier` text NOT NULL,
	PRIMARY KEY(`work_uuid`, `platform`),
	FOREIGN KEY (`work_uuid`) REFERENCES `work`(`uuid`) ON UPDATE no action ON DELETE cascade
);
