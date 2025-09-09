import { eq } from 'drizzle-orm';
import type { DrizzleDB } from '../client';
import { footerSettings, creator, work, workTitle, asset, mediaSource, workCreator, workRelation, tag, category, workTag, workCategory } from '../schema';

// Types
export interface FooterSetting {
  uuid: string;
  item_type: 'link' | 'social' | 'copyright';
  text: string;
  url?: string;
  icon_class?: string;
}

// UUID validation
const UUID_PATTERNS = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function validateUUID(uuid: string): boolean {
  return UUID_PATTERNS.test(uuid);
}

/**
 * Get all footer settings
 */
export async function getFooterSettings(db: DrizzleDB): Promise<FooterSetting[]> {
  const settings = await db
    .select({
      uuid: footerSettings.uuid,
      item_type: footerSettings.itemType,
      text: footerSettings.text,
      url: footerSettings.url,
      icon_class: footerSettings.iconClass,
    })
    .from(footerSettings);

  return settings.map(s => ({
    ...s,
    url: s.url || undefined,
    icon_class: s.icon_class || undefined,
  }));
}

/**
 * Insert a new footer setting
 */
export async function insertFooterSetting(db: DrizzleDB, setting: FooterSetting): Promise<boolean> {
  if (!validateUUID(setting.uuid)) return false;

  try {
    await db.insert(footerSettings).values({
      uuid: setting.uuid,
      itemType: setting.item_type,
      text: setting.text,
      url: setting.url || null,
      iconClass: setting.icon_class || null,
    });
    return true;
  } catch (error) {
    console.error('Error inserting footer setting:', error);
    return false;
  }
}

/**
 * Update a footer setting
 */
export async function updateFooterSetting(db: DrizzleDB, setting: FooterSetting): Promise<boolean> {
  if (!validateUUID(setting.uuid)) return false;

  try {
    await db
      .update(footerSettings)
      .set({
        itemType: setting.item_type,
        text: setting.text,
        url: setting.url || null,
        iconClass: setting.icon_class || null,
      })
      .where(eq(footerSettings.uuid, setting.uuid));
    return true;
  } catch (error) {
    console.error('Error updating footer setting:', error);
    return false;
  }
}

/**
 * Delete a footer setting
 */
export async function deleteFooterSetting(db: DrizzleDB, uuid: string): Promise<boolean> {
  if (!validateUUID(uuid)) return false;

  try {
    await db.delete(footerSettings).where(eq(footerSettings.uuid, uuid));
    return true;
  } catch (error) {
    console.error('Error deleting footer setting:', error);
    return false;
  }
}

/**
 * Drop all user data tables (for database reset)
 * Uses Drizzle schema table references for type safety
 */
export async function dropUserTables(db: DrizzleDB): Promise<void> {
  // Import all table schemas
  const {
    workCategory,
    workTag,
    workWiki,
    workRelation,
    assetCreator,
    asset,
    mediaSource,
    workLicense,
    workTitle,
    workCreator,
    creatorWiki,
    creator,
    work,
    category,
    tag,
    footerSettings
  } = await import('../schema');

  // Define drop order to respect foreign key constraints
  const tablesToDrop = [
    workCategory,    // Junction table first
    workTag,         // Junction table first
    workWiki,        // Foreign key to work
    workRelation,    // Foreign key to work
    assetCreator,    // Junction table for asset
    asset,           // Foreign key to work
    mediaSource,     // Foreign key to work
    workLicense,     // Foreign key to work
    workTitle,       // Foreign key to work
    workCreator,     // Foreign key to work and creator
    creatorWiki,     // Foreign key to creator
    creator,         // Referenced by multiple tables
    work,            // Referenced by multiple tables
    category,        // Self-referencing and work-referenced
    tag,             // Referenced by work_tag
    footerSettings   // Independent table
  ];

  // Execute drop statements using table names from schema
  for (const table of tablesToDrop) {
    try {
      const tableName = (table as any)._.name || 
                       (table as any).tableName ||
                       String(table);
      await db.run(`DROP TABLE IF EXISTS ${tableName}`);
    } catch (error) {
      // Ignore errors for tables that don't exist
      console.warn(`Warning dropping table ${table}: ${error}`);
    }
  }
}

