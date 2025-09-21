import { eq, isNull, and } from 'drizzle-orm';
import type { DrizzleDB } from '../client';
import { 
    footerSettings, 
    creator, work, workTitle, asset, mediaSource, workCreator, workRelation, 
    tag, category, workTag, workCategory,
    externalSource, externalObject, assetExternalObject, mediaSourceExternalObject,
    siteConfig
} from '../schema';
import { initializeDefaultConfig, initializeSecrets, generateSecretKey } from './config';

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

export interface MigrationStatus {
    inProgress: boolean;
    completed: boolean;
    totalAssets: number;
    totalMediaSources: number;
    migratedAssets: number;
    migratedMediaSources: number;
    defaultSourceUuid?: string;
    errors: string[];
    startTime?: Date;
    endTime?: Date;
}

export interface MigrationResult {
    success: boolean;
    status: MigrationStatus;
    message: string;
}

/**
 * Migrate existing assets and media sources to use external storage system
 * Based on ASSET_URL environment variable
 */
export async function migrateToExternalStorage(
    db: DrizzleDB, 
    assetUrl: string,
    batchSize: number = 50
): Promise<MigrationResult> {
    const status: MigrationStatus = {
        inProgress: true,
        completed: false,
        totalAssets: 0,
        totalMediaSources: 0,
        migratedAssets: 0,
        migratedMediaSources: 0,
        errors: [],
        startTime: new Date(),
    };

    try {
        // Note: Tables should already exist via migrations or dashboard
        console.log('Starting migration (tables should already exist)...');
        
        // Check if migration already exists
        const existingSource = await db.select()
            .from(externalSource)
            .where(eq(externalSource.name, 'Default Asset Storage'))
            .limit(1);

        let defaultExternalSourceUuid: string;

        if (existingSource.length > 0) {
            defaultExternalSourceUuid = existingSource[0].uuid;
            console.log('Using existing default storage source:', defaultExternalSourceUuid);
        } else {
            // Create default external source based on ASSET_URL
            defaultExternalSourceUuid = crypto.randomUUID();
            
            // Ensure assetUrl doesn't end with slash
            const cleanAssetUrl = assetUrl.replace(/\/$/, '');
            
            await db.insert(externalSource).values({
                uuid: defaultExternalSourceUuid,
                type: 'raw_url',
                name: 'Default Asset Storage',
                endpoint: `${cleanAssetUrl}/{FILE_ID}`, // Use FILE_ID as placeholder
            });
            
            console.log('Created default storage source:', defaultExternalSourceUuid);
        }

        // Check for media direct URL source
        const existingDirectSource = await db.select()
            .from(externalSource)
            .where(eq(externalSource.name, 'Direct URL Storage'))
            .limit(1);

        let directUrlSourceUuid: string;

        if (existingDirectSource.length > 0) {
            directUrlSourceUuid = existingDirectSource[0].uuid;
            console.log('Using existing direct URL storage source:', directUrlSourceUuid);
        } else {
            // Create direct URL source for media sources with complete URLs
            directUrlSourceUuid = crypto.randomUUID();
            
            await db.insert(externalSource).values({
                uuid: directUrlSourceUuid,
                type: 'raw_url',
                name: 'Direct URL Storage',
                endpoint: '{FILE_ID}', // Direct URL replacement
            });
            
            console.log('Created direct URL storage source:', directUrlSourceUuid);
        }

        status.defaultSourceUuid = defaultExternalSourceUuid;

        // Get total counts for progress tracking
        const assetCount = await db.select({ count: asset.uuid }).from(asset);
        const mediaCount = await db.select({ count: mediaSource.uuid }).from(mediaSource);
        
        status.totalAssets = assetCount.length;
        status.totalMediaSources = mediaCount.length;

        console.log(`Starting migration: ${status.totalAssets} assets, ${status.totalMediaSources} media sources`);

        // Migrate assets in batches
        console.log('Migrating assets to external storage...');
        let assetOffset = 0;
        
        while (assetOffset < status.totalAssets) {
            const assetBatch = await db.select()
                .from(asset)
                .limit(batchSize)
                .offset(assetOffset);

            // Process batch without transaction (D1 limitation)
            for (const assetRow of assetBatch) {
                try {
                    // Check if already migrated
                    const existingAssociation = await db.select()
                        .from(assetExternalObject)
                        .where(eq(assetExternalObject.asset_uuid, assetRow.uuid))
                        .limit(1);

                    if (existingAssociation.length > 0) {
                        console.log(`Asset ${assetRow.uuid} already migrated, skipping`);
                        continue;
                    }

                    // Skip assets without file_name (invalid)
                    if (!assetRow.file_name) {
                        console.log(`Asset ${assetRow.uuid} has no file_name, skipping`);
                        continue;
                    }

                    // Create external object for each asset
                    const externalObjectUuid = crypto.randomUUID();
                    await db.insert(externalObject).values({
                        uuid: externalObjectUuid,
                        external_source_uuid: defaultExternalSourceUuid,
                        mime_type: 'application/octet-stream', // Default MIME type
                        file_id: assetRow.file_name, // Use file_name as file_id since file_id is now null
                    });

                    // Create association between asset and external object
                    await db.insert(assetExternalObject).values({
                        asset_uuid: assetRow.uuid,
                        external_object_uuid: externalObjectUuid,
                    });

                    status.migratedAssets++;
                } catch (error) {
                    const errorMsg = `Error migrating asset ${assetRow.uuid}: ${error}`;
                    console.error(errorMsg);
                    status.errors.push(errorMsg);
                }
            }

            assetOffset += batchSize;
            console.log(`Migrated ${Math.min(assetOffset, status.totalAssets)}/${status.totalAssets} assets`);
        }

        // Migrate media sources in batches
        console.log('Migrating media sources to external storage...');
        let mediaOffset = 0;
        
        while (mediaOffset < status.totalMediaSources) {
            const mediaBatch = await db.select()
                .from(mediaSource)
                .limit(batchSize)
                .offset(mediaOffset);

            // Process batch without transaction (D1 limitation)
            for (const mediaRow of mediaBatch) {
                try {
                    // Check if already migrated
                    const existingAssociation = await db.select()
                        .from(mediaSourceExternalObject)
                        .where(eq(mediaSourceExternalObject.media_source_uuid, mediaRow.uuid))
                        .limit(1);

                    if (existingAssociation.length > 0) {
                        console.log(`Media source ${mediaRow.uuid} already migrated, skipping`);
                        continue;
                    }

                    // Skip media sources without URL (already migrated or invalid)
                    if (!mediaRow.url) {
                        console.log(`Media source ${mediaRow.uuid} has no URL, skipping`);
                        continue;
                    }

                    // Determine which external source to use based on URL type
                    const isCompleteUrl = mediaRow.url.startsWith('http://') || mediaRow.url.startsWith('https://');
                    let sourceUuid: string;
                    let fileId: string;
                    
                    if (isCompleteUrl) {
                        // Check if the URL starts with the provided assetUrl
                        const cleanAssetUrl = assetUrl.replace(/\/$/, '');
                        if (mediaRow.url.startsWith(cleanAssetUrl + '/') || mediaRow.url.startsWith(cleanAssetUrl)) {
                            // Extract file_id from the URL and use asset storage
                            let extractedPath: string;
                            if (mediaRow.url.startsWith(cleanAssetUrl + '/')) {
                                extractedPath = mediaRow.url.substring(cleanAssetUrl.length + 1);
                            } else if (mediaRow.url.startsWith(cleanAssetUrl) && mediaRow.url.length > cleanAssetUrl.length) {
                                // Handle case where URL is like "https://assets.vocarchive.com/filename" without trailing slash in base
                                const remainingPath = mediaRow.url.substring(cleanAssetUrl.length);
                                extractedPath = remainingPath.startsWith('/') ? remainingPath.substring(1) : remainingPath;
                            } else {
                                // Fallback to using the complete URL
                                extractedPath = mediaRow.url;
                            }
                            
                            fileId = extractedPath;
                            sourceUuid = defaultExternalSourceUuid;
                            console.log(`Media source ${mediaRow.uuid}: extracted file_id "${fileId}" from asset URL "${mediaRow.url}"`);
                        } else {
                            // Use complete URL with direct URL storage
                            fileId = mediaRow.url;
                            sourceUuid = directUrlSourceUuid;
                            console.log(`Media source ${mediaRow.uuid}: using complete URL "${fileId}"`);
                        }
                    } else {
                        // Relative path, use with asset URL
                        fileId = mediaRow.url;
                        sourceUuid = defaultExternalSourceUuid;
                        console.log(`Media source ${mediaRow.uuid}: using relative path "${fileId}"`);
                    }

                    // Create external object for each media source
                    const externalObjectUuid = crypto.randomUUID();
                    await db.insert(externalObject).values({
                        uuid: externalObjectUuid,
                        external_source_uuid: sourceUuid,
                        mime_type: mediaRow.mime_type,
                        file_id: fileId,
                    });

                    // Create association between media source and external object
                    await db.insert(mediaSourceExternalObject).values({
                        media_source_uuid: mediaRow.uuid,
                        external_object_uuid: externalObjectUuid,
                    });

                    status.migratedMediaSources++;
                } catch (error) {
                    const errorMsg = `Error migrating media source ${mediaRow.uuid}: ${error}`;
                    console.error(errorMsg);
                    status.errors.push(errorMsg);
                }
            }

            mediaOffset += batchSize;
            console.log(`Migrated ${Math.min(mediaOffset, status.totalMediaSources)}/${status.totalMediaSources} media sources`);
        }

        status.completed = true;
        status.inProgress = false;
        status.endTime = new Date();

        const successMessage = `Migration completed successfully: ${status.migratedAssets}/${status.totalAssets} assets and ${status.migratedMediaSources}/${status.totalMediaSources} media sources migrated`;
        console.log(successMessage);

        if (status.errors.length > 0) {
            console.warn(`Migration completed with ${status.errors.length} errors`);
        }

        return {
            success: true,
            status,
            message: successMessage
        };

    } catch (error) {
        status.inProgress = false;
        status.endTime = new Date();
        const errorMessage = `Migration failed: ${error}`;
        status.errors.push(errorMessage);
        console.error(errorMessage);
        
        return {
            success: false,
            status,
            message: errorMessage
        };
    }
}

