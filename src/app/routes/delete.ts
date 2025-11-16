import { createDrizzleClient } from '../db/client';
import { deleteWork, deleteAsset } from '../db/operations/work';
import { deleteCreator, deleteWorksByCreator } from '../db/operations/creator';
import { deleteMedia } from '../db/operations/media';
import { deleteRelation } from '../db/operations/relation';
import { deleteTag, removeWorkTags, removeAllWorkTags } from '../db/operations/tag';
import { deleteCategory, removeWorkCategories, removeAllWorkCategories } from '../db/operations/category';
import { deleteWorkTitle } from '../db/operations/work-title';
import { deleteExternalSource } from '../db/operations/external_source';
import { deleteExternalObject } from '../db/operations/external_object';
import { deleteWikiPlatform } from '../db/operations/wiki-platforms';
import { clearUserDataTables } from '../db/operations/admin';
import { Hono } from "hono";

// Request body interfaces
interface DeleteCreatorRequestBody {
    creator_uuid: string;
}

interface DeleteWorkRequestBody {
    work_uuid: string;
}

interface DeleteAssetRequestBody {
    asset_uuid: string;
}

interface DeleteRelationRequestBody {
    relation_uuid: string;
}

interface DeleteMediaRequestBody {
    media_uuid: string;
}

interface DeleteWorkTitleRequestBody {
    title_uuid: string;
}

export const deleteInfo = new Hono();

// ɾ��������
deleteInfo.post('/creator', async (c: any) => {
    try {
        const body: DeleteCreatorRequestBody = await c.req.json();
        const db = c.get('db');
        const result = await deleteCreator(db, body.creator_uuid);
        
        if (!result) {
            return c.json({ error: 'Creator not found or delete failed.' }, 404);
        }
        
        return c.json({ message: 'Creator deleted successfully.' }, 200);
    } catch (error) {
        return c.json({ error: 'Internal server error' }, 500);
    }
});

// ɾ����Ʒ
deleteInfo.post('/work', async (c: any) => {
    try {
        const body: DeleteWorkRequestBody = await c.req.json();
        const db = c.get('db');
        const result = await deleteWork(db, body.work_uuid);
        
        if (!result) {
            return c.json({ error: 'Work not found or delete failed.' }, 404);
        }
        
        return c.json({ message: 'Work deleted successfully.' }, 200);
    } catch (error) {
        return c.json({ error: 'Internal server error' }, 500);
    }
});

// ɾ���ʲ�
deleteInfo.post('/asset', async (c: any) => {
    try {
        const body: DeleteAssetRequestBody = await c.req.json();
        const db = c.get('db');
        const result = await deleteAsset(db, body.asset_uuid);
        
        if (!result) {
            return c.json({ error: 'Asset not found or delete failed.' }, 404);
        }
        
        return c.json({ message: 'Asset deleted successfully.' }, 200);
    } catch (error) {
        return c.json({ error: 'Internal server error' }, 500);
    }
});

// ɾ����ϵ
deleteInfo.post('/relation', async (c: any) => {
    try {
        const body: DeleteRelationRequestBody = await c.req.json();
        const db = c.get('db');
        const result = await deleteRelation(db, body.relation_uuid);
        
        if (!result) {
            return c.json({ error: 'Relation not found or delete failed.' }, 404);
        }
        
        return c.json({ message: 'Relation deleted successfully.' }, 200);
    } catch (error) {
        return c.json({ error: 'Internal server error' }, 500);
    }
});

// ɾ��ý��
deleteInfo.post('/media', async (c: any) => {
    try {
        const body: DeleteMediaRequestBody = await c.req.json();
        const db = c.get('db');
        const result = await deleteMedia(db, body.media_uuid);
        
        if (!result) {
            return c.json({ error: 'Media not found or delete failed.' }, 404);
        }
        
        return c.json({ message: 'Media deleted successfully.' }, 200);
    } catch (error) {
        return c.json({ error: 'Internal server error' }, 500);
    }
});

// ɾ����Ʒ����
deleteInfo.post('/work-title', async (c: any) => {
    try {
        const body: DeleteWorkTitleRequestBody = await c.req.json();
        const db = c.get('db');
        const result = await deleteWorkTitle(db, body.title_uuid);
        
        if (!result) {
            return c.json({ error: 'Work title not found or delete failed.' }, 404);
        }
        
        return c.json({ message: 'Work title deleted successfully.' }, 200);
    } catch (error) {
        return c.json({ error: 'Internal server error' }, 500);
    }
});

// ɾ����ǩ
deleteInfo.post('/tag', async (c: any) => {
    try {
        const body: { tag_uuid: string } = await c.req.json();
        const db = c.get('db');
        const result = await deleteTag(db, body.tag_uuid);
        
        if (!result) {
            return c.json({ error: 'Tag not found or delete failed.' }, 404);
        }
        
        return c.json({ message: 'Tag deleted successfully.' }, 200);
    } catch (error) {
        return c.json({ error: 'Internal server error' }, 500);
    }
});

// ɾ������
deleteInfo.post('/category', async (c: any) => {
    try {
        const body: { category_uuid: string } = await c.req.json();
        const db = c.get('db');
        const result = await deleteCategory(db, body.category_uuid);
        
        if (!result) {
            return c.json({ error: 'Category not found or delete failed.' }, 404);
        }
        
        return c.json({ message: 'Category deleted successfully.' }, 200);
    } catch (error) {
        return c.json({ error: 'Internal server error' }, 500);
    }
});

