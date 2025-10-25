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
import { insertWikiPlatform } from '../db/operations/wiki-platforms';
import {
    initializeDatabaseWithMigrations,
    migrateToExternalStorage,
    validateMigration,
    getMigrationStatus,
    repairCorruptedExternalObjects,
    type MigrationResult,
    type MigrationStatus
} from '../db/operations/admin';
import type { Work, WorkTitle, CreatorWithRole, WikiRef, Asset, MediaSource, WorkRelation, Tag, Category, WorkTitleInput, MediaSourceForDatabase, MediaSourceApiInput, ExternalSourceApiInput, ExternalObjectApiInput, WikiPlatformApiInput } from '../db/types';
import { workIndexToId, externalSourceIndexToId } from '../db/utils/index-id-converter';
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
    creator: { index: string; name: string; type: 'human' | 'virtual' };
    wikis?: WikiRef[];
}

interface InputAssetRequestBody {
    asset: Asset;
    creator?: CreatorWithRole[];
    external_objects?: string[];
}

interface InputMediaRequestBody {
    index: string;
    work_index: string;
    is_music: boolean;
    file_name: string;
    url: string;
    mime_type: string;
    info: string;
    external_objects?: string[];
}

interface InputRelationRequestBody {
    index: string;
    from_work_index: string;
    to_work_index: string;
    relation_type: 'original' | 'remix' | 'cover' | 'remake' | 'picture' | 'lyrics';
}

export const inputInfo = new Hono();

// �����Ʒ
inputInfo.post('/work', async (c: any) => {
    try {
        const body: InputWorkRequestBody = await c.req.json();
        const db = c.get('db');
        await inputWork(db, body.work, body.titles || [], body.license || null, body.creator || [], body.wikis || []);
        return c.json({ message: "Work added successfully." }, 200);
    } catch (error) {
        return c.json({ error: 'Internal server error' }, 500);
    }
});

// ��Ӵ�����
inputInfo.post('/creator', async (c: any) => {
    try {
        const body: InputCreatorRequestBody = await c.req.json();
        const db = c.get('db');
        await inputCreator(db, body.creator, body.wikis || []);
        return c.json({ message: "Creator added successfully." }, 200);
    } catch (error) {
        return c.json({ error: 'Internal server error' }, 500);
    }
});

