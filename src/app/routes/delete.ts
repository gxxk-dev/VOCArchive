﻿import { createDrizzleClient } from '../db/client';
import { deleteWork, deleteAsset } from '../db/operations/work';
import { deleteCreator, deleteWorksByCreator } from '../db/operations/creator';
import { deleteMedia } from '../db/operations/media';
import { deleteRelation } from '../db/operations/relation';
import { deleteTag, removeWorkTags, removeAllWorkTags } from '../db/operations/tag';
import { deleteCategory, removeWorkCategories, removeAllWorkCategories } from '../db/operations/category';
import { deleteWorkTitle } from '../db/operations/work-title';
import { deleteExternalSource } from '../db/operations/external_source';
import { deleteExternalObject } from '../db/operations/external_object';
import { deleteWikiPlatform } from '../db/operations/wiki-platforms';
import { clearUserDataTables } from '../db/operations/admin';
import { Hono } from "hono";

// Request body interfaces
interface DeleteCreatorRequestBody {
    creator_index: string;
}

interface DeleteWorkRequestBody {
    work_index: string;
}

interface DeleteAssetRequestBody {
    asset_index: string;
}

interface DeleteRelationRequestBody {
    relation_index: string;
}

interface DeleteMediaRequestBody {
    media_index: string;
}

interface DeleteWorkTitleRequestBody {
    title_index: string;
}

export const deleteInfo = new Hono();

// 删除创作者
deleteInfo.post('/creator', async (c: any) => {
    try {
        const body: DeleteCreatorRequestBody = await c.req.json();
        const db = createDrizzleClient(c.env.DB);
        const result = await deleteCreator(db, body.creator_index);
        
        if (!result) {
            return c.json({ error: 'Creator not found or delete failed.' }, 404);
        }
        
        return c.json({ message: 'Creator deleted successfully.' }, 200);
    } catch (error) {
        return c.json({ error: 'Internal server error' }, 500);
    }
});

// 删除作品
deleteInfo.post('/work', async (c: any) => {
    try {
        const body: DeleteWorkRequestBody = await c.req.json();
        const db = createDrizzleClient(c.env.DB);
        const result = await deleteWork(db, body.work_index);
        
        if (!result) {
            return c.json({ error: 'Work not found or delete failed.' }, 404);
        }
        
        return c.json({ message: 'Work deleted successfully.' }, 200);
    } catch (error) {
        return c.json({ error: 'Internal server error' }, 500);
    }
});

// 删除资产
deleteInfo.post('/asset', async (c: any) => {
    try {
        const body: DeleteAssetRequestBody = await c.req.json();
        const db = createDrizzleClient(c.env.DB);
        const result = await deleteAsset(db, body.asset_index);
        
        if (!result) {
            return c.json({ error: 'Asset not found or delete failed.' }, 404);
        }
        
        return c.json({ message: 'Asset deleted successfully.' }, 200);
    } catch (error) {
        return c.json({ error: 'Internal server error' }, 500);
    }
});

// 删除关系
deleteInfo.post('/relation', async (c: any) => {
    try {
        const body: DeleteRelationRequestBody = await c.req.json();
        const db = createDrizzleClient(c.env.DB);
        const result = await deleteRelation(db, body.relation_index);
        
        if (!result) {
            return c.json({ error: 'Relation not found or delete failed.' }, 404);
        }
        
        return c.json({ message: 'Relation deleted successfully.' }, 200);
    } catch (error) {
        return c.json({ error: 'Internal server error' }, 500);
    }
});

// 删除媒体
deleteInfo.post('/media', async (c: any) => {
    try {
        const body: DeleteMediaRequestBody = await c.req.json();
        const db = createDrizzleClient(c.env.DB);
        const result = await deleteMedia(db, body.media_index);
        
        if (!result) {
            return c.json({ error: 'Media not found or delete failed.' }, 404);
        }
        
        return c.json({ message: 'Media deleted successfully.' }, 200);
    } catch (error) {
        return c.json({ error: 'Internal server error' }, 500);
    }
});

// 删除作品标题
deleteInfo.post('/work-title', async (c: any) => {
    try {
        const body: DeleteWorkTitleRequestBody = await c.req.json();
        const db = createDrizzleClient(c.env.DB);
        const result = await deleteWorkTitle(db, body.title_index);
        
        if (!result) {
            return c.json({ error: 'Work title not found or delete failed.' }, 404);
        }
        
        return c.json({ message: 'Work title deleted successfully.' }, 200);
    } catch (error) {
        return c.json({ error: 'Internal server error' }, 500);
    }
});

// 删除标签
deleteInfo.post('/tag', async (c: any) => {
    try {
        const body: { tag_index: string } = await c.req.json();
        const db = createDrizzleClient(c.env.DB);
        const result = await deleteTag(db, body.tag_index);
        
        if (!result) {
            return c.json({ error: 'Tag not found or delete failed.' }, 404);
        }
        
        return c.json({ message: 'Tag deleted successfully.' }, 200);
    } catch (error) {
        return c.json({ error: 'Internal server error' }, 500);
    }
});

// 删除分类
deleteInfo.post('/category', async (c: any) => {
    try {
        const body: { category_index: string } = await c.req.json();
        const db = createDrizzleClient(c.env.DB);
        const result = await deleteCategory(db, body.category_index);
        
        if (!result) {
            return c.json({ error: 'Category not found or delete failed.' }, 404);
        }
        
        return c.json({ message: 'Category deleted successfully.' }, 200);
    } catch (error) {
        return c.json({ error: 'Internal server error' }, 500);
    }
});

