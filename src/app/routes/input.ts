import { 
    InputAsset, InputCreator, InputMedia, InputRelation, InputWork,
    InputAssetRequestBody, InputCreatorRequestBody, InputMediaRequestBody, InputRelationRequestBody, InputWorkRequestBody,
    InputTag, InputCategory, AddWorkTags, AddWorkCategories
} from "../database";
import { Hono } from "hono";

export const inputInfo = new Hono();

// 添加作品
inputInfo.post('/work', async (c: any) => {
    try {
        const body: InputWorkRequestBody = await c.req.json();
        await InputWork(c.env.DB, body.work, body.titles || [], body.license || null, body.creator || [], body.wikis || []);
        return c.json({ message: "Work added successfully." }, 200);
    } catch (error) {
        return c.json({ error: 'Internal server error' }, 500);
    }
});

// 添加创作者
inputInfo.post('/creator', async (c: any) => {
    try {
        const body: InputCreatorRequestBody = await c.req.json();
        await InputCreator(c.env.DB, body.creator, body.wikis || []);
        return c.json({ message: "Creator added successfully." }, 200);
    } catch (error) {
        return c.json({ error: 'Internal server error' }, 500);
    }
});

// 添加资产
inputInfo.post('/asset', async (c: any) => {
    try {
        const body: InputAssetRequestBody = await c.req.json();
        await InputAsset(c.env.DB, body.asset, body.creator || []);
        return c.json({ message: "Asset added successfully." }, 200);
    } catch (error) {
        return c.json({ error: 'Internal server error' }, 500);
    }
});

// 添加关系
inputInfo.post('/relation', async (c: any) => {
    try {
        const body: InputRelationRequestBody = await c.req.json();
        await InputRelation(c.env.DB, body);
        return c.json({ message: "Work relation added successfully." }, 200);
    } catch (error) {
        return c.json({ error: 'Internal server error' }, 500);
    }
});

// 添加媒体
inputInfo.post('/media', async (c: any) => {
    try {
        const body: InputMediaRequestBody = await c.req.json();
        await InputMedia(c.env.DB, body);
        return c.json({ message: "Media source added successfully." }, 200);
    } catch (error) {
        return c.json({ error: 'Internal server error' }, 500);
    }
});

// 添加标签
inputInfo.post('/tag', async (c: any) => {
    try {
        const body: { uuid: string; name: string } = await c.req.json();
        await InputTag(c.env.DB, body);
        return c.json({ message: "Tag added successfully." }, 200);
    } catch (error) {
        return c.json({ error: 'Internal server error' }, 500);
    }
});

// 添加分类
inputInfo.post('/category', async (c: any) => {
    try {
        const body: { uuid: string; name: string; parent_uuid?: string } = await c.req.json();
        await InputCategory(c.env.DB, body);
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
        
        const success = await AddWorkTags(c.env.DB, work_uuid, tag_uuids);
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
        
        const success = await AddWorkCategories(c.env.DB, work_uuid, category_uuids);
        if (success) {
            return c.json({ message: 'Work categories added successfully.' });
        } else {
            return c.json({ error: 'Failed to add work categories' }, 500);
        }
    } catch (error) {
        return c.json({ error: 'Internal server error' }, 500);
    }
});
