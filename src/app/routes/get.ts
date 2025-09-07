import {
    GetWorkByUUID, GetCreatorByUUID, GetMediaByUUID, GetAssetByUUID, GetRelationByUUID, GetFileURLByUUID,
    GetTagByUUID, GetCategoryByUUID
} from "../database"
import { Hono } from 'hono'

export const getInfo = new Hono();

// 获取文件重定向
getInfo.get('/file/:uuid', async (c: any) => {
    const fileUUID = c.req.param('uuid');
    const assetURL = c.env.ASSET_URL as string;
    
    if (!assetURL) {
        return c.json({ error: 'Asset URL not configured' }, 500);
    }
    
    const fileURL = await GetFileURLByUUID(c.env.DB, fileUUID, assetURL);
    
    if (!fileURL) {
        return c.json({ error: 'File not found' }, 404);
    }
    
    return c.redirect(fileURL, 302);
});

// 获取作品详情
getInfo.get('/work/:uuid', async (c: any) => {
    const result = await GetWorkByUUID(c.env.DB, c.req.param('uuid'));
    return c.json(result);
});

// 获取创作者详情
getInfo.get('/creator/:uuid', async (c: any) => {
    const result = await GetCreatorByUUID(c.env.DB, c.req.param('uuid'));
    return c.json(result);
});

// 获取媒体详情
getInfo.get('/media/:uuid', async (c: any) => {
    const result = await GetMediaByUUID(c.env.DB, c.req.param('uuid'));
    return c.json(result);
});

// 获取资产详情
getInfo.get('/asset/:uuid', async (c: any) => {
    const result = await GetAssetByUUID(c.env.DB, c.req.param('uuid'));
    return c.json(result);
});

// 获取关系详情
getInfo.get('/relation/:uuid', async (c: any) => {
    const result = await GetRelationByUUID(c.env.DB, c.req.param('uuid'));
    return c.json(result);
});

// 获取标签详情
getInfo.get('/tag/:uuid', async (c: any) => {
    const result = await GetTagByUUID(c.env.DB, c.req.param('uuid'));
    return c.json(result);
});

// 获取分类详情
getInfo.get('/category/:uuid', async (c: any) => {
    const result = await GetCategoryByUUID(c.env.DB, c.req.param('uuid'));
    return c.json(result);
});