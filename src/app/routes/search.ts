import { Hono } from 'hono';
import { createDrizzleClient } from '../db/client';
import { searchWorks } from '../db';

export const searchInfo = new Hono();

searchInfo.get('/:query', async (c: any) => {
  const query = c.req.param('query');
  const searchType = c.req.query('type') || 'all';  // 默认搜索全部，支持 'title', 'creator', 'all'
  const db = createDrizzleClient(c.env.DB);
  const results = await searchWorks(db, query, searchType as 'title' | 'creator' | 'all');
  return c.json(results);
});