/**
 * Export all table data as JSON
 */
export async function exportAllTables(db: DrizzleDB): Promise<Record<string, any[]>> {
  const exportData: Record<string, any[]> = {};

  try {
    // Export all main tables using Drizzle queries
    exportData.creator = await db.select().from(creator);
    exportData.work = await db.select().from(work);
    exportData.work_title = await db.select().from(workTitle);
    exportData.asset = await db.select().from(asset);
    exportData.media_source = await db.select().from(mediaSource);
    exportData.work_creator = await db.select().from(workCreator);
    exportData.work_relation = await db.select().from(workRelation);
    exportData.tag = await db.select().from(tag);
    exportData.category = await db.select().from(category);
    exportData.work_tag = await db.select().from(workTag);
    exportData.work_category = await db.select().from(workCategory);
    exportData.footer_settings = await db.select().from(footerSettings);

    // Additional tables that might exist
    const additionalTables = [
      'creator_wiki',
      'work_license', 
      'work_wiki',
      'asset_creator'
    ];

    for (const tableName of additionalTables) {
      try {
        const result = await db.all(`SELECT * FROM ${tableName}`);
        if (result && result.length > 0) {
          exportData[tableName] = result;
        }
      } catch (error) {
        // Table might not exist, skip it
        console.warn(`Warning exporting table ${tableName}: ${error}`);
      }
    }

    return exportData;
  } catch (error) {
    console.error('Error exporting tables:', error);
    throw error;
  }
}

/**
 * Initialize database using Drizzle migrations
 */
export async function initializeDatabaseWithMigrations(db: DrizzleDB): Promise<void> {
  try {
    // Read migration file content
    const migrationPath = './migrations/0000_broad_shooting_star.sql';
    
    // For now, we'll execute the migration SQL directly since D1 doesn't support
    // Drizzle's migration system yet. In the future, this could be:
    // await migrate(db, { migrationsFolder: './migrations' });
    
    const fs = await import('fs');
    const path = await import('path');
    
    // Read the migration file
    const migrationFile = fs.readFileSync(
      path.resolve(process.cwd(), migrationPath), 
      'utf-8'
    );
    
    // Split by statement breakpoints and execute each statement
    const statements = migrationFile
      .split('--> statement-breakpoint')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt && !stmt.startsWith('-->'));
    
    for (const statement of statements) {
      if (statement) {
        try {
          await db.run(statement);
        } catch (error) {
          console.warn(`Warning executing migration statement: ${error}`);
        }
      }
    }
    
    console.log('Database initialized with Drizzle migrations');
  } catch (error) {
    console.error('Error initializing database with migrations:', error);
    // Fallback to manual initialization if migration fails
    await initializeDatabaseManual(db);
  }
}

/**
 * Manual database initialization (fallback method)
 */
async function initializeDatabaseManual(db: DrizzleDB): Promise<void> {
  // Fallback initialization using original initdb.sql statements
  const statements = [
    `PRAGMA defer_foreign_keys=TRUE`,
    
    `CREATE TABLE creator ( 
      uuid TEXT PRIMARY KEY, 
      name TEXT NOT NULL, 
      type TEXT CHECK(type IN ('human', 'virtual')) NOT NULL 
    )`,
    
    `CREATE TABLE creator_wiki ( 
      creator_uuid TEXT NOT NULL REFERENCES creator(uuid) ON DELETE CASCADE, 
      platform TEXT NOT NULL, 
      identifier TEXT NOT NULL, 
      PRIMARY KEY (creator_uuid, platform) 
    )`,
    
    `CREATE TABLE work ( 
      uuid TEXT PRIMARY KEY, 
      copyright_basis TEXT NOT NULL CHECK(copyright_basis IN ('none', 'accept', 'license')) 
    )`,
    
    // Add other tables as needed...
  ];
  
  for (const statement of statements) {
    try {
      await db.run(statement);
    } catch (error) {
      console.warn(`Warning creating table: ${error}`);
    }
  }
}