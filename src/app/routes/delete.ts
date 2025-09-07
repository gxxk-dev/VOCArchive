import {
    DeleteCreator, DeleteWork, DeleteAsset, DeleteRelation, DeleteMedia, DeleteWorksByCreator, DropUserTables,
    DeleteCreatorRequestBody, DeleteWorkRequestBody, DeleteAssetRequestBody, DeleteRelationRequestBody, DeleteMediaRequestBody,
    DeleteTag, DeleteCategory, RemoveWorkTags, RemoveWorkCategories
} from "../database"
import { Hono } from "hono";
const deleteHandlers = {
    creator: async (DB: any, body: DeleteCreatorRequestBody) => 
        await DeleteCreator(DB, body.creator_uuid),
    work: async (DB: any, body: DeleteWorkRequestBody) => 
        await DeleteWork(DB, body.work_uuid),
    asset: async (DB: any, body: DeleteAssetRequestBody) => 
        await DeleteAsset(DB, body.asset_uuid),
    relation: async (DB: any, body: DeleteRelationRequestBody) => 
        await DeleteRelation(DB, body.relation_uuid),
    media: async (DB: any, body: DeleteMediaRequestBody) => 
        await DeleteMedia(DB, body.media_uuid),
    tag: async (DB: any, body: { tag_uuid: string }) => 
        await DeleteTag(DB, body.tag_uuid),
    category: async (DB: any, body: { category_uuid: string }) => 
        await DeleteCategory(DB, body.category_uuid),
    worksbycreator: async (DB: any, body: DeleteCreatorRequestBody) => {
        const deletedCount = await DeleteWorksByCreator(DB, body.creator_uuid);
        return deletedCount;
    },
    dbclear: async (DB: any, _:any) => {
        await DropUserTables(DB);
        return true;
    }
};

export const deleteInfo = new Hono();

deleteInfo.post('/:resType', async (c: any) => {
    const resType = c.req.param('resType');
    const handler = deleteHandlers[resType as keyof typeof deleteHandlers];
    
    if (!handler) return c.json({ error: 'Invalid resource type' }, 400)
    
    const body = await c.req.json();
    const result = await handler(c.env.DB, body);
    
    if (resType === 'worksbycreator') {
        return c.json({ message: `Successfully deleted ${result} work.` }, 200);
    }
    
    if (resType === 'dbclear') {
        return c.json({ message: "OK." }, 200);
    }
    
    if (!result) {
        const resourceType = resType.charAt(0).toUpperCase() + resType.slice(1);
        return c.json({ error: `${resourceType} not found or delete failed.` }, 404);
    }
    
    const resourceType = resType.charAt(0).toUpperCase() + resType.slice(1);
    return c.json({ message: `${resourceType} deleted successfully.` }, 200);
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
