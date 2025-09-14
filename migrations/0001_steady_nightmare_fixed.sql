PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_work_title` (
	`uuid` text PRIMARY KEY NOT NULL,
	`work_uuid` text NOT NULL,
	`is_official` integer NOT NULL,
	`language` text NOT NULL,
	`title` text NOT NULL,
	FOREIGN KEY (`work_uuid`) REFERENCES `work`(`uuid`) ON UPDATE no action ON DELETE cascade
);--> statement-breakpoint
INSERT INTO `__new_work_title`("uuid", "work_uuid", "is_official", "language", "title") 
SELECT 
    lower(hex(randomblob(4))) || '-' || 
    lower(hex(randomblob(2))) || '-' || 
    '4' || substr(lower(hex(randomblob(2))), 2) || '-' || 
    substr('89ab', abs(random()) % 4 + 1, 1) || 
    substr(lower(hex(randomblob(2))), 2) || '-' || 
    lower(hex(randomblob(6))) as uuid,
    "work_uuid", "is_official", "language", "title" 
FROM `work_title`;--> statement-breakpoint
DROP TABLE `work_title`;--> statement-breakpoint
ALTER TABLE `__new_work_title` RENAME TO `work_title`;--> statement-breakpoint
PRAGMA foreign_keys=ON;