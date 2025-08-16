import { Hono } from 'hono'
import { SearchWorksByTitle } from '../database'

export const searchInfo = new Hono()

searchInfo.get('/:query', async (c: any) => {
  const query = c.req.param('query')
  const results = await SearchWorksByTitle(c.env.DB, query)
  return c.json(results)
})
