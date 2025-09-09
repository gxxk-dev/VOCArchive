import { createDrizzleClient } from '../db/client';
import { inputWork, inputAsset } from '../db/operations/work';
import { inputCreator } from '../db/operations/creator';
import { inputMedia } from '../db/operations/media';
import { inputRelation } from '../db/operations/relation';
import { inputTag, addWorkTags } from '../db/operations/tag';
import { inputCategory, addWorkCategories } from '../db/operations/category';
import { initializeDatabaseWithMigrations } from '../db/operations/admin';
import type { Work, WorkTitle, CreatorWithRole, WikiRef, Asset, MediaSource, WorkRelation, Tag, Category } from '../db/operations/work';
import { Hono } from "hono";

// Request body interfaces
interface InputWorkRequestBody {
    work: Work;
    titles: WorkTitle[];
    license?: string;
    creator?: CreatorWithRole[];
    wikis?: WikiRef[];
}

interface InputCreatorRequestBody {
    creator: { uuid: string; name: string; type: 'human' | 'virtual' };
    wikis?: WikiRef[];
}

interface InputAssetRequestBody {
    asset: Asset;
    creator?: CreatorWithRole[];
}

interface InputMediaRequestBody {
    uuid: string;
    work_uuid: string;
    is_music: boolean;
    file_name: string;
    url: string;
    mime_type: string;
    info: string;
}

interface InputRelationRequestBody {
    uuid: string;
    from_work_uuid: string;
    to_work_uuid: string;
    relation_type: 'original' | 'remix' | 'cover' | 'remake' | 'picture' | 'lyrics';
}

export const inputInfo = new Hono();

// 添加作品
inputInfo.post('/work', async (c: any) => {
    try {
        const body: InputWorkRequestBody = await c.req.json();
        const db = createDrizzleClient(c.env.DB);
        await inputWork(db, body.work, body.titles || [], body.license || null, body.creator || [], body.wikis || []);
        return c.json({ message: "Work added successfully." }, 200);
    } catch (error) {
        return c.json({ error: 'Internal server error' }, 500);
    }
});

// 添加创作者
inputInfo.post('/creator', async (c: any) => {
    try {
        const body: InputCreatorRequestBody = await c.req.json();
        const db = createDrizzleClient(c.env.DB);
        await inputCreator(db, body.creator, body.wikis || []);
        return c.json({ message: "Creator added successfully." }, 200);
    } catch (error) {
        return c.json({ error: 'Internal server error' }, 500);
    }
});

// 添加资产
inputInfo.post('/asset', async (c: any) => {
    try {
        const body: InputAssetRequestBody = await c.req.json();
        const db = createDrizzleClient(c.env.DB);
        await inputAsset(db, body.asset, body.creator || []);
        return c.json({ message: "Asset added successfully." }, 200);
    } catch (error) {
        return c.json({ error: 'Internal server error' }, 500);
    }
});

// 添加关系
inputInfo.post('/relation', async (c: any) => {
    try {
        const body: InputRelationRequestBody = await c.req.json();
        const db = createDrizzleClient(c.env.DB);
        await inputRelation(db, body);
        return c.json({ message: "Work relation added successfully." }, 200);
    } catch (error) {
        return c.json({ error: 'Internal server error' }, 500);
    }
});

// 添加媒体
inputInfo.post('/media', async (c: any) => {
    try {
        const body: InputMediaRequestBody = await c.req.json();
        const db = createDrizzleClient(c.env.DB);
        await inputMedia(db, body);
        return c.json({ message: "Media source added successfully." }, 200);
    } catch (error) {
        return c.json({ error: 'Internal server error' }, 500);
    }
});

// 添加标签
inputInfo.post('/tag', async (c: any) => {
    try {
        const body: { uuid: string; name: string } = await c.req.json();
        const db = createDrizzleClient(c.env.DB);
        await inputTag(db, body);
        return c.json({ message: "Tag added successfully." }, 200);
    } catch (error) {
        return c.json({ error: 'Internal server error' }, 500);
    }
});

// 添加分类
inputInfo.post('/category', async (c: any) => {
    try {
        const body: { uuid: string; name: string; parent_uuid?: string } = await c.req.json();
        const db = createDrizzleClient(c.env.DB);
        await inputCategory(db, body);
        return c.json({ message: "Category added successfully." }, 200);
    } catch (error) {
        return c.json({ error: 'Internal server error' }, 500);
    }
});

// 批量添加作品标签
inputInfo.post('/work-tags', async (c: any) => {
    try {
        const { work_uuid, tag_uuids } = await c.req.json();
        
        if (!work_uuid || !Array.isArray(tag_uuids)) {
            return c.json({ error: 'Invalid request body' }, 400);
        }
        
        const db = createDrizzleClient(c.env.DB);
        const success = await addWorkTags(db, work_uuid, tag_uuids);
        if (success) {
            return c.json({ message: 'Work tags added successfully.' });
        } else {
            return c.json({ error: 'Failed to add work tags' }, 500);
        }
    } catch (error) {
        return c.json({ error: 'Internal server error' }, 500);
    }
});

// 批量添加作品分类
inputInfo.post('/work-categories', async (c: any) => {
    try {
        const { work_uuid, category_uuids } = await c.req.json();
        
        if (!work_uuid || !Array.isArray(category_uuids)) {
            return c.json({ error: 'Invalid request body' }, 400);
        }
        
        const db = createDrizzleClient(c.env.DB);
        const success = await addWorkCategories(db, work_uuid, category_uuids);
        if (success) {
            return c.json({ message: 'Work categories added successfully.' });
        } else {
            return c.json({ error: 'Failed to add work categories' }, 500);
        }
    } catch (error) {
        return c.json({ error: 'Internal server error' }, 500);
    }
});

// 数据库初始化
inputInfo.post('/dbinit', async (c: any) => {
    try {
        const db = createDrizzleClient(c.env.DB);
        await initializeDatabaseWithMigrations(db);
        return c.json({ message: 'Database initialized successfully with Drizzle migrations' });
    } catch (error) {
        console.error('Database initialization error:', error);
        return c.json({ error: 'Failed to initialize database' }, 500);
    }
});
