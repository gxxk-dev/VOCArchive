import {
    UpdateCreator, UpdateWork, UpdateAsset, UpdateRelation, UpdateMedia,
    UpdateAssetRequestBody, UpdateCreatorRequestBody, UpdateWorkRequestBody, UpdateRelationRequestBody, UpdateMediaRequestBody
} from "../database"
import { Hono } from 'hono'

const updateHandlers = {
    creator: async (DB: any, body: UpdateCreatorRequestBody) => 
        await UpdateCreator(DB, body.creator_uuid, body.creator, body.wikis),
    work: async (DB: any, body: UpdateWorkRequestBody) => 
        await UpdateWork(DB, body.work_uuid, body.work, body.titles, body.license || null, body.creators, body.wikis),
    asset: async (DB: any, body: UpdateAssetRequestBody) => 
        await UpdateAsset(DB, body.asset_uuid, body.asset, body.creators),
    relation: async (DB: any, body: UpdateRelationRequestBody) => 
        await UpdateRelation(DB, body.relation_uuid, body),
    media: async (DB: any, body: UpdateMediaRequestBody) => 
        await UpdateMedia(DB, body.media_uuid, body)
};

export const getInfo = new Hono();
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
