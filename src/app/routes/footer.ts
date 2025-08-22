import { Hono } from 'hono'
import { GetFooterSettings, InsertFooterSetting, UpdateFooterSetting, DeleteFooterSetting, FooterSetting } from '../database'
import { v4 as uuidv4 } from 'uuid';

const app = new Hono<{ Bindings: Cloudflare }>()

// Public endpoint to get footer settings
app.get('/', async (c) => {
    try {
        const settings = await GetFooterSettings(c.env.DB)
        return c.json(settings)
    } catch (e: any) {
        return c.json({ error: e.message }, 500)
    }
})

app.post('/settings', async (c) => {
    try {
        const body = await c.req.json<Omit<FooterSetting, 'uuid'>>()
        const newSetting: FooterSetting = {
            ...body,
            uuid: uuidv4()
        }
        await InsertFooterSetting(c.env.DB, newSetting)
        return c.json({ success: true, uuid: newSetting.uuid })
    } catch (e: any) {
        return c.json({ error: e.message }, 500)
    }
})

app.put('/settings/:uuid', async (c) => {
    try {
        const uuid = c.req.param('uuid')
        const body = await c.req.json<Omit<FooterSetting, 'uuid'>>()
        const setting: FooterSetting = {
            ...body,
            uuid
        }
        await UpdateFooterSetting(c.env.DB, setting)
        return c.json({ success: true })
    } catch (e: any) {
        return c.json({ error: e.message }, 500)
    }
})

app.delete('/settings/:uuid', async (c) => {
    try {
        const uuid = c.req.param('uuid')
        await DeleteFooterSetting(c.env.DB, uuid)
        return c.json({ success: true })
    } catch (e: any) {
        return c.json({ error: e.message }, 500)
    }
})

export default app
