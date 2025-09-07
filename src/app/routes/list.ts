import {
    ListAssets, ListCreators, ListMedia, ListRelations, GetWorkListWithPagination,
    ListTags, ListCategories, GetWorksByTag, GetWorksByCategory
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

// 获取所有标签列表
listInfo.get('/tags', async (c: any) => {
    const results = await ListTags(c.env.DB);
    return c.json(results);
});

// 获取分类树形结构
listInfo.get('/categories', async (c: any) => {
    const results = await ListCategories(c.env.DB);
    return c.json(results);
});

// 获取标签下的作品列表（带分页）
listInfo.get('/works-by-tag/:tag_uuid/:page/:size?', async (c: any) => {
    const tagUUID = c.req.param('tag_uuid');
    const page = parseInt(c.req.param('page'));
    const size = c.req.param('size') ? parseInt(c.req.param('size')) : 20;
    
    if (isNaN(page) || page < 1) {
        return c.json({ error: 'Invalid page number' }, 400);
    }
    
    const results = await GetWorksByTag(c.env.DB, tagUUID, page, size);
    return c.json(results);
});

// 获取分类下的作品列表（带分页）
listInfo.get('/works-by-category/:category_uuid/:page/:size?', async (c: any) => {
    const categoryUUID = c.req.param('category_uuid');
    const page = parseInt(c.req.param('page'));
    const size = c.req.param('size') ? parseInt(c.req.param('size')) : 20;
    
    if (isNaN(page) || page < 1) {
        return c.json({ error: 'Invalid page number' }, 400);
    }
    
    const results = await GetWorksByCategory(c.env.DB, categoryUUID, page, size);
    return c.json(results);
});
