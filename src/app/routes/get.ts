import { Hono } from 'hono';
import { createDrizzleClient } from '../db/client';
import {
    getWorkByUUID, 
    getCreatorByUUID, 
    getMediaByUUID, 
    getAssetByUUID,
    getFileURLByUUID,
    getTagByUUID, 
    getCategoryByUUID
} from "../db";

export const getInfo = new Hono();

// 获取文件重定向
getInfo.get('/file/:uuid', async (c: any) => {
    const fileUUID = c.req.param('uuid');
    const assetURL = c.env.ASSET_URL as string;
    
    if (!assetURL) {
        return c.json({ error: 'Asset URL not configured' }, 500);
    }
    
    const db = createDrizzleClient(c.env.DB);
    const fileURL = await getFileURLByUUID(db, fileUUID, assetURL);
    
    if (!fileURL) {
        return c.json({ error: 'File not found' }, 404);
    }
    
    return c.redirect(fileURL, 302);
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