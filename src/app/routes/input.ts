import { createDrizzleClient } from '../db/client';
import { inputWork } from '../db/operations/work';
import { inputAsset } from '../db/operations/asset';
import { inputCreator } from '../db/operations/creator';
import { inputMedia } from '../db/operations/media';
import { inputRelation } from '../db/operations/relation';
import { inputTag, addWorkTags } from '../db/operations/tag';
import { inputCategory, addWorkCategories } from '../db/operations/category';
import { inputWorkTitle } from '../db/operations/work-title';
import { inputExternalSource } from '../db/operations/external_source';
import { inputExternalObject } from '../db/operations/external_object';
import { 
    initializeDatabaseWithMigrations, 
    migrateToExternalStorage, 
    validateMigration, 
    getMigrationStatus,
    repairCorruptedExternalObjects,
    type MigrationResult,
    type MigrationStatus
} from '../db/operations/admin';
import type { Work, WorkTitle, CreatorWithRole, WikiRef, Asset, MediaSource, WorkRelation, Tag, Category } from '../db/operations/work';
import type { WorkTitleInput } from '../db/operations/work-title';
import type { MediaSourceForDatabase, MediaSourceApiInput, ExternalSourceApiInput, ExternalObjectApiInput } from '../db/types';
import { workUuidToId, externalSourceUuidToId } from '../db/utils/uuid-id-converter';
import { validateStorageSource } from '../db/utils/storage-handlers';
import { Hono } from "hono";

// Request body interfaces
interface InputWorkRequestBody {
    work: Work;
    titles: WorkTitle[];
    license?: string;
    creator?: CreatorWithRole[];
    wikis?: WikiRef[];
}

interface InputCreatorRequestBody {
    creator: { uuid: string; name: string; type: 'human' | 'virtual' };
    wikis?: WikiRef[];
}

interface InputAssetRequestBody {
    asset: Asset;
    creator?: CreatorWithRole[];
    external_objects?: string[];
}

interface InputMediaRequestBody {
    uuid: string;
    work_uuid: string;
    is_music: boolean;
    file_name: string;
    url: string;
    mime_type: string;
    info: string;
    external_objects?: string[];
}

interface InputRelationRequestBody {
    uuid: string;
    from_work_uuid: string;
    to_work_uuid: string;
    relation_type: 'original' | 'remix' | 'cover' | 'remake' | 'picture' | 'lyrics';
}

export const inputInfo = new Hono();

// 添加作品
inputInfo.post('/work', async (c: any) => {
    try {
        const body: InputWorkRequestBody = await c.req.json();
        const db = createDrizzleClient(c.env.DB);
        await inputWork(db, body.work, body.titles || [], body.license || null, body.creator || [], body.wikis || []);
        return c.json({ message: "Work added successfully." }, 200);
    } catch (error) {
        return c.json({ error: 'Internal server error' }, 500);
    }
});

// 添加创作者
inputInfo.post('/creator', async (c: any) => {
    try {
        const body: InputCreatorRequestBody = await c.req.json();
        const db = createDrizzleClient(c.env.DB);
        await inputCreator(db, body.creator, body.wikis || []);
        return c.json({ message: "Creator added successfully." }, 200);
    } catch (error) {
        return c.json({ error: 'Internal server error' }, 500);
    }
});

// 添加资产
inputInfo.post('/asset', async (c: any) => {
    try {
        const body: InputAssetRequestBody = await c.req.json();
        const db = createDrizzleClient(c.env.DB);
        const assetForDb = {
            ...body.asset,
            language: body.asset.language || null,
            is_previewpic: body.asset.is_previewpic ?? null,
        };
        await inputAsset(db, assetForDb as any, body.creator || [], body.external_objects);
        return c.json({ message: "Asset added successfully." }, 200);
    } catch (error) {
        return c.json({ error: 'Internal server error' }, 500);
    }
});

// 添加关系
inputInfo.post('/relation', async (c: any) => {
    try {
        const body: InputRelationRequestBody = await c.req.json();
        const db = createDrizzleClient(c.env.DB);
        await inputRelation(db, body);
        return c.json({ message: "Work relation added successfully." }, 200);
    } catch (error) {
        return c.json({ error: 'Internal server error' }, 500);
    }
});

