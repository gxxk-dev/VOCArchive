import { 
    InputAsset, InitDatabase, InputCreator, InputMedia, InputRelation, InputWork,
    InputAssetRequestBody, InputCreatorRequestBody, InputMediaRequestBody, InputRelationRequestBody, InputWorkRequestBody
} from "../database";
import { Hono } from "hono";

const inputHandlers = {
    work: async (DB: any, body: InputWorkRequestBody) => {
        await InputWork(DB, body.work, body.titles || [], body.license || null, body.creators || [], body.wikis || []);
        return "Work added successfully.";
    },
    creator: async (DB: any, body: InputCreatorRequestBody) => {
        await InputCreator(DB, body.creator, body.wikis || []);
        return "Creator added successfully.";
    },
    asset: async (DB: any, body: InputAssetRequestBody) => {
        await InputAsset(DB, body.asset, body.creators || []);
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
