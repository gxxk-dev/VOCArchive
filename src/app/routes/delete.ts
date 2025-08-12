import {
    DeleteCreator, DeleteWork, DeleteAsset, DeleteRelation, DeleteMedia, DeleteWorksByCreator, DropUserTables,
    DeleteCreatorRequestBody, DeleteWorkRequestBody, DeleteAssetRequestBody, DeleteRelationRequestBody, DeleteMediaRequestBody
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
    worksbycreator: async (DB: any, body: DeleteCreatorRequestBody) => {
        const deletedCount = await DeleteWorksByCreator(DB, body.creator_uuid);
        return deletedCount;
    },
    dbclear: async (DB: any) => {
        await DropUserTables(DB);
        return true;
    }
};
export const deleteInfo = new Hono();
deleteInfo.delete('/:resType', async (c: any) => {
    const resType = c.req.param('resType');
    const handler = deleteHandlers[resType as keyof typeof deleteHandlers];
    
    if (!handler) {
        return c.json({ error: 'Invalid resource type' }, 400);
    }
    
    const body = await c.req.json();
    const result = await handler(c.env.DB, body);
    
    if (resType === 'worksbycreator') {
        return c.json({ message: `Successfully deleted ${result} works.` }, 200);
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