/**
 * Legacy migration function (deprecated)
 * @deprecated Use the new migrateToExternalStorage(db, assetUrl) instead
 */
export async function migrateToExternalStorageLegacy(db: DrizzleDB): Promise<boolean> {
    try {
        // Create default external source for legacy content
        const defaultExternalSourceUuid = crypto.randomUUID();
        await db.insert(externalSource).values({
            uuid: defaultExternalSourceUuid,
            type: 'raw_url',
            name: 'Legacy Storage',
            endpoint: '{FILE_ID}', // Direct URL replacement
        });

        // Migrate existing assets
        console.log('Migrating assets to external storage...');
        const assets = await db.select().from(asset);
        
        for (const assetRow of assets) {
            // Skip assets without file_name
            if (!assetRow.file_name) {
                console.log(`Asset ${assetRow.uuid} has no file_name, skipping`);
                continue;
            }

            // Create external object for each asset
            const externalObjectUuid = crypto.randomUUID();
            await db.insert(externalObject).values({
                uuid: externalObjectUuid,
                external_source_uuid: defaultExternalSourceUuid,
                mime_type: 'application/octet-stream', // Default MIME type
                file_id: assetRow.file_name, // Use file_name since file_id is now null
            });

            // Create association between asset and external object
            await db.insert(assetExternalObject).values({
                asset_uuid: assetRow.uuid,
                external_object_uuid: externalObjectUuid,
            });
        }

        // Migrate existing media sources
        console.log('Migrating media sources to external storage...');
        const mediaSources = await db.select().from(mediaSource);
        
        for (const mediaRow of mediaSources) {
            // Skip media sources without url or file_name
            if (!mediaRow.url && !mediaRow.file_name) {
                console.log(`Media source ${mediaRow.uuid} has no URL or file_name, skipping`);
                continue;
            }

            // Create external object for each media source
            const externalObjectUuid = crypto.randomUUID();
            await db.insert(externalObject).values({
                uuid: externalObjectUuid,
                external_source_uuid: defaultExternalSourceUuid,
                mime_type: mediaRow.mime_type,
                file_id: mediaRow.url || mediaRow.file_name, // Use URL or fallback to file_name
            });

            // Create association between media source and external object
            await db.insert(mediaSourceExternalObject).values({
                media_source_uuid: mediaRow.uuid,
                external_object_uuid: externalObjectUuid,
            });
        }

        console.log(`Migration completed: ${assets.length} assets and ${mediaSources.length} media sources migrated`);
        return true;
    } catch (error) {
        console.error('Error during migration:', error);
        return false;
    }
}

