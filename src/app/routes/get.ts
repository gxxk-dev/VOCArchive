import {
    GetWorkByUUID, GetCreatorByUUID, GetMediaByUUID, GetAssetByUUID, GetRelationByUUID
} from "../database"
import { Hono } from 'hono'

const resHandlers = {
    work: GetWorkByUUID,
    creator: GetCreatorByUUID,
    media: GetMediaByUUID,
    asset: GetAssetByUUID,
    relation: GetRelationByUUID
};

export const getInfo = new Hono();

getInfo.get('/:resType/:uuid', (c: any) => {
    const resType = c.req.param('resType');
    const handler = resHandlers[resType as keyof typeof resHandlers];
    
    if (!handler) {
        return c.json({ error: 'Invalid resource type' }, 400);
    }
    
    return c.json(handler(c.env.DB, c.req.param('uuid')));
});