// ����ʲ�
inputInfo.post('/asset', async (c: any) => {
    try {
        const body: InputAssetRequestBody = await c.req.json();
        const db = c.get('db');
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

// ��ӹ�ϵ
inputInfo.post('/relation', async (c: any) => {
    try {
        const body: InputRelationRequestBody = await c.req.json();
        const db = c.get('db');
        await inputRelation(db, body);
        return c.json({ message: "Work relation added successfully." }, 200);
    } catch (error) {
        return c.json({ error: 'Internal server error' }, 500);
    }
});

// ���ý��
inputInfo.post('/media', async (c: any) => {
    try {
        const body: InputMediaRequestBody = await c.req.json();
        const db = c.get('db');
        
        // ���� MediaSource ����
        const mediaData: MediaSourceApiInput = {
            index: body.index,
            work_index: body.work_index, // Use work_index for API input
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

// �����Ʒ����
inputInfo.post('/work-title', async (c: any) => {
    try {
        const body: WorkTitleInput = await c.req.json();
        const db = c.get('db');
        const title_index = await inputWorkTitle(db, body);
        
        if (!title_index) {
            return c.json({ error: 'Failed to create work title. Check if work exists.' }, 400);
        }
        
        return c.json({ message: "Work title added successfully.", index: title_index }, 200);
    } catch (error) {
        return c.json({ error: 'Internal server error' }, 500);
    }
});

// ��ӱ�ǩ
inputInfo.post('/tag', async (c: any) => {
    try {
        const body: { index: string; name: string } = await c.req.json();
        const db = c.get('db');
        await inputTag(db, body);
        return c.json({ message: "Tag added successfully." }, 200);
    } catch (error) {
        return c.json({ error: 'Internal server error' }, 500);
    }
});

// ��ӷ���
inputInfo.post('/category', async (c: any) => {
    try {
        const body: { index: string; name: string; parent_index?: string } = await c.req.json();
        const db = c.get('db');
        await inputCategory(db, body);
        return c.json({ message: "Category added successfully." }, 200);
    } catch (error) {
        return c.json({ error: 'Internal server error' }, 500);
    }
});

// ���������Ʒ��ǩ
inputInfo.post('/work-tags', async (c: any) => {
    try {
        const { work_index, tag_indexs } = await c.req.json();
        
        if (!work_index || !Array.isArray(tag_indexs)) {
            return c.json({ error: 'Invalid request body' }, 400);
        }
        
        const db = c.get('db');
        const success = await addWorkTags(db, work_index, tag_indexs);
        if (success) {
            return c.json({ message: 'Work tags added successfully.' });
        } else {
            return c.json({ error: 'Failed to add work tags' }, 500);
        }
    } catch (error) {
        return c.json({ error: 'Internal server error' }, 500);
    }
});

// ���������Ʒ����
inputInfo.post('/work-categories', async (c: any) => {
    try {
        const { work_index, category_indexs } = await c.req.json();
        
        if (!work_index || !Array.isArray(category_indexs)) {
            return c.json({ error: 'Invalid request body' }, 400);
        }
        
        const db = c.get('db');
        const success = await addWorkCategories(db, work_index, category_indexs);
        if (success) {
            return c.json({ message: 'Work categories added successfully.' });
        } else {
            return c.json({ error: 'Failed to add work categories' }, 500);
        }
    } catch (error) {
        return c.json({ error: 'Internal server error' }, 500);
    }
});

// ���ݿ��ʼ��
inputInfo.post('/dbinit', async (c: any) => {
    try {
        const db = c.get('db');
        await initializeDatabaseWithMigrations(db);
        return c.json({ message: 'Database initialized successfully with Drizzle migrations' });
    } catch (error) {
        console.error('Database initialization error:', error);
        return c.json({ error: 'Failed to initialize database' }, 500);
    }
});

// ����ⲿ�洢Դ
inputInfo.post('/external_source', async (c: any) => {
    try {
        const body: ExternalSourceApiInput = await c.req.json();
        
        // ��֤�洢Դ����
        const validation = validateStorageSource(body);
        if (!validation.valid) {
            return c.json({ error: validation.error }, 400);
        }
        
        const db = c.get('db');
        await inputExternalSource(db, body);
        return c.json({ message: "External source added successfully." }, 200);
    } catch (error) {
        return c.json({ error: 'Internal server error' }, 500);
    }
});

// ����ⲿ����
inputInfo.post('/external_object', async (c: any) => {
    try {
        const body: ExternalObjectApiInput = await c.req.json();
        const db = c.get('db');

        // ת��external_source_indexΪexternal_source_id
        const external_source_id = await externalSourceIndexToId(db, body.external_source_index);
        if (!external_source_id) {
            return c.json({ error: 'External source not found' }, 400);
        }

        // �������ݿ����
        const objectData = {
            index: body.index,
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

// ִ���ⲿ�洢Ǩ��
inputInfo.post('/migrate/external-storage', async (c: any) => {
    try {
        const body: { asset_url: string; batch_size?: number } = await c.req.json();
        
        if (!body.asset_url) {
            return c.json({ error: 'asset_url is required' }, 400);
        }
        
        const db = c.get('db');
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

// ��ȡǨ��״̬
inputInfo.get('/migrate/status', async (c: any) => {
    try {
        const db = c.get('db');
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

// ��֤Ǩ��������
inputInfo.post('/migrate/validate', async (c: any) => {
    try {
        const db = c.get('db');
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

// �޸��𻵵��ⲿ�����ļ�ID
inputInfo.post('/migrate/repair', async (c: any) => {
    try {
        const body = await c.req.json();
        if (!body.asset_url || typeof body.asset_url !== 'string') {
            return c.json({ error: 'asset_url is required' }, 400);
        }

        const db = c.get('db');
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

// �ֶ���ʼ��վ������
inputInfo.post('/config-init', async (c: any) => {
    try {
        const db = c.get('db');
        
        // ��̬�������ò���
        const { initializeDefaultConfig, initializeSecrets } = await import('../db/operations/config');
        
        // ��ʼ��Ĭ������
        await initializeDefaultConfig(db);
        
        // ��ʼ����Կ���ӻ�������Ǩ�ƣ�
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

// ����Wikiƽ̨
inputInfo.post('/wiki_platform', async (c: any) => {
    try {
        const body: WikiPlatformApiInput = await c.req.json();

        // ��֤�����ֶ�
        if (!body.platform_key || !body.platform_name || !body.url_template) {
            return c.json({
                error: 'Missing required fields: platform_key, platform_name, url_template'
            }, 400);
        }

        const db = c.get('db');
        await insertWikiPlatform(db, body);

        return c.json({
            message: 'Wiki platform created successfully',
            platform_key: body.platform_key
        }, 201);
    } catch (error) {
        console.error('Wiki platform creation error:', error);
        if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
            return c.json({
                error: 'Platform key already exists',
                message: 'A platform with this key already exists'
            }, 409);
        }
        return c.json({
            error: 'Failed to create wiki platform',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, 500);
    }
});
