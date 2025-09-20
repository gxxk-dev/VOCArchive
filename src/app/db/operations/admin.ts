import { eq, isNull, and } from 'drizzle-orm';
import type { DrizzleDB } from '../client';
import { 
    footerSettings, 
    creator, work, workTitle, asset, mediaSource, workCreator, workRelation, 
    tag, category, workTag, workCategory,
    externalSource, externalObject, assetExternalObject, mediaSourceExternalObject,
    siteConfig
} from '../schema';
import { initializeDefaultConfig, initializeSecrets } from './config';

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
        // Ensure database tables exist before migration
        console.log('Ensuring database tables exist...');
        await ensureExternalStorageTables(db);
        
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
        // Count total assets and media sources
        const allAssets = await db.select({ uuid: asset.uuid }).from(asset);
        const allMediaSources = await db.select({ uuid: mediaSource.uuid }).from(mediaSource);
        
        status.totalAssets = allAssets.length;
        status.totalMediaSources = allMediaSources.length;

        // Count migrated assets (those with external object associations)
        const migratedAssets = await db.select({ asset_uuid: assetExternalObject.asset_uuid })
            .from(assetExternalObject);
        
        // Count migrated media sources (those with external object associations)
        const migratedMediaSources = await db.select({ media_source_uuid: mediaSourceExternalObject.media_source_uuid })
            .from(mediaSourceExternalObject);

        status.migratedAssets = migratedAssets.length;
        status.migratedMediaSources = migratedMediaSources.length;

        // Check for orphaned external objects  
        const orphanedExternalObjects = await db.select({ uuid: externalObject.uuid })
            .from(externalObject)
            .leftJoin(assetExternalObject, eq(externalObject.uuid, assetExternalObject.external_object_uuid))
            .leftJoin(mediaSourceExternalObject, eq(externalObject.uuid, mediaSourceExternalObject.external_object_uuid))
            .where(
                // Both joins should be null (not associated with any asset or media source)
                and(
                    isNull(assetExternalObject.external_object_uuid),
                    isNull(mediaSourceExternalObject.external_object_uuid)
                )
            );

        if (orphanedExternalObjects.length > 0) {
            status.errors.push(`Found ${orphanedExternalObjects.length} orphaned external objects`);
        }

        // Check for missing default source
        const defaultSource = await db.select()
            .from(externalSource)
            .where(eq(externalSource.name, 'Default Asset Storage'))
            .limit(1);

        if (defaultSource.length === 0) {
            status.errors.push('Default Asset Storage source not found');
        } else {
            status.defaultSourceUuid = defaultSource[0].uuid;
        }

        // Check for broken external object references
        const brokenExternalObjects = await db.select({
            uuid: externalObject.uuid,
            external_source_uuid: externalObject.external_source_uuid
        })
        .from(externalObject)
        .leftJoin(externalSource, eq(externalObject.external_source_uuid, externalSource.uuid))
        .where(isNull(externalSource.uuid));

        if (brokenExternalObjects.length > 0) {
            status.errors.push(`Found ${brokenExternalObjects.length} external objects with missing source references`);
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
        // Quick count without detailed validation
        const assetCount = await db.select({ count: asset.uuid }).from(asset);
        const mediaCount = await db.select({ count: mediaSource.uuid }).from(mediaSource);
        const migratedAssetCount = await db.select({ count: assetExternalObject.asset_uuid }).from(assetExternalObject);
        const migratedMediaCount = await db.select({ count: mediaSourceExternalObject.media_source_uuid }).from(mediaSourceExternalObject);

        status.totalAssets = assetCount.length;
        status.totalMediaSources = mediaCount.length;
        status.migratedAssets = migratedAssetCount.length;
        status.migratedMediaSources = migratedMediaCount.length;

        // Check for default source
        const defaultSource = await db.select()
            .from(externalSource)
            .where(eq(externalSource.name, 'Default Asset Storage'))
            .limit(1);

        if (defaultSource.length > 0) {
            status.defaultSourceUuid = defaultSource[0].uuid;
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
        assetExternalObject,        // Junction table (new)
        mediaSourceExternalObject, // Junction table (new)
        asset,
        mediaSource,
        workLicense,
        workTitle,
        workCreator,
        creatorWiki,
        externalObject,             // External object table (new)
        externalSource,             // External source table (new)
        creator,
        work,
        category,
        tag,
        footerSettings
    } = await import('../schema');

    // Define drop order to respect foreign key constraints
    const tablesToDrop = [
        // Junction tables first (no dependencies)
        workCategory,            // Junction table first
        workTag,                 // Junction table first
        assetExternalObject,     // Junction table (new)
        mediaSourceExternalObject, // Junction table (new)
        
        // Tables with foreign keys
        workWiki,                // Foreign key to work
        workRelation,            // Foreign key to work
        assetCreator,            // Junction table for asset
        asset,                   // Foreign key to work
        mediaSource,             // Foreign key to work
        workLicense,             // Foreign key to work
        workTitle,               // Foreign key to work
        workCreator,             // Foreign key to work and creator
        creatorWiki,             // Foreign key to creator
        externalObject,          // Foreign key to external_source (new)
        
        // Referenced tables
        externalSource,          // Referenced by external_object (new)
        creator,                 // Referenced by multiple tables
        work,                    // Referenced by multiple tables
        category,                // Self-referencing and work-referenced
        tag,                     // Referenced by work_tag
        footerSettings           // Independent table
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
        
        // Export new external storage tables
        exportData.external_source = await db.select().from(externalSource);
        exportData.external_object = await db.select().from(externalObject);
        exportData.asset_external_object = await db.select().from(assetExternalObject);
        exportData.media_source_external_object = await db.select().from(mediaSourceExternalObject);

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
        
        `CREATE TABLE work_title (
            uuid TEXT PRIMARY KEY,
            work_uuid TEXT NOT NULL REFERENCES work(uuid) ON DELETE CASCADE,
            is_official INTEGER NOT NULL,
            is_for_search INTEGER NOT NULL DEFAULT false,
            language TEXT NOT NULL,
            title TEXT NOT NULL
        )`,
        
        `CREATE TABLE asset (
            uuid TEXT PRIMARY KEY,
            file_id TEXT NOT NULL,
            work_uuid TEXT NOT NULL REFERENCES work(uuid) ON DELETE CASCADE,
            asset_type TEXT NOT NULL,
            file_name TEXT NOT NULL,
            is_previewpic INTEGER,
            language TEXT
        )`,
        
        `CREATE TABLE media_source (
            uuid TEXT PRIMARY KEY,
            work_uuid TEXT NOT NULL REFERENCES work(uuid) ON DELETE CASCADE,
            is_music INTEGER NOT NULL,
            file_name TEXT NOT NULL,
            url TEXT NOT NULL,
            mime_type TEXT NOT NULL,
            info TEXT NOT NULL
        )`,
        
        `CREATE TABLE tag (
            uuid TEXT PRIMARY KEY,
            name TEXT NOT NULL UNIQUE
        )`,
        
        `CREATE TABLE category (
            uuid TEXT PRIMARY KEY,
            name TEXT NOT NULL UNIQUE,
            parent_uuid TEXT
        )`,
        
        `CREATE TABLE work_tag (
            work_uuid TEXT NOT NULL REFERENCES work(uuid) ON DELETE CASCADE,
            tag_uuid TEXT NOT NULL REFERENCES tag(uuid) ON DELETE CASCADE,
            PRIMARY KEY (work_uuid, tag_uuid)
        )`,
        
        `CREATE TABLE work_category (
            work_uuid TEXT NOT NULL REFERENCES work(uuid) ON DELETE CASCADE,
            category_uuid TEXT NOT NULL REFERENCES category(uuid) ON DELETE CASCADE,
            PRIMARY KEY (work_uuid, category_uuid)
        )`,
        
        `CREATE TABLE footer_settings (
            uuid TEXT PRIMARY KEY,
            item_type TEXT NOT NULL CHECK(item_type IN ('link', 'social', 'copyright')),
            text TEXT NOT NULL,
            url TEXT,
            icon_class TEXT
        )`,
        
        `CREATE TABLE site_config (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL,
            description TEXT
        )`,
        
        // External storage tables
        `CREATE TABLE external_source (
            uuid TEXT PRIMARY KEY,
            type TEXT NOT NULL CHECK(type IN ('raw_url', 'ipfs')),
            name TEXT NOT NULL,
            endpoint TEXT NOT NULL
        )`,
        
        `CREATE TABLE external_object (
            uuid TEXT PRIMARY KEY,
            external_source_uuid TEXT NOT NULL REFERENCES external_source(uuid) ON DELETE CASCADE,
            mime_type TEXT NOT NULL,
            file_id TEXT NOT NULL
        )`,
        
        `CREATE TABLE asset_external_object (
            asset_uuid TEXT NOT NULL REFERENCES asset(uuid) ON DELETE CASCADE,
            external_object_uuid TEXT NOT NULL REFERENCES external_object(uuid) ON DELETE CASCADE,
            PRIMARY KEY (asset_uuid, external_object_uuid)
        )`,
        
        `CREATE TABLE media_source_external_object (
            media_source_uuid TEXT NOT NULL REFERENCES media_source(uuid) ON DELETE CASCADE,
            external_object_uuid TEXT NOT NULL REFERENCES external_object(uuid) ON DELETE CASCADE,
            PRIMARY KEY (media_source_uuid, external_object_uuid)
        )`,
    ];
    
    for (const statement of statements) {
        try {
            await db.run(statement);
        } catch (error) {
            console.warn(`Warning creating table: ${error}`);
        }
    }
}

