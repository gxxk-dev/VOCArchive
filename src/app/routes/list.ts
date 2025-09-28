import { createDrizzleClient } from '../db/client';
import {
    listAssets, listRelations, getWorkListWithPagination
} from '../db/operations/work';
import { listCreators } from '../db/operations/creator';
import { listMedia } from '../db/operations/media';
import { listTags, getWorksByTag, getWorkCountByTag, listTagsWithCounts } from '../db/operations/tag';
import { listCategories, getWorksByCategory, getWorkCountByCategory, listCategoriesWithCounts } from '../db/operations/category';
import { listWorkTitles } from '../db/operations/work-title';
import { listExternalSources } from '../db/operations/external_source';
import { listExternalObjects } from '../db/operations/external_object';
import { getAllWikiPlatforms, getActiveWikiPlatforms } from '../db/operations/wiki-platforms';
import { Hono } from 'hono'

export const listInfo = new Hono();

// 获取创作者列表
listInfo.get('/creator/:page_num/:page_size?', async (c: any) => {
    const page_num = Number(c.req.param("page_num")) || 1;
    const page_size = Number(c.req.param("page_size")) || 10;
    const db = createDrizzleClient(c.env.DB);
    return c.json(await listCreators(db, page_num, page_size));
});

// 获取媒体列表
listInfo.get('/media/:page_num/:page_size?', async (c: any) => {
    const page_num = Number(c.req.param("page_num")) || 1;
    const page_size = Number(c.req.param("page_size")) || 10;
    const db = createDrizzleClient(c.env.DB);
    return c.json(await listMedia(db, page_num, page_size));
});

// 获取资产列表
listInfo.get('/asset/:page_num/:page_size?', async (c: any) => {
    const page_num = Number(c.req.param("page_num")) || 1;
    const page_size = Number(c.req.param("page_size")) || 10;
    const db = createDrizzleClient(c.env.DB);
    return c.json(await listAssets(db, page_num, page_size));
});

// 获取关系列表
listInfo.get('/relation/:page_num/:page_size?', async (c: any) => {
    const page_num = Number(c.req.param("page_num")) || 1;
    const page_size = Number(c.req.param("page_size")) || 10;
    const db = createDrizzleClient(c.env.DB);
    return c.json(await listRelations(db, page_num, page_size));
});

// 获取作品列表
listInfo.get('/work/:page_num/:page_size?', async (c: any) => {
    const page_num = Number(c.req.param("page_num")) || 1;
    const page_size = Number(c.req.param("page_size")) || 10;
    const db = createDrizzleClient(c.env.DB);
    return c.json(await getWorkListWithPagination(db, page_num, page_size));
});

// 获取所有标签列表
listInfo.get('/tags', async (c: any) => {
    const db = createDrizzleClient(c.env.DB);
    const results = await listTags(db);
    return c.json(results);
});

// 获取所有标签列表（包含作品数量）
listInfo.get('/tags-with-counts', async (c: any) => {
    const db = createDrizzleClient(c.env.DB);
    const results = await listTagsWithCounts(db);
    return c.json(results);
});

// 获取分类树形结构
listInfo.get('/categories', async (c: any) => {
    const db = createDrizzleClient(c.env.DB);
    const results = await listCategories(db);
    return c.json(results);
});

// 获取分类树形结构（包含作品数量）
listInfo.get('/categories-with-counts', async (c: any) => {
    const db = createDrizzleClient(c.env.DB);
    const results = await listCategoriesWithCounts(db);
    return c.json(results);
});

// 获取标签下的作品列表（带分页）
listInfo.get('/works-by-tag/:tag_uuid/:page/:size?', async (c: any) => {
    const tag_uuid = c.req.param('tag_uuid');
    const page = parseInt(c.req.param('page'));
    const size = c.req.param('size') ? parseInt(c.req.param('size')) : 20;
    
    if (isNaN(page) || page < 1) {
        return c.json({ error: 'Invalid page number' }, 400);
    }
    
    const db = createDrizzleClient(c.env.DB);
    const results = await getWorksByTag(db, tag_uuid, page, size);
    return c.json(results);
});

// 获取分类下的作品列表（带分页）
listInfo.get('/works-by-category/:category_uuid/:page/:size?', async (c: any) => {
    const category_uuid = c.req.param('category_uuid');
    const page = parseInt(c.req.param('page'));
    const size = c.req.param('size') ? parseInt(c.req.param('size')) : 20;
    
    if (isNaN(page) || page < 1) {
        return c.json({ error: 'Invalid page number' }, 400);
    }
    
    const db = createDrizzleClient(c.env.DB);
    const results = await getWorksByCategory(db, category_uuid, page, size);
    return c.json(results);
});

// 获取作品标题列表
listInfo.get('/work-titles/:work_uuid', async (c: any) => {
    const work_uuid = c.req.param('work_uuid');
    const include_for_search = c.req.query('include_for_search') === 'true';
    
    const db = createDrizzleClient(c.env.DB);
    const results = await listWorkTitles(db, work_uuid, include_for_search);
    return c.json(results);
});

// 获取外部存储源列表
listInfo.get('/external_sources', async (c: any) => {
    const db = createDrizzleClient(c.env.DB);
    const results = await listExternalSources(db, 1, 999);
    return c.json(results);
});

// 获取外部对象列表（无分页参数版本）
listInfo.get('/external_objects', async (c: any) => {
    const db = createDrizzleClient(c.env.DB);
    const results = await listExternalObjects(db, 1, 999);
    return c.json(results);
});

// 获取外部对象列表（带分页参数版本）
listInfo.get('/external_objects/:page_num/:page_size?', async (c: any) => {
    const page_num = Number(c.req.param("page_num")) || 1;
    const page_size = Number(c.req.param("page_size")) || 10;
    const db = createDrizzleClient(c.env.DB);
    const results = await listExternalObjects(db, page_num, page_size);
    return c.json(results);
});

// 获取Wiki平台列表（所有平台）
listInfo.get('/wiki_platforms', async (c: any) => {
    const db = createDrizzleClient(c.env.DB);
    const results = await getAllWikiPlatforms(db);
    return c.json(results);
});

// 获取激活的Wiki平台列表
listInfo.get('/wiki_platforms/active', async (c: any) => {
    const db = createDrizzleClient(c.env.DB);
    const results = await getActiveWikiPlatforms(db);
    return c.json(results);
});