// ɾ�������ߵ�������Ʒ
deleteInfo.post('/worksbycreator', async (c: any) => {
    try {
        const body: DeleteCreatorRequestBody = await c.req.json();
        const db = c.get('db');
        const deletedCount = await deleteWorksByCreator(db, body.creator_uuid);
        
        return c.json({ message: `Successfully deleted ${deletedCount} work.` }, 200);
    } catch (error) {
        return c.json({ error: 'Internal server error' }, 500);
    }
});

// ������ݿ�
deleteInfo.post('/dbclear', async (c: any) => {
    try {
        const db = c.get('db');
        await clearUserDataTables(db);
        return c.json({ message: "OK." }, 200);
    } catch (error) {
        return c.json({ error: 'Internal server error' }, 500);
    }
});

// ����ɾ����Ʒ��ǩ
deleteInfo.post('/work-tags', async (c: any) => {
    try {
        const { work_uuid, tag_uuids } = await c.req.json();

        if (!work_uuid || !Array.isArray(tag_uuids)) {
            return c.json({ error: 'Invalid request body' }, 400);
        }

        const db = c.get('db');
        const success = await removeWorkTags(db, work_uuid, tag_uuids);
        if (success) {
            return c.json({ message: 'Work tags removed successfully.' });
        } else {
            return c.json({ error: 'Failed to remove work tags' }, 500);
        }
    } catch (error) {
        return c.json({ error: 'Internal server error' }, 500);
    }
});

// ����ɾ����Ʒ����
deleteInfo.post('/work-categories', async (c: any) => {
    try {
        const { work_uuid, category_uuids } = await c.req.json();

        if (!work_uuid || !Array.isArray(category_uuids)) {
            return c.json({ error: 'Invalid request body' }, 400);
        }

        const db = c.get('db');
        const success = await removeWorkCategories(db, work_uuid, category_uuids);
        if (success) {
            return c.json({ message: 'Work categories removed successfully.' });
        } else {
            return c.json({ error: 'Failed to remove work categories' }, 500);
        }
    } catch (error) {
        return c.json({ error: 'Internal server error' }, 500);
    }
});

// ɾ����Ʒ�����б�ǩ
deleteInfo.post('/work-tags-all', async (c: any) => {
    try {
        const { work_uuid } = await c.req.json();

        if (!work_uuid) {
            return c.json({ error: 'Invalid request body: work_uuid required' }, 400);
        }

        const db = c.get('db');
        const success = await removeAllWorkTags(db, work_uuid);
        if (success) {
            return c.json({ message: 'All work tags removed successfully.' });
        } else {
            return c.json({ error: 'Failed to remove work tags' }, 500);
        }
    } catch (error) {
        return c.json({ error: 'Internal server error' }, 500);
    }
});

// ɾ����Ʒ�����з���
deleteInfo.post('/work-categories-all', async (c: any) => {
    try {
        const { work_uuid } = await c.req.json();

        if (!work_uuid) {
            return c.json({ error: 'Invalid request body: work_uuid required' }, 400);
        }

        const db = c.get('db');
        const success = await removeAllWorkCategories(db, work_uuid);
        if (success) {
            return c.json({ message: 'All work categories removed successfully.' });
        } else {
            return c.json({ error: 'Failed to remove work categories' }, 500);
        }
    } catch (error) {
        return c.json({ error: 'Internal server error' }, 500);
    }
});

// ɾ���ⲿ�洢Դ
deleteInfo.post('/external_source', async (c: any) => {
    try {
        const body: { external_source_uuid: string } = await c.req.json();
        const db = c.get('db');
        const result = await deleteExternalSource(db, body.external_source_uuid);
        
        if (!result) {
            return c.json({ error: 'External source not found or delete failed.' }, 404);
        }
        
        return c.json({ message: 'External source deleted successfully.' }, 200);
    } catch (error) {
        return c.json({ error: 'Internal server error' }, 500);
    }
});

// ɾ���ⲿ����
deleteInfo.post('/external_object', async (c: any) => {
    try {
        const body: { external_object_uuid: string } = await c.req.json();
        const db = c.get('db');
        const result = await deleteExternalObject(db, body.external_object_uuid);
        
        if (!result) {
            return c.json({ error: 'External object not found or delete failed.' }, 404);
        }
        
        return c.json({ message: 'External object deleted successfully.' }, 200);
    } catch (error) {
        return c.json({ error: 'Internal server error' }, 500);
    }
});

// ɾ��Wikiƽ̨
deleteInfo.post('/wiki_platform', async (c: any) => {
    try {
        const body: { platform_key: string } = await c.req.json();

        if (!body.platform_key) {
            return c.json({ error: 'Missing platform_key' }, 400);
        }

        const db = c.get('db');
        const result = await deleteWikiPlatform(db, body.platform_key);

        if (!result) {
            return c.json({ error: 'Wiki platform not found or delete failed.' }, 404);
        }

        return c.json({ message: 'Wiki platform deleted successfully.' }, 200);
    } catch (error) {
        console.error('Wiki platform deletion error:', error);
        return c.json({ error: 'Internal server error' }, 500);
    }
});