// 删除创作者的所有作品
deleteInfo.post('/worksbycreator', async (c: any) => {
    try {
        const body: DeleteCreatorRequestBody = await c.req.json();
        const db = createDrizzleClient(c.env.DB);
        const deletedCount = await deleteWorksByCreator(db, body.creator_index);
        
        return c.json({ message: `Successfully deleted ${deletedCount} work.` }, 200);
    } catch (error) {
        return c.json({ error: 'Internal server error' }, 500);
    }
});

// 清空数据库
deleteInfo.post('/dbclear', async (c: any) => {
    try {
        const db = createDrizzleClient(c.env.DB);
        await clearUserDataTables(db);
        return c.json({ message: "OK." }, 200);
    } catch (error) {
        return c.json({ error: 'Internal server error' }, 500);
    }
});

// 批量删除作品标签
deleteInfo.post('/work-tags', async (c: any) => {
    try {
        const { work_index, tag_indices } = await c.req.json();
        
        if (!work_index || !Array.isArray(tag_indices)) {
            return c.json({ error: 'Invalid request body' }, 400);
        }
        
        const db = createDrizzleClient(c.env.DB);
        const success = await removeWorkTags(db, work_index, tag_indices);
        if (success) {
            return c.json({ message: 'Work tags removed successfully.' });
        } else {
            return c.json({ error: 'Failed to remove work tags' }, 500);
        }
    } catch (error) {
        return c.json({ error: 'Internal server error' }, 500);
    }
});

// 批量删除作品分类
deleteInfo.post('/work-categories', async (c: any) => {
    try {
        const { work_index, category_indices } = await c.req.json();
        
        if (!work_index || !Array.isArray(category_indices)) {
            return c.json({ error: 'Invalid request body' }, 400);
        }
        
        const db = createDrizzleClient(c.env.DB);
        const success = await removeWorkCategories(db, work_index, category_indices);
        if (success) {
            return c.json({ message: 'Work categories removed successfully.' });
        } else {
            return c.json({ error: 'Failed to remove work categories' }, 500);
        }
    } catch (error) {
        return c.json({ error: 'Internal server error' }, 500);
    }
});

// 删除作品的所有标签
deleteInfo.post('/work-tags-all', async (c: any) => {
    try {
        const { work_index } = await c.req.json();

        if (!work_index) {
            return c.json({ error: 'Invalid request body: work_index required' }, 400);
        }

        const db = createDrizzleClient(c.env.DB);
        const success = await removeAllWorkTags(db, work_index);
        if (success) {
            return c.json({ message: 'All work tags removed successfully.' });
        } else {
            return c.json({ error: 'Failed to remove work tags' }, 500);
        }
    } catch (error) {
        return c.json({ error: 'Internal server error' }, 500);
    }
});

// 删除作品的所有分类
deleteInfo.post('/work-categories-all', async (c: any) => {
    try {
        const { work_index } = await c.req.json();

        if (!work_index) {
            return c.json({ error: 'Invalid request body: work_index required' }, 400);
        }

        const db = createDrizzleClient(c.env.DB);
        const success = await removeAllWorkCategories(db, work_index);
        if (success) {
            return c.json({ message: 'All work categories removed successfully.' });
        } else {
            return c.json({ error: 'Failed to remove work categories' }, 500);
        }
    } catch (error) {
        return c.json({ error: 'Internal server error' }, 500);
    }
});

// 删除外部存储源
deleteInfo.post('/external_source', async (c: any) => {
    try {
        const body: { external_source_index: string } = await c.req.json();
        const db = createDrizzleClient(c.env.DB);
        const result = await deleteExternalSource(db, body.external_source_index);
        
        if (!result) {
            return c.json({ error: 'External source not found or delete failed.' }, 404);
        }
        
        return c.json({ message: 'External source deleted successfully.' }, 200);
    } catch (error) {
        return c.json({ error: 'Internal server error' }, 500);
    }
});

// 删除外部对象
deleteInfo.post('/external_object', async (c: any) => {
    try {
        const body: { external_object_index: string } = await c.req.json();
        const db = createDrizzleClient(c.env.DB);
        const result = await deleteExternalObject(db, body.external_object_index);
        
        if (!result) {
            return c.json({ error: 'External object not found or delete failed.' }, 404);
        }
        
        return c.json({ message: 'External object deleted successfully.' }, 200);
    } catch (error) {
        return c.json({ error: 'Internal server error' }, 500);
    }
});

// 删除Wiki平台
deleteInfo.post('/wiki_platform', async (c: any) => {
    try {
        const body: { platform_key: string } = await c.req.json();

        if (!body.platform_key) {
            return c.json({ error: 'Missing platform_key' }, 400);
        }

        const db = createDrizzleClient(c.env.DB);
        const result = await deleteWikiPlatform(db, body.platform_key);

        if (!result) {
            return c.json({ error: 'Wiki platform not found or delete failed.' }, 404);
        }

        return c.json({ message: 'Wiki platform deleted successfully.' }, 200);
    } catch (error) {
        console.error('Wiki platform deletion error:', error);
        return c.json({ error: 'Internal server error' }, 500);
    }
});