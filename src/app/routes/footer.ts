import { Hono } from 'hono';
import { createDrizzleClient } from '../db/client';
import { getFooterSettings, insertFooterSetting, updateFooterSetting, deleteFooterSetting } from '../db/operations/admin';
import { generateIndex } from '../db/utils/index-utils';

interface FooterSetting {
    index: string;
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
        const body = await c.req.json<Omit<FooterSetting, 'index'>>();
        const newSetting: FooterSetting = {
            ...body,
            index: generateIndex()
        };
        const db = c.get('db');
        await insertFooterSetting(db, newSetting);
        return c.json({ success: true, index: newSetting.index });
    } catch (e: any) {
        return c.json({ error: e.message }, 500);
    }
})

app.put('/settings/:index', async (c) => {
    try {
        const index = c.req.param('index');
        const body = await c.req.json<Omit<FooterSetting, 'index'>>();
        const setting: FooterSetting = {
            ...body,
            index 
        };
        const db = c.get('db');
        await updateFooterSetting(db, setting);
        return c.json({ success: true });
    } catch (e: any) {
        return c.json({ error: e.message }, 500);
    }
})

app.delete('/settings/:index', async (c) => {
    try {
        const index = c.req.param('index');
        const db = c.get('db');
        await deleteFooterSetting(db, index);
        return c.json({ success: true });
    } catch (e: any) {
        return c.json({ error: e.message }, 500);
    }
})

export default app
