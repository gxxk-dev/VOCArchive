import {
    DeleteCreator, DeleteWork, DeleteAsset, DeleteRelation, DeleteMedia, DeleteWorksByCreator, DropUserTables,
    DeleteCreatorRequestBody, DeleteWorkRequestBody, DeleteAssetRequestBody, DeleteRelationRequestBody, DeleteMediaRequestBody,
    DeleteTag, DeleteCategory, RemoveWorkTags, RemoveWorkCategories, RemoveAllWorkTags, RemoveAllWorkCategories
} from "../database"
import { Hono } from "hono";

export const deleteInfo = new Hono();

// 删除创作者
deleteInfo.post('/creator', async (c: any) => {
    try {
        const body: DeleteCreatorRequestBody = await c.req.json();
        const result = await DeleteCreator(c.env.DB, body.creator_uuid);
        
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
        const result = await DeleteWork(c.env.DB, body.work_uuid);
        
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
        const result = await DeleteAsset(c.env.DB, body.asset_uuid);
        
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
        const result = await DeleteRelation(c.env.DB, body.relation_uuid);
        
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
        const result = await DeleteMedia(c.env.DB, body.media_uuid);
        
        if (!result) {
            return c.json({ error: 'Media not found or delete failed.' }, 404);
        }
        
        return c.json({ message: 'Media deleted successfully.' }, 200);
    } catch (error) {
        return c.json({ error: 'Internal server error' }, 500);
    }
});

// 删除标签
deleteInfo.post('/tag', async (c: any) => {
    try {
        const body: { tag_uuid: string } = await c.req.json();
        const result = await DeleteTag(c.env.DB, body.tag_uuid);
        
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
        const body: { category_uuid: string } = await c.req.json();
        const result = await DeleteCategory(c.env.DB, body.category_uuid);
        
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
        const deletedCount = await DeleteWorksByCreator(c.env.DB, body.creator_uuid);
        
        return c.json({ message: `Successfully deleted ${deletedCount} work.` }, 200);
    } catch (error) {
        return c.json({ error: 'Internal server error' }, 500);
    }
});

// 清空数据库
deleteInfo.post('/dbclear', async (c: any) => {
    try {
        await DropUserTables(c.env.DB);
        return c.json({ message: "OK." }, 200);
    } catch (error) {
        return c.json({ error: 'Internal server error' }, 500);
    }
});

// 批量删除作品标签
deleteInfo.post('/work-tags', async (c: any) => {
    try {
        const { work_uuid, tag_uuids } = await c.req.json();
        
        if (!work_uuid || !Array.isArray(tag_uuids)) {
            return c.json({ error: 'Invalid request body' }, 400);
        }
        
        const success = await RemoveWorkTags(c.env.DB, work_uuid, tag_uuids);
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
        const { work_uuid, category_uuids } = await c.req.json();
        
        if (!work_uuid || !Array.isArray(category_uuids)) {
            return c.json({ error: 'Invalid request body' }, 400);
        }
        
        const success = await RemoveWorkCategories(c.env.DB, work_uuid, category_uuids);
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
        const { work_uuid } = await c.req.json();
        
        if (!work_uuid) {
            return c.json({ error: 'Invalid request body: work_uuid required' }, 400);
        }
        
        const success = await RemoveAllWorkTags(c.env.DB, work_uuid);
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
        const { work_uuid } = await c.req.json();
        
        if (!work_uuid) {
            return c.json({ error: 'Invalid request body: work_uuid required' }, 400);
        }
        
        const success = await RemoveAllWorkCategories(c.env.DB, work_uuid);
        if (success) {
            return c.json({ message: 'All work categories removed successfully.' });
        } else {
            return c.json({ error: 'Failed to remove work categories' }, 500);
        }
    } catch (error) {
        return c.json({ error: 'Internal server error' }, 500);
    }
});