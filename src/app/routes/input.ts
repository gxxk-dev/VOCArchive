import { 
    InputAsset, InitDatabase, InputCreator, InputMedia, InputRelation, InputWork,
    InputAssetRequestBody, InputCreatorRequestBody, InputMediaRequestBody, InputRelationRequestBody, InputWorkRequestBody,
    InputTag, InputCategory, AddWorkTags, AddWorkCategories
} from "../database";
import { Hono } from "hono";

const inputHandlers = {
    work: async (DB: any, body: InputWorkRequestBody) => {
        await InputWork(DB, body.work, body.titles || [], body.license || null, body.creator || [], body.wikis || []);
        return "Work added successfully.";
    },
    creator: async (DB: any, body: InputCreatorRequestBody) => {
        await InputCreator(DB, body.creator, body.wikis || []);
        return "Creator added successfully.";
    },
    asset: async (DB: any, body: InputAssetRequestBody) => {
        await InputAsset(DB, body.asset, body.creator || []);
        return "Asset added successfully.";
    },
    relation: async (DB: any, body: InputRelationRequestBody) => {
        await InputRelation(DB, body);
        return "Work relation added successfully.";
    },
    media: async (DB: any, body: InputMediaRequestBody) => {
        await InputMedia(DB, body);
        return "Media source added successfully.";
    },
    tag: async (DB: any, body: { uuid: string; name: string }) => {
        await InputTag(DB, body);
        return "Tag added successfully.";
    },
    category: async (DB: any, body: { uuid: string; name: string; parent_uuid?: string }) => {
        await InputCategory(DB, body);
        return "Category added successfully.";
    },
    dbinit: async (DB: any, _: any) => {
        await InitDatabase(DB);
        return "OK.";
    }
};

export const inputInfo = new Hono();

inputInfo.post('/:resType', async (c: any) => {
    const resType = c.req.param('resType');
    const handler = inputHandlers[resType as keyof typeof inputHandlers];
    
    if (!handler) {
        return c.json({ error: 'Invalid resource type' }, 400);
    }
    
    const body = await c.req.json();
    const result = await handler(c.env.DB, body);
    
    return c.json({ message: result }, 200);
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
