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

export const getInfo = new Hono();

getInfo.get('/:resType/:pageNum?pageSize=:pageSize', (c:any) => {
    const resType = c.req.param("resType");
    const pageNum = c.req.param("pageNum") || 1;
    const pageSize = c.req.query("pageSize") || 10;
    const handler = resHandlers[resType as keyof typeof resHandlers];
    
    if (!handler) {
        return c.json({ error: 'Invalid resource type' }, 400);
    }
    
    return c.json(handler(c.env.DB, pageNum, pageSize));
});
