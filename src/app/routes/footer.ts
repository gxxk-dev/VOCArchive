import { Hono } from 'hono';
import { createDrizzleClient } from '../db/client';
import { getFooterSettings, insertFooterSetting, updateFooterSetting, deleteFooterSetting } from '../db/operations/admin';

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
        const db = c.get('db');
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
            uuid: crypto.randomUUID()
        };
        const db = c.get('db');
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
        const db = c.get('db');
        await updateFooterSetting(db, setting);
        return c.json({ success: true });
    } catch (e: any) {
        return c.json({ error: e.message }, 500);
    }
})

app.delete('/settings/:uuid', async (c) => {
    try {
        const uuid = c.req.param('uuid');
        const db = c.get('db');
        await deleteFooterSetting(db, uuid);
        return c.json({ success: true });
    } catch (e: any) {
        return c.json({ error: e.message }, 500);
    }
})

export default app