/**
 * Ensure external storage tables exist before migration
 */
async function ensureExternalStorageTables(db: DrizzleDB): Promise<void> {
    const externalStorageTables = [
        // External storage tables
        `CREATE TABLE IF NOT EXISTS external_source (
            uuid TEXT PRIMARY KEY,
            type TEXT NOT NULL CHECK(type IN ('raw_url', 'ipfs')),
            name TEXT NOT NULL,
            endpoint TEXT NOT NULL
        )`,
        
        `CREATE TABLE IF NOT EXISTS external_object (
            uuid TEXT PRIMARY KEY,
            external_source_uuid TEXT NOT NULL REFERENCES external_source(uuid) ON DELETE CASCADE,
            mime_type TEXT NOT NULL,
            file_id TEXT NOT NULL
        )`,
        
        `CREATE TABLE IF NOT EXISTS asset_external_object (
            asset_uuid TEXT NOT NULL REFERENCES asset(uuid) ON DELETE CASCADE,
            external_object_uuid TEXT NOT NULL REFERENCES external_object(uuid) ON DELETE CASCADE,
            PRIMARY KEY (asset_uuid, external_object_uuid)
        )`,
        
        `CREATE TABLE IF NOT EXISTS media_source_external_object (
            media_source_uuid TEXT NOT NULL REFERENCES media_source(uuid) ON DELETE CASCADE,
            external_object_uuid TEXT NOT NULL REFERENCES external_object(uuid) ON DELETE CASCADE,
            PRIMARY KEY (media_source_uuid, external_object_uuid)
        )`,
    ];
    
    for (const statement of externalStorageTables) {
        try {
            await db.run(statement);
            console.log('Created/verified table:', statement.match(/CREATE TABLE IF NOT EXISTS (\w+)/)?.[1]);
        } catch (error) {
            console.warn(`Warning creating external storage table: ${error}`);
        }
    }
}