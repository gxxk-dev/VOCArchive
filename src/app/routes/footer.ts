import { Hono } from 'hono';
import { createDrizzleClient } from '../db/client';
import { getFooterSettings, insertFooterSetting, updateFooterSetting, deleteFooterSetting } from '../db/operations/admin';
import { v4 as uuidv4 } from 'uuid';

interface FooterSetting {
    uuid: string;
    item_type: 'link' | 'social' | 'copyright';
    text: string;
    url?: string;
    icon_class?: string;
}

const app = new Hono<{ Bindings: CloudflareBindings }>()

// Public endpoint to get footer settings
app.get('/', async (c) => {
    try {
        const db = createDrizzleClient(c.env.DB);
        const settings = await getFooterSettings(db);
        return c.json(settings);
    } catch (e: any) {
        return c.json({ error: e.message }, 500);
    }
})

app.post('/settings', async (c) => {
    try {
        const body = await c.req.json<Omit<FooterSetting, 'uuid'>>();
        const newSetting: FooterSetting = {
            ...body,
            uuid: uuidv4()
        };
        const db = createDrizzleClient(c.env.DB);
        await insertFooterSetting(db, newSetting);
        return c.json({ success: true, uuid: newSetting.uuid });
    } catch (e: any) {
        return c.json({ error: e.message }, 500);
    }
})

app.put('/settings/:uuid', async (c) => {
    try {
        const uuid = c.req.param('uuid');
        const body = await c.req.json<Omit<FooterSetting, 'uuid'>>();
        const setting: FooterSetting = {
            ...body,
            uuid
        };
        const db = createDrizzleClient(c.env.DB);
        await updateFooterSetting(db, setting);
        return c.json({ success: true });
    } catch (e: any) {
        return c.json({ error: e.message }, 500);
    }
})

app.delete('/settings/:uuid', async (c) => {
    try {
        const uuid = c.req.param('uuid');
        const db = createDrizzleClient(c.env.DB);
        await deleteFooterSetting(db, uuid);
        return c.json({ success: true });
    } catch (e: any) {
        return c.json({ error: e.message }, 500);
    }
})

export default app