// 添加媒体
inputInfo.post('/media', async (c: any) => {
    try {
        const body: InputMediaRequestBody = await c.req.json();
        const db = createDrizzleClient(c.env.DB);
        
        // 构建 MediaSource 对象
        const mediaData: MediaSourceApiInput = {
            uuid: body.uuid,
            work_uuid: body.work_uuid, // Use work_uuid for API input
            is_music: body.is_music,
            file_name: body.file_name,
            url: body.url,
            mime_type: body.mime_type,
            info: body.info
        };
        
        await inputMedia(db, mediaData, body.external_objects);
        return c.json({ message: "Media source added successfully." }, 200);
    } catch (error) {
        return c.json({ error: 'Internal server error' }, 500);
    }
});

// 添加作品标题
inputInfo.post('/work-title', async (c: any) => {
    try {
        const body: WorkTitleInput = await c.req.json();
        const db = createDrizzleClient(c.env.DB);
        const title_uuid = await inputWorkTitle(db, body);
        
        if (!title_uuid) {
            return c.json({ error: 'Failed to create work title. Check if work exists.' }, 400);
        }
        
        return c.json({ message: "Work title added successfully.", uuid: title_uuid }, 200);
    } catch (error) {
        return c.json({ error: 'Internal server error' }, 500);
    }
});

// 添加标签
inputInfo.post('/tag', async (c: any) => {
    try {
        const body: { uuid: string; name: string } = await c.req.json();
        const db = createDrizzleClient(c.env.DB);
        await inputTag(db, body);
        return c.json({ message: "Tag added successfully." }, 200);
    } catch (error) {
        return c.json({ error: 'Internal server error' }, 500);
    }
});

// 添加分类
inputInfo.post('/category', async (c: any) => {
    try {
        const body: { uuid: string; name: string; parent_uuid?: string } = await c.req.json();
        const db = createDrizzleClient(c.env.DB);
        await inputCategory(db, body);
        return c.json({ message: "Category added successfully." }, 200);
    } catch (error) {
        return c.json({ error: 'Internal server error' }, 500);
    }
});

// 批量添加作品标签
inputInfo.post('/work-tags', async (c: any) => {
    try {
        const { work_uuid, tag_uuids } = await c.req.json();
        
        if (!work_uuid || !Array.isArray(tag_uuids)) {
            return c.json({ error: 'Invalid request body' }, 400);
        }
        
        const db = createDrizzleClient(c.env.DB);
        const success = await addWorkTags(db, work_uuid, tag_uuids);
        if (success) {
            return c.json({ message: 'Work tags added successfully.' });
        } else {
            return c.json({ error: 'Failed to add work tags' }, 500);
        }
    } catch (error) {
        return c.json({ error: 'Internal server error' }, 500);
    }
});

// 批量添加作品分类
inputInfo.post('/work-categories', async (c: any) => {
    try {
        const { work_uuid, category_uuids } = await c.req.json();
        
        if (!work_uuid || !Array.isArray(category_uuids)) {
            return c.json({ error: 'Invalid request body' }, 400);
        }
        
        const db = createDrizzleClient(c.env.DB);
        const success = await addWorkCategories(db, work_uuid, category_uuids);
        if (success) {
            return c.json({ message: 'Work categories added successfully.' });
        } else {
            return c.json({ error: 'Failed to add work categories' }, 500);
        }
    } catch (error) {
        return c.json({ error: 'Internal server error' }, 500);
    }
});

// 数据库初始化
inputInfo.post('/dbinit', async (c: any) => {
    try {
        const db = createDrizzleClient(c.env.DB);
        await initializeDatabaseWithMigrations(db);
        return c.json({ message: 'Database initialized successfully with Drizzle migrations' });
    } catch (error) {
        console.error('Database initialization error:', error);
        return c.json({ error: 'Failed to initialize database' }, 500);
    }
});

// 添加外部存储源
inputInfo.post('/external_source', async (c: any) => {
    try {
        const body: ExternalSourceApiInput = await c.req.json();
        
        // 验证存储源配置
        const validation = validateStorageSource(body);
        if (!validation.valid) {
            return c.json({ error: validation.error }, 400);
        }
        
        const db = createDrizzleClient(c.env.DB);
        await inputExternalSource(db, body);
        return c.json({ message: "External source added successfully." }, 200);
    } catch (error) {
        return c.json({ error: 'Internal server error' }, 500);
    }
});

