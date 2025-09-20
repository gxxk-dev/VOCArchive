import { createDrizzleClient } from '../db/client';
import { updateWork } from '../db/operations/work';
import { updateAsset } from '../db/operations/asset';
import { updateCreator } from '../db/operations/creator';
import { updateMedia } from '../db/operations/media';
import { updateRelation } from '../db/operations/relation';
import { updateTag } from '../db/operations/tag';
import { updateCategory } from '../db/operations/category';
import { updateWorkTitle } from '../db/operations/work-title';
import { updateExternalSource } from '../db/operations/external_source';
import { updateExternalObject } from '../db/operations/external_object';
import { validateStorageSource } from '../db/utils/storage-handlers';
import type { Work, WorkTitle, CreatorWithRole, WikiRef, Asset } from '../db/operations/work';
import type { WorkTitleUpdate } from '../db/operations/work-title';
import { Hono } from 'hono'

// Request body interfaces
interface UpdateWorkRequestBody {
    work_uuid: string;
    work: Work;
    titles: WorkTitle[];
    license?: string;
    creator?: CreatorWithRole[];
    wikis?: WikiRef[];
}

interface UpdateCreatorRequestBody {
    creator_uuid: string;
    creator: { name: string; type: 'human' | 'virtual' };
    wikis?: WikiRef[];
}

interface UpdateAssetRequestBody {
    asset_uuid: string;
    asset: Asset;
    creator?: CreatorWithRole[];
    external_objects?: string[];
}

interface UpdateMediaRequestBody {
    media_uuid: string;
    work_uuid: string;
    is_music: boolean;
    file_name: string;
    url: string;
    mime_type: string;
    info: string;
    external_objects?: string[];
}

interface UpdateRelationRequestBody {
    relation_uuid: string;
    from_work_uuid: string;
    to_work_uuid: string;
    relation_type: 'original' | 'remix' | 'cover' | 'remake' | 'picture' | 'lyrics';
}

interface UpdateWorkTitleRequestBody {
    title_uuid: string;
    updates: WorkTitleUpdate;
}

const updateHandlers = {
    creator: async (DB: any, body: UpdateCreatorRequestBody) => {
        const db = createDrizzleClient(DB);
        const full_creator = {
            uuid: body.creator_uuid,
            name: body.creator.name,
            type: body.creator.type
        };
        return await updateCreator(db, body.creator_uuid, full_creator, body.wikis);
    },
    work: async (DB: any, body: UpdateWorkRequestBody) => {
        const db = createDrizzleClient(DB);
        return await updateWork(db, body.work_uuid, body.work, body.titles, body.license || null, body.creator, body.wikis);
    },
    asset: async (DB: any, body: UpdateAssetRequestBody) => {
        const db = createDrizzleClient(DB);
        const assetForDb = {
            ...body.asset,
            language: body.asset.language || null,
            is_previewpic: body.asset.is_previewpic ?? null,
        };
        return await updateAsset(db, body.asset_uuid, assetForDb as any, body.creator, body.external_objects);
    },
    relation: async (DB: any, body: UpdateRelationRequestBody) => {
        const db = createDrizzleClient(DB);
        return await updateRelation(db, body.relation_uuid, body);
    },
    media: async (DB: any, body: UpdateMediaRequestBody) => {
        const db = createDrizzleClient(DB);
        const full_media_source = {
            uuid: body.media_uuid,
            work_uuid: body.work_uuid,
            is_music: body.is_music,
            file_name: body.file_name,
            url: body.url,
            mime_type: body.mime_type,
            info: body.info
        };
        return await updateMedia(db, body.media_uuid, full_media_source, body.external_objects);
    },
    tag: async (DB: any, body: { tag_uuid: string; name: string }) => {
        const db = createDrizzleClient(DB);
        return await updateTag(db, body.tag_uuid, body.name);
    },
    category: async (DB: any, body: { category_uuid: string; name: string; parent_uuid?: string }) => {
        const db = createDrizzleClient(DB);
        return await updateCategory(db, body.category_uuid, body.name, body.parent_uuid);
    },
    'work-title': async (DB: any, body: UpdateWorkTitleRequestBody) => {
        const db = createDrizzleClient(DB);
        return await updateWorkTitle(db, body.title_uuid, body.updates);
    },
    'external_source': async (DB: any, body: { external_source_uuid: string; type: 'raw_url' | 'ipfs'; name: string; endpoint: string }) => {
        // 验证存储源配置
        const validation = validateStorageSource({
            uuid: body.external_source_uuid,
            type: body.type,
            name: body.name,
            endpoint: body.endpoint
        });
        
        if (!validation.valid) {
            throw new Error(validation.error);
        }
        
        const db = createDrizzleClient(DB);
        const sourceData = {
            type: body.type,
            name: body.name,
            endpoint: body.endpoint
        };
        return await updateExternalSource(db, body.external_source_uuid, sourceData);
    },
    'external_object': async (DB: any, body: { external_object_uuid: string; external_source_uuid: string; mime_type: string; file_id: string }) => {
        const db = createDrizzleClient(DB);
        const objectData = {
            external_source_uuid: body.external_source_uuid,
            mime_type: body.mime_type,
            file_id: body.file_id
        };
        return await updateExternalObject(db, body.external_object_uuid, objectData);
    }
};

export const updateInfo = new Hono();

updateInfo.post('/:resType', async (c: any) => {
    const resType = c.req.param('resType');
    const handler = updateHandlers[resType as keyof typeof updateHandlers];
    
    if (!handler) {
        return c.json({ error: 'Invalid resource type' }, 400);
    }
    
    const body = await c.req.json();
    const updated = await handler(c.env.DB, body);
    
    if (!updated) {
        const resourceType = resType.charAt(0).toUpperCase() + resType.slice(1);
        return c.json({ error: `${resourceType} not found or update failed.` }, 404);
    }
    
    const resourceType = resType.charAt(0).toUpperCase() + resType.slice(1);
    return c.json({ message: `${resourceType} updated successfully.` }, 200);
});
