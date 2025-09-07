import {
    ListAssets, ListCreators, ListMedia, ListRelations, GetWorkListWithPagination,
    ListTags, ListCategories, GetWorksByTag, GetWorksByCategory
} from "../database"
import { Hono } from 'hono'

export const listInfo = new Hono();

// 获取创作者列表
listInfo.get('/creator/:pageNum/:pageSize?', async (c: any) => {
    const pageNum = Number(c.req.param("pageNum")) || 1;
    const pageSize = Number(c.req.param("pageSize")) || 10;
    return c.json(await ListCreators(c.env.DB, pageNum, pageSize));
});

// 获取媒体列表
listInfo.get('/media/:pageNum/:pageSize?', async (c: any) => {
    const pageNum = Number(c.req.param("pageNum")) || 1;
    const pageSize = Number(c.req.param("pageSize")) || 10;
    return c.json(await ListMedia(c.env.DB, pageNum, pageSize));
});

// 获取资产列表
listInfo.get('/asset/:pageNum/:pageSize?', async (c: any) => {
    const pageNum = Number(c.req.param("pageNum")) || 1;
    const pageSize = Number(c.req.param("pageSize")) || 10;
    return c.json(await ListAssets(c.env.DB, pageNum, pageSize));
});

// 获取关系列表
listInfo.get('/relation/:pageNum/:pageSize?', async (c: any) => {
    const pageNum = Number(c.req.param("pageNum")) || 1;
    const pageSize = Number(c.req.param("pageSize")) || 10;
    return c.json(await ListRelations(c.env.DB, pageNum, pageSize));
});

// 获取作品列表
listInfo.get('/work/:pageNum/:pageSize?', async (c: any) => {
    const pageNum = Number(c.req.param("pageNum")) || 1;
    const pageSize = Number(c.req.param("pageSize")) || 10;
    return c.json(await GetWorkListWithPagination(c.env.DB, pageNum, pageSize));
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
