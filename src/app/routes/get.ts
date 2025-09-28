import { Hono } from 'hono';
import { createDrizzleClient } from '../db/client';
import {
    getWorkByUUID,
    getCreatorByUUID,
    getMediaByUUID,
    getAssetByUUID,
    getFileURLByUUIDWithExternalStorage,
    getTagByUUID,
    getCategoryByUUID
} from "../db";
import { getWorkTitleByUUID } from '../db/operations/work-title';
import { getExternalSourceByUUID } from '../db/operations/external_source';
import { getExternalObjectByUUID } from '../db/operations/external_object';
import { getWikiPlatform } from '../db/operations/wiki-platforms';

export const getInfo = new Hono();

// 获取文件重定向
getInfo.get('/file/:uuid', async (c: any) => {
    const file_uuid = c.req.param('uuid');
    const db = createDrizzleClient(c.env.DB);
    
    // Use external storage architecture only
    const file_url = await getFileURLByUUIDWithExternalStorage(db, file_uuid);
    
    if (!file_url) {
        return c.json({ 
            error: 'File not found or not migrated to external storage', 
            message: 'The file UUID was not found in the external storage system. If this is an old asset, please ensure it has been migrated to external storage.',
            uuid: file_uuid
        }, 404);
    }
    
    return c.redirect(file_url, 302);
});

// 获取作品详情
getInfo.get('/work/:uuid', async (c: any) => {
    const db = createDrizzleClient(c.env.DB);
    const result = await getWorkByUUID(db, c.req.param('uuid'));
    return c.json(result);
});

// 获取创作者详情
getInfo.get('/creator/:uuid', async (c: any) => {
    const db = createDrizzleClient(c.env.DB);
    const result = await getCreatorByUUID(db, c.req.param('uuid'));
    return c.json(result);
});

// 获取媒体详情
getInfo.get('/media/:uuid', async (c: any) => {
    const db = createDrizzleClient(c.env.DB);
    const result = await getMediaByUUID(db, c.req.param('uuid'));
    return c.json(result);
});

// 获取资产详情
getInfo.get('/asset/:uuid', async (c: any) => {
    const db = createDrizzleClient(c.env.DB);
    const result = await getAssetByUUID(db, c.req.param('uuid'));
    return c.json(result);
});

// 获取标签详情
getInfo.get('/tag/:uuid', async (c: any) => {
    const db = createDrizzleClient(c.env.DB);
    const result = await getTagByUUID(db, c.req.param('uuid'));
    return c.json(result);
});

// 获取分类详情
getInfo.get('/category/:uuid', async (c: any) => {
    const db = createDrizzleClient(c.env.DB);
    const result = await getCategoryByUUID(db, c.req.param('uuid'));
    return c.json(result);
});

// 获取作品标题详情
getInfo.get('/work-title/:uuid', async (c: any) => {
    const db = createDrizzleClient(c.env.DB);
    const result = await getWorkTitleByUUID(db, c.req.param('uuid'));
    return c.json(result);
});

// 获取外部存储源详情
getInfo.get('/external_source/:uuid', async (c: any) => {
    const db = createDrizzleClient(c.env.DB);
    const result = await getExternalSourceByUUID(db, c.req.param('uuid'));
    return c.json(result);
});

// 获取外部对象详情
getInfo.get('/external_object/:uuid', async (c: any) => {
    const db = createDrizzleClient(c.env.DB);
    const result = await getExternalObjectByUUID(db, c.req.param('uuid'));
    return c.json(result);
});

// 获取Wiki平台详情
getInfo.get('/wiki_platform/:uuid', async (c: any) => {
    const db = createDrizzleClient(c.env.DB);
    const result = await getWikiPlatform(db, c.req.param('uuid'));
    return c.json(result);
});