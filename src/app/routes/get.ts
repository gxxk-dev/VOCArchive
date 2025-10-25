import { Hono } from 'hono';
import { createDrizzleClient } from '../db/client';
import {
    getWorkByIndex,
    getCreatorByIndex,
    getMediaByIndex,
    getAssetByIndex,
    getFileURLByIndexWithExternalStorage,
    getTagByIndex,
    getCategoryByIndex 
} from "../db";
import { getWorkTitleByIndex } from '../db/operations/work-title';
import { getExternalSourceByIndex } from '../db/operations/external_source';
import { getExternalObjectByIndex } from '../db/operations/external_object';
import { getWikiPlatformByKey } from '../db/operations/wiki-platforms';

export const getInfo = new Hono();

// ��ȡ�ļ��ض���
getInfo.get('/file/:index', async (c: any) => {
    const file_index = c.req.param('index');
    const db = c.get('db');
    
    // Use external storage architecture only
    const file_url = await getFileURLByIndexWithExternalStorage(db, file_index);
    
    if (!file_url) {
        return c.json({ 
            error: 'File not found or not migrated to external storage', 
            message: 'The file index was not found in the external storage system. If this is an old asset, please ensure it has been migrated to external storage.',
            index: file_index 
        }, 404);
    }
    
    return c.redirect(file_url, 302);
});

// ��ȡ��Ʒ����
getInfo.get('/work/:index', async (c: any) => {
    const db = c.get('db');
    const result = await getWorkByIndex(db, c.req.param('index'));
    return c.json(result);
});

// ��ȡ����������
getInfo.get('/creator/:index', async (c: any) => {
    const db = c.get('db');
    const result = await getCreatorByIndex(db, c.req.param('index'));
    return c.json(result);
});

// ��ȡý������
getInfo.get('/media/:index', async (c: any) => {
    const db = c.get('db');
    const result = await getMediaByIndex(db, c.req.param('index'));
    return c.json(result);
});

// ��ȡ�ʲ�����
getInfo.get('/asset/:index', async (c: any) => {
    const db = c.get('db');
    const result = await getAssetByIndex(db, c.req.param('index'));
    return c.json(result);
});

// ��ȡ��ǩ����
getInfo.get('/tag/:index', async (c: any) => {
    const db = c.get('db');
    const result = await getTagByIndex(db, c.req.param('index'));
    return c.json(result);
});

// ��ȡ��������
getInfo.get('/category/:index', async (c: any) => {
    const db = c.get('db');
    const result = await getCategoryByIndex(db, c.req.param('index'));
    return c.json(result);
});

// ��ȡ��Ʒ��������
getInfo.get('/work-title/:index', async (c: any) => {
    const db = c.get('db');
    const result = await getWorkTitleByIndex(db, c.req.param('index'));
    return c.json(result);
});

// ��ȡ�ⲿ�洢Դ����
getInfo.get('/external_source/:index', async (c: any) => {
    const db = c.get('db');
    const result = await getExternalSourceByIndex(db, c.req.param('index'));
    return c.json(result);
});

// ��ȡ�ⲿ��������
getInfo.get('/external_object/:index', async (c: any) => {
    const db = c.get('db');
    const result = await getExternalObjectByIndex(db, c.req.param('index'));
    return c.json(result);
});

// ��ȡWikiƽ̨����
getInfo.get('/wiki_platform/:platform_key', async (c: any) => {
    const db = c.get('db');
    const result = await getWikiPlatformByKey(db, c.req.param('platform_key'));
    return c.json(result);
});
