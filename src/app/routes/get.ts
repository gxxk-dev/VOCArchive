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
import { getWikiPlatformByKey } from '../db/operations/wiki-platforms';

export const getInfo = new Hono();

// ��ȡ�ļ��ض���
getInfo.get('/file/:uuid', async (c: any) => {
    const file_uuid = c.req.param('uuid');
    const db = c.get('db');

    // Use external storage architecture only
    const file_url = await getFileURLByUUIDWithExternalStorage(db, file_uuid);

    if (!file_url) {
        return c.json({
            error: 'File not found or not migrated to external storage',
            message: 'The file uuid was not found in the external storage system. If this is an old asset, please ensure it has been migrated to external storage.',
            uuid: file_uuid
        }, 404);
    }

    return c.redirect(file_url, 302);
});

// ��ȡ��Ʒ����
getInfo.get('/work/:uuid', async (c: any) => {
    const db = c.get('db');
    const result = await getWorkByUUID(db, c.req.param('uuid'));
    return c.json(result);
});

// ��ȡ����������
getInfo.get('/creator/:uuid', async (c: any) => {
    const db = c.get('db');
    const result = await getCreatorByUUID(db, c.req.param('uuid'));
    return c.json(result);
});

// ��ȡý������
getInfo.get('/media/:uuid', async (c: any) => {
    const db = c.get('db');
    const result = await getMediaByUUID(db, c.req.param('uuid'));
    return c.json(result);
});

// ��ȡ�ʲ�����
getInfo.get('/asset/:uuid', async (c: any) => {
    const db = c.get('db');
    const result = await getAssetByUUID(db, c.req.param('uuid'));
    return c.json(result);
});

// ��ȡ��ǩ����
getInfo.get('/tag/:uuid', async (c: any) => {
    const db = c.get('db');
    const result = await getTagByUUID(db, c.req.param('uuid'));
    return c.json(result);
});

// ��ȡ��������
getInfo.get('/category/:uuid', async (c: any) => {
    const db = c.get('db');
    const result = await getCategoryByUUID(db, c.req.param('uuid'));
    return c.json(result);
});

// ��ȡ��Ʒ��������
getInfo.get('/work-title/:uuid', async (c: any) => {
    const db = c.get('db');
    const result = await getWorkTitleByUUID(db, c.req.param('uuid'));
    return c.json(result);
});

// ��ȡ�ⲿ�洢Դ����
getInfo.get('/external_source/:uuid', async (c: any) => {
    const db = c.get('db');
    const result = await getExternalSourceByUUID(db, c.req.param('uuid'));
    return c.json(result);
});

// ��ȡ�ⲿ��������
getInfo.get('/external_object/:uuid', async (c: any) => {
    const db = c.get('db');
    const result = await getExternalObjectByUUID(db, c.req.param('uuid'));
    return c.json(result);
});

// ��ȡWikiƽ̨����
getInfo.get('/wiki_platform/:platform_key', async (c: any) => {
    const db = c.get('db');
    const result = await getWikiPlatformByKey(db, c.req.param('platform_key'));
    return c.json(result);
});
