import { createDrizzleClient } from '../db/client';
import { 
    listAssets, listRelations, getWorkListWithPagination 
} from '../db/operations/work';
import { listCreators } from '../db/operations/creator';
import { listMedia } from '../db/operations/media';
import { listTags, getWorksByTag, getWorkCountByTag } from '../db/operations/tag';
import { listCategories, getWorksByCategory, getWorkCountByCategory } from '../db/operations/category';
import { listWorkTitles } from '../db/operations/work-title';
import { Hono } from 'hono'

export const listInfo = new Hono();

// 获取创作者列表
listInfo.get('/creator/:pageNum/:pageSize?', async (c: any) => {
    const pageNum = Number(c.req.param("pageNum")) || 1;
    const pageSize = Number(c.req.param("pageSize")) || 10;
    const db = createDrizzleClient(c.env.DB);
    return c.json(await listCreators(db, pageNum, pageSize));
});

// 获取媒体列表
listInfo.get('/media/:pageNum/:pageSize?', async (c: any) => {
    const pageNum = Number(c.req.param("pageNum")) || 1;
    const pageSize = Number(c.req.param("pageSize")) || 10;
    const db = createDrizzleClient(c.env.DB);
    return c.json(await listMedia(db, pageNum, pageSize));
});

// 获取资产列表
listInfo.get('/asset/:pageNum/:pageSize?', async (c: any) => {
    const pageNum = Number(c.req.param("pageNum")) || 1;
    const pageSize = Number(c.req.param("pageSize")) || 10;
    const db = createDrizzleClient(c.env.DB);
    return c.json(await listAssets(db, pageNum, pageSize));
});

// 获取关系列表
listInfo.get('/relation/:pageNum/:pageSize?', async (c: any) => {
    const pageNum = Number(c.req.param("pageNum")) || 1;
    const pageSize = Number(c.req.param("pageSize")) || 10;
    const db = createDrizzleClient(c.env.DB);
    return c.json(await listRelations(db, pageNum, pageSize));
});

// 获取作品列表
listInfo.get('/work/:pageNum/:pageSize?', async (c: any) => {
    const pageNum = Number(c.req.param("pageNum")) || 1;
    const pageSize = Number(c.req.param("pageSize")) || 10;
    const db = createDrizzleClient(c.env.DB);
    return c.json(await getWorkListWithPagination(db, pageNum, pageSize));
});

// 获取所有标签列表
listInfo.get('/tags', async (c: any) => {
    const db = createDrizzleClient(c.env.DB);
    const results = await listTags(db);
    return c.json(results);
});

// 获取分类树形结构
listInfo.get('/categories', async (c: any) => {
    const db = createDrizzleClient(c.env.DB);
    const results = await listCategories(db);
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
    
    const db = createDrizzleClient(c.env.DB);
    const results = await getWorksByTag(db, tagUUID, page, size);
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
    
    const db = createDrizzleClient(c.env.DB);
    const results = await getWorksByCategory(db, categoryUUID, page, size);
    return c.json(results);
});

// 获取作品标题列表
listInfo.get('/work-titles/:work_uuid', async (c: any) => {
    const workUuid = c.req.param('work_uuid');
    const includeForSearch = c.req.query('include_for_search') === 'true';
    
    const db = createDrizzleClient(c.env.DB);
    const results = await listWorkTitles(db, workUuid, includeForSearch);
    return c.json(results);
});