/**
 * Validate migration integrity
 */
export async function validateMigration(db: DrizzleDB): Promise<MigrationStatus> {
    const status: MigrationStatus = {
        inProgress: false,
        completed: false,
        totalAssets: 0,
        totalMediaSources: 0,
        migratedAssets: 0,
        migratedMediaSources: 0,
        errors: [],
        startTime: new Date(),
    };

    try {
        // Use optimized helper functions
        const { 
            getAssociationCounts, 
            getDefaultExternalSource, 
            validateDatabaseIntegrity 
        } = await import('../migrations/helper');
        
        // Get counts using optimized queries
        const counts = await getAssociationCounts(db);
        status.totalAssets = counts.totalAssets;
        status.totalMediaSources = counts.totalMediaSources;
        status.migratedAssets = counts.migratedAssets;
        status.migratedMediaSources = counts.migratedMediaSources;

        // Check for default source
        const defaultSource = await getDefaultExternalSource(db);
        if (defaultSource) {
            status.defaultSourceUuid = defaultSource.uuid;
        } else {
            status.errors.push('Default Asset Storage source not found');
        }

        // Validate database integrity
        const validation = await validateDatabaseIntegrity(db);
        if (!validation.isValid) {
            status.errors.push(...validation.errors);
        }

        // Determine if migration is completed
        status.completed = (
            status.migratedAssets === status.totalAssets && 
            status.migratedMediaSources === status.totalMediaSources &&
            status.errors.length === 0
        );

        status.endTime = new Date();

        console.log(`Migration validation completed: ${status.migratedAssets}/${status.totalAssets} assets, ${status.migratedMediaSources}/${status.totalMediaSources} media sources migrated`);
        
        if (status.errors.length > 0) {
            console.warn(`Validation found ${status.errors.length} issues:`, status.errors);
        }

        return status;
    } catch (error) {
        status.errors.push(`Validation error: ${error}`);
        status.endTime = new Date();
        console.error('Error during migration validation:', error);
        return status;
    }
}

