import { Hono } from 'hono'
import { SearchWorks } from '../database'

export const searchInfo = new Hono()

searchInfo.get('/:query', async (c: any) => {
  const query = c.req.param('query')
  const searchType = c.req.query('type') || 'all'  // 默认搜索全部，支持 'title', 'creator', 'all'
  const results = await SearchWorks(c.env.DB, query, searchType as 'title' | 'creator' | 'all')
  return c.json(results)
})