// 添加外部对象
inputInfo.post('/external_object', async (c: any) => {
    try {
        const body: ExternalObjectApiInput = await c.req.json();
        const db = createDrizzleClient(c.env.DB);

        // 转换external_source_uuid为external_source_id
        const external_source_id = await externalSourceUuidToId(db, body.external_source_uuid);
        if (!external_source_id) {
            return c.json({ error: 'External source not found' }, 400);
        }

        // 构建数据库对象
        const objectData = {
            uuid: body.uuid,
            external_source_id: external_source_id,
            mime_type: body.mime_type,
            file_id: body.file_id
        };

        await inputExternalObject(db, objectData);
        return c.json({ message: "External object added successfully." }, 200);
    } catch (error) {
        return c.json({ error: 'Internal server error' }, 500);
    }
});

// 执行外部存储迁移
inputInfo.post('/migrate/external-storage', async (c: any) => {
    try {
        const body: { asset_url: string; batch_size?: number } = await c.req.json();
        
        if (!body.asset_url) {
            return c.json({ error: 'asset_url is required' }, 400);
        }
        
        const db = createDrizzleClient(c.env.DB);
        const batchSize = body.batch_size || 50;
        
        console.log(`Starting migration with ASSET_URL: ${body.asset_url}, batch size: ${batchSize}`);
        
        const result: MigrationResult = await migrateToExternalStorage(db, body.asset_url, batchSize);
        
        if (result.success) {
            return c.json({
                message: result.message,
                status: result.status
            }, 200);
        } else {
            return c.json({
                error: result.message,
                status: result.status
            }, 500);
        }
    } catch (error) {
        console.error('Migration endpoint error:', error);
        return c.json({ error: 'Internal server error during migration' }, 500);
    }
});

// 获取迁移状态
inputInfo.get('/migrate/status', async (c: any) => {
    try {
        const db = createDrizzleClient(c.env.DB);
        const status: MigrationStatus = await getMigrationStatus(db);
        
        return c.json({
            status,
            message: status.completed 
                ? 'Migration completed successfully' 
                : status.inProgress 
                    ? 'Migration in progress' 
                    : 'Migration not started or incomplete'
        }, 200);
    } catch (error) {
        console.error('Migration status endpoint error:', error);
        return c.json({ error: 'Internal server error' }, 500);
    }
});

// 验证迁移完整性
inputInfo.post('/migrate/validate', async (c: any) => {
    try {
        const db = createDrizzleClient(c.env.DB);
        const status: MigrationStatus = await validateMigration(db);
        
        return c.json({
            status,
            valid: status.completed && status.errors.length === 0,
            message: status.errors.length > 0 
                ? `Validation found ${status.errors.length} issues` 
                : 'Migration validation passed'
        }, 200);
    } catch (error) {
        console.error('Migration validation endpoint error:', error);
        return c.json({ error: 'Internal server error' }, 500);
    }
});

// 修复损坏的外部对象文件ID
inputInfo.post('/migrate/repair', async (c: any) => {
    try {
        const body = await c.req.json();
        if (!body.asset_url || typeof body.asset_url !== 'string') {
            return c.json({ error: 'asset_url is required' }, 400);
        }

        const db = createDrizzleClient(c.env.DB);
        const result = await repairCorruptedExternalObjects(db, body.asset_url);
        
        return c.json({
            success: result.errors.length === 0,
            repaired: result.repaired,
            errors: result.errors,
            message: result.errors.length === 0
                ? `Successfully repaired ${result.repaired} corrupted external objects`
                : `Repaired ${result.repaired} objects with ${result.errors.length} errors`
        }, 200);
    } catch (error) {
        console.error('Repair endpoint error:', error);
        return c.json({ error: 'Internal server error' }, 500);
    }
});

// 手动初始化站点配置
inputInfo.post('/config-init', async (c: any) => {
    try {
        const db = createDrizzleClient(c.env.DB);
        
        // 动态导入配置操作
        const { initializeDefaultConfig, initializeSecrets } = await import('../db/operations/config');
        
        // 初始化默认配置
        await initializeDefaultConfig(db);
        
        // 初始化密钥（从环境变量迁移）
        await initializeSecrets(db, c.env.TOTP_SECRET, c.env.JWT_SECRET);
        
        return c.json({ 
            message: 'Site configuration initialized successfully',
            success: true 
        }, 200);
    } catch (error) {
        console.error('Config initialization error:', error);
        return c.json({ 
            error: 'Failed to initialize site configuration',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, 500);
    }
});