/**
 * Repair corrupted external object file_id entries
 * Fixes cases where file_id contains full URLs that should just be filenames
 */
export async function repairCorruptedExternalObjects(
    db: DrizzleDB, 
    baseAssetUrl: string
): Promise<{ repaired: number; errors: string[] }> {
    const result: { repaired: number; errors: string[] } = { repaired: 0, errors: [] };
    
    try {
        const cleanAssetUrl = baseAssetUrl.replace(/\/$/, '');
        
        // Find external objects with file_id that contains the base URL (indicating corruption)
        const corruptedObjects = await db
            .select({
                uuid: externalObject.uuid,
                file_id: externalObject.file_id,
                external_source_uuid: externalObject.external_source_uuid,
                source_endpoint: externalSource.endpoint,
                source_name: externalSource.name
            })
            .from(externalObject)
            .innerJoin(externalSource, eq(externalObject.external_source_uuid, externalSource.uuid));

        console.log(`Found ${corruptedObjects.length} potentially corrupted external objects`);

        for (const obj of corruptedObjects) {
            try {
                // Check if this object is actually corrupted (file_id contains the base URL)
                if (!obj.file_id.includes(cleanAssetUrl)) {
                    continue; // Skip non-corrupted objects
                }
                
                let repairedFileId: string = obj.file_id;
                
                // Check if file_id is a full URL that should be just a filename
                if (obj.file_id.startsWith(cleanAssetUrl + '/')) {
                    repairedFileId = obj.file_id.substring(cleanAssetUrl.length + 1);
                } else if (obj.file_id.startsWith(cleanAssetUrl)) {
                    const remainingPath = obj.file_id.substring(cleanAssetUrl.length);
                    repairedFileId = remainingPath.startsWith('/') ? remainingPath.substring(1) : remainingPath;
                }
                
                // Only update if we actually extracted a different file_id
                if (repairedFileId !== obj.file_id && repairedFileId) {
                    await db
                        .update(externalObject)
                        .set({ file_id: repairedFileId })
                        .where(eq(externalObject.uuid, obj.uuid));
                    
                    console.log(`Repaired external object ${obj.uuid}: "${obj.file_id}" -> "${repairedFileId}"`);
                    result.repaired++;
                } else {
                    console.log(`Skipped external object ${obj.uuid}: no valid repair found for "${obj.file_id}"`);
                }
            } catch (error) {
                const errorMsg = `Error repairing external object ${obj.uuid}: ${error}`;
                console.error(errorMsg);
                result.errors.push(errorMsg);
            }
        }
        
        console.log(`Repair completed: ${result.repaired} objects repaired, ${result.errors.length} errors`);
        return result;
    } catch (error) {
        const errorMsg = `Error during repair operation: ${error}`;
        console.error(errorMsg);
        result.errors.push(errorMsg);
        return result;
    }
}

