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
import { updateWikiPlatform } from '../db/operations/wiki-platforms';
import { updateFooterSetting } from '../db/operations/admin';
import { upsertSiteConfig } from '../db/operations/config';
import { validateStorageSource } from '../db/utils/storage-handlers';
import type { Work, WorkTitle, CreatorWithRole, WikiRef, Asset, WorkTitleUpdate, MediaSourceForDatabase, MediaSourceApiInput, ExternalSourceApiInput, ExternalObjectApiInput, WikiPlatformApiInput } from '../db/types';
import { workUuidToId, externalSourceUuidToId } from '../db/utils/uuid-id-converter';
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
    creator: async (DB: any, body: any) => {
        const db = createDrizzleClient(DB);

        // 支持扁平化表单数据
        const creatorUuid = body.uuid || body.creator_uuid;
        const full_creator = {
            uuid: creatorUuid,
            name: body.name || body.creator?.name,
            type: body.type || body.creator?.type
        };

        // 转换 wikis 数组
        const wikis = [];
        if (body.wiki_platform && Array.isArray(body.wiki_platform)) {
            for (let i = 0; i < body.wiki_platform.length; i++) {
                if (body.wiki_platform[i] && body.wiki_id?.[i]) {
                    wikis.push({
                        platform: body.wiki_platform[i],
                        identifier: body.wiki_id[i]
                    });
                }
            }
        }

        return await updateCreator(db, creatorUuid, full_creator, wikis.length > 0 ? wikis : body.wikis);
    },
    work: async (DB: any, body: any) => {
        const db = createDrizzleClient(DB);

        // 转换扁平化表单数据为 API 格式
        const work = {
            uuid: body.uuid,
            copyright_basis: body.copyright_basis || 'unknown',
            publish_date: body.publish_date || null
        };

        // 转换 titles 数组
        const titles = [];
        if (body.title_text && Array.isArray(body.title_text)) {
            for (let i = 0; i < body.title_text.length; i++) {
                if (body.title_text[i]) {
                    titles.push({
                        title: body.title_text[i],
                        language: body.title_lang?.[i] || 'ja',
                        is_official: body.title_is_official?.[i] === 'on' || false,
                        is_for_search: body.title_is_for_search?.[i] === 'on' || false
                    });
                }
            }
        }

        // 转换 creators 数组
        const creators = [];
        if (body.creator_uuid && Array.isArray(body.creator_uuid)) {
            for (let i = 0; i < body.creator_uuid.length; i++) {
                if (body.creator_uuid[i]) {
                    creators.push({
                        creator_uuid: body.creator_uuid[i],
                        role: body.creator_role?.[i] || ''
                    });
                }
            }
        }

        // 转换 wikis 数组
        const wikis = [];
        if (body.wiki_platform && Array.isArray(body.wiki_platform)) {
            for (let i = 0; i < body.wiki_platform.length; i++) {
                if (body.wiki_platform[i] && body.wiki_id?.[i]) {
                    wikis.push({
                        platform: body.wiki_platform[i],
                        identifier: body.wiki_id[i]
                    });
                }
            }
        }

        return await updateWork(
            db,
            body.uuid,
            work,
            titles,
            body.license || null,
            creators.length > 0 ? creators : undefined,
            wikis.length > 0 ? wikis : undefined
        );
    },
    asset: async (DB: any, body: any) => {
        const db = createDrizzleClient(DB);

        // 支持扁平化表单数据
        const assetUuid = body.uuid || body.asset_uuid;
        const assetForDb = {
            uuid: assetUuid,
            asset_type: body.asset_type || body.asset?.asset_type,
            work_uuid: body.work_uuid || body.asset?.work_uuid,
            language: body.language || body.asset?.language || null,
            is_previewpic: body.is_previewpic === 'on' || body.is_previewpic === true || body.asset?.is_previewpic || null,
            content: body.content || body.asset?.content || ''
        };

        // 转换 creators 数组
        let creators = body.creator;
        if (Array.isArray(body.creator_uuid)) {
            creators = [];
            for (let i = 0; i < body.creator_uuid.length; i++) {
                if (body.creator_uuid[i]) {
                    creators.push({
                        creator_uuid: body.creator_uuid[i],
                        role: body.creator_role?.[i] || ''
                    });
                }
            }
        }

        // 转换 external_objects 数组（过滤空值）
        let externalObjects = body.external_objects;
        if (Array.isArray(body.external_object_uuid)) {
            externalObjects = body.external_object_uuid.filter((uuid: string) => uuid && uuid.trim() !== '');
        } else if (Array.isArray(externalObjects)) {
            externalObjects = externalObjects.filter((uuid: string) => uuid && uuid.trim() !== '');
        } else {
            externalObjects = undefined;
        }

        return await updateAsset(db, assetUuid, assetForDb as any, creators, externalObjects);
    },
    relation: async (DB: any, body: any) => {
        const db = createDrizzleClient(DB);

        // 支持扁平化表单数据
        const relationUuid = body.uuid || body.relation_uuid;
        const relationData = {
            relation_uuid: relationUuid,
            from_work_uuid: body.from_work_uuid,
            to_work_uuid: body.to_work_uuid,
            relation_type: body.relation_type
        };

        return await updateRelation(db, relationUuid, relationData);
    },
    media: async (DB: any, body: any) => {
        const db = createDrizzleClient(DB);

        // 支持扁平化表单数据
        const mediaUuid = body.uuid || body.media_uuid;
        const full_media_source: MediaSourceApiInput = {
            uuid: mediaUuid,
            work_uuid: body.work_uuid,
            is_music: body.is_music === 'on' || body.is_music === true || body.is_music === 'true',
            file_name: body.file_name || '',
            url: body.url || '',
            mime_type: body.mime_type || '',
            info: body.info || ''
        };

        // 转换 external_objects 数组（过滤空值）
        let externalObjects = body.external_objects;
        if (Array.isArray(body.external_object_uuid)) {
            externalObjects = body.external_object_uuid.filter((uuid: string) => uuid && uuid.trim() !== '');
        } else if (Array.isArray(externalObjects)) {
            externalObjects = externalObjects.filter((uuid: string) => uuid && uuid.trim() !== '');
        } else {
            externalObjects = undefined;
        }

        return await updateMedia(db, mediaUuid, full_media_source, externalObjects);
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
    'external_source': async (DB: any, body: ExternalSourceApiInput) => {
        console.log('Received external_source update body:', JSON.stringify(body, null, 2));

        // 验证存储源配置
        const validation = validateStorageSource(body);

        if (!validation.valid) {
            console.error('Storage source validation failed:', validation.error);
            console.error('Received body:', body);
            throw new Error(validation.error);
        }

        const db = createDrizzleClient(DB);
        const sourceData = {
            type: body.type,
            name: body.name,
            endpoint: body.endpoint,
            isIPFS: body.isIPFS
        };
        return await updateExternalSource(db, body.uuid, sourceData);
    },
    'external_object': async (DB: any, body: ExternalObjectApiInput) => {
        const db = createDrizzleClient(DB);

        const objectData = {
            external_source_uuid: body.external_source_uuid,
            mime_type: body.mime_type,
            file_id: body.file_id
        };
        return await updateExternalObject(db, body.uuid, objectData);
    },
    wiki_platform: async (DB: any, body: WikiPlatformApiInput & { platform_key: string }) => {
        const db = createDrizzleClient(DB);
        return await updateWikiPlatform(db, body.platform_key, body);
    },
    footer: async (DB: any, body: { uuid: string; item_type: 'link' | 'social' | 'copyright'; text: string; url?: string; icon_class?: string }) => {
        const db = createDrizzleClient(DB);
        return await updateFooterSetting(db, {
            uuid: body.uuid,
            item_type: body.item_type,
            text: body.text,
            url: body.url,
            icon_class: body.icon_class
        });
    },
    site_config: async (DB: any, body: { key: string; value: string; description?: string }) => {
        const db = createDrizzleClient(DB);
        await upsertSiteConfig(db, body.key, body.value, body.description);
        return true; // upsertSiteConfig doesn't return a value, so we return true to indicate success
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
