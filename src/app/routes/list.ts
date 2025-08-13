import {
    ListAssets, ListCreators, ListMedia, ListRelations, GetWorkListWithPagination
} from "../database"
import { Hono } from 'hono'

const resHandlers = {
    creator: ListCreators,
    media: ListMedia,
    asset: ListAssets,
    relation: ListRelations,
    work: GetWorkListWithPagination
};

export const listInfo = new Hono();

listInfo.get('/:resType/:pageNum/:pageSize?', async (c:any) => {
    const resType = c.req.param("resType");
    const pageNum = Number(c.req.param("pageNum")) || 1;
    const pageSize = Number(c.req.param("pageSize")) || 10;
    const handler = resHandlers[resType as keyof typeof resHandlers];
    
    if (!handler) {
        return c.json({ error: 'Invalid resource type' }, 400);
    }
    
    return c.json(await handler(c.env.DB, pageNum, pageSize));
});