export async function getMigrationStatus(db: DrizzleDB): Promise<MigrationStatus> {
    const status: MigrationStatus = {
        inProgress: false,
        completed: false,
        totalAssets: 0,
        totalMediaSources: 0,
        migratedAssets: 0,
        migratedMediaSources: 0,
        errors: [],
        startTime: new Date(),
    };

    try {
        // Use optimized count queries from helper
        const { getAssociationCounts, getDefaultExternalSource } = await import('../migrations/helper');
        
        const counts = await getAssociationCounts(db);
        status.totalAssets = counts.totalAssets;
        status.totalMediaSources = counts.totalMediaSources;
        status.migratedAssets = counts.migratedAssets;
        status.migratedMediaSources = counts.migratedMediaSources;

        // Check for default source
        const defaultSource = await getDefaultExternalSource(db);
        if (defaultSource) {
            status.defaultSourceUuid = defaultSource.uuid;
        }

        // Simple completion check
        status.completed = (
            status.migratedAssets === status.totalAssets && 
            status.migratedMediaSources === status.totalMediaSources &&
            status.defaultSourceUuid !== undefined
        );

        status.endTime = new Date();

        return status;
    } catch (error) {
        status.errors.push(`Status check error: ${error}`);
        status.endTime = new Date();
        console.error('Error checking migration status:', error);
        return status;
    }
}

/**
 * Get all footer settings
 */
export async function getFooterSettings(db: DrizzleDB): Promise<FooterSetting[]> {
    const settings = await db
        .select({
            uuid: footerSettings.uuid,
            item_type: footerSettings.item_type,
            text: footerSettings.text,
            url: footerSettings.url,
            icon_class: footerSettings.icon_class,
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
            item_type: setting.item_type,
            text: setting.text,
            url: setting.url || null,
            icon_class: setting.icon_class || null,
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
                item_type: setting.item_type,
                text: setting.text,
                url: setting.url || null,
                icon_class: setting.icon_class || null,
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
 * Clear all user data tables (preserving table structure)
 * Uses Drizzle delete operations instead of DROP TABLE
 */
export async function clearUserDataTables(db: DrizzleDB): Promise<void> {
    const { truncateAllTables } = await import('../migrations/helper');
    return truncateAllTables(db);
}

/**
 * Export all table data as JSON using pure Drizzle queries
 */
export async function exportAllTables(db: DrizzleDB): Promise<Record<string, any[]>> {
    const exportData: Record<string, any[]> = {};

    try {
        // Import all table schemas
        const {
            creator, work, workTitle, asset, mediaSource, workCreator, workRelation,
            tag, category, workTag, workCategory, footerSettings, siteConfig,
            externalSource, externalObject, assetExternalObject, mediaSourceExternalObject,
            creatorWiki, workLicense, workWiki, assetCreator
        } = await import('../schema');

        // Export all main tables using Drizzle queries
        const exportPromises = [
            db.select().from(creator).then(data => { exportData.creator = data; }),
            db.select().from(work).then(data => { exportData.work = data; }),
            db.select().from(workTitle).then(data => { exportData.work_title = data; }),
            db.select().from(asset).then(data => { exportData.asset = data; }),
            db.select().from(mediaSource).then(data => { exportData.media_source = data; }),
            db.select().from(workCreator).then(data => { exportData.work_creator = data; }),
            db.select().from(workRelation).then(data => { exportData.work_relation = data; }),
            db.select().from(tag).then(data => { exportData.tag = data; }),
            db.select().from(category).then(data => { exportData.category = data; }),
            db.select().from(workTag).then(data => { exportData.work_tag = data; }),
            db.select().from(workCategory).then(data => { exportData.work_category = data; }),
            db.select().from(footerSettings).then(data => { exportData.footer_settings = data; }),
            db.select().from(siteConfig).then(data => { exportData.site_config = data; }),
            
            // Export external storage tables
            db.select().from(externalSource).then(data => { exportData.external_source = data; }),
            db.select().from(externalObject).then(data => { exportData.external_object = data; }),
            db.select().from(assetExternalObject).then(data => { exportData.asset_external_object = data; }),
            db.select().from(mediaSourceExternalObject).then(data => { exportData.media_source_external_object = data; }),
        ];

        // Export optional tables with error handling
        const optionalExports = [
            db.select().from(creatorWiki).then(data => { exportData.creator_wiki = data; }).catch(() => {}),
            db.select().from(workLicense).then(data => { exportData.work_license = data; }).catch(() => {}),
            db.select().from(workWiki).then(data => { exportData.work_wiki = data; }).catch(() => {}),
            db.select().from(assetCreator).then(data => { exportData.asset_creator = data; }).catch(() => {}),
        ];

        // Execute all exports in parallel
        await Promise.all([...exportPromises, ...optionalExports]);

        return exportData;
    } catch (error) {
        console.error('Error exporting tables:', error);
        throw error;
    }
}

/**
 * Check if the database has been initialized
 * Returns true if site_config table exists and has data
 */
export async function isDatabaseInitialized(db: DrizzleDB): Promise<boolean> {
    try {
        // Try to query the site_config table
        const configData = await db.select().from(siteConfig).limit(1);
        return configData.length > 0;
    } catch (error) {
        // If table doesn't exist or query fails, database is not initialized
        console.log('Database not initialized:', error);
        return false;
    }
}

/**
 * Initialize database with configuration
 * Handles both database schema initialization and configuration setup
 */
export async function initializeDatabaseWithConfig(
    db: DrizzleDB, 
    config: {
        siteTitle?: string;
        totpSecret?: string;
        jwtSecret?: string;
        assetUrl?: string;
    }
): Promise<{ totpSecret: string; jwtSecret: string }> {
    try {
        // First, initialize database schema
        await initializeDatabaseWithMigrations(db);
        
        // Initialize site configuration
        await initializeDefaultConfig(db);
        
        // Generate or use provided secrets
        const totpSecret = config.totpSecret || generateSecretKey();
        const jwtSecret = config.jwtSecret || generateSecretKey();
        
        // Initialize secrets
        await initializeSecrets(db, totpSecret, jwtSecret);
        
        // Set custom site title if provided
        if (config.siteTitle) {
            const { upsertSiteConfig } = await import('./config');
            await upsertSiteConfig(db, 'site_title', config.siteTitle, '网站标题（浏览器标签页显示）');
        }
        
        // Initialize default external storage source if asset URL provided
        if (config.assetUrl) {
            const cleanAssetUrl = config.assetUrl.replace(/\/$/, '');
            const defaultSourceUuid = crypto.randomUUID();
            
            await db.insert(externalSource).values({
                uuid: defaultSourceUuid,
                type: 'raw_url',
                name: 'Default Asset Storage',
                endpoint: `${cleanAssetUrl}/{FILE_ID}`,
            });
        }
        
        return { totpSecret, jwtSecret };
    } catch (error) {
        console.error('Error initializing database with config:', error);
        throw error;
    }
}

/**
 * Initialize database using Drizzle migrations
 */
export async function initializeDatabaseWithMigrations(db: DrizzleDB): Promise<void> {
    try {
        // Read migration file content
        const migrationPath = './migrations/0000_database_init.sql';
        
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
        // Fallback to simplified initialization if migration fails
        await initializeDatabase(db);
    }
}

/**
 * Initialize database using modern Drizzle approach
 * Note: In production, tables should be created via migrations or dashboard
 */
export async function initializeDatabase(db: DrizzleDB): Promise<void> {
    console.log('Database initialization should be handled via:');
    console.log('1. Drizzle migrations: npm run db:generate && npm run db:push');
    console.log('2. Cloudflare dashboard SQL editor');
    console.log('3. Manual SQL execution from schema.ts definitions');
    
    // For development, you can use the helper functions
    const { ensureTablesExist } = await import('../migrations/helper');
    await ensureTablesExist(db);
}

