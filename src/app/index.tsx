import { Hono } from 'hono'
import { serveStatic } from 'hono/cloudflare-workers'

import { listInfo } from './routes/list'
import { getInfo } from './routes/get'
import { deleteInfo } from './routes/delete'
import { updateInfo } from './routes/update'
import { inputInfo } from './routes/input'
import { searchInfo } from './routes/search'
import { auth } from './routes/auth'
import footer from './routes/footer'
import { jwt } from 'hono/jwt'

import { IndexPage } from './pages/index'
import { PlayerPage } from './pages/player'
import { createDrizzleClient } from './db/client'
import { getFooterSettings, initializeDatabaseWithMigrations } from './db/operations/admin'
import { getWorkByUUID, getWorkListWithPagination, getTotalWorkCount } from './db/operations/work'
import { searchWorks, getAvailableLanguages } from './db/operations/search'
import { getWorksByTag, getWorkCountByTag, getTagByUUID } from './db/operations/tag'
import { getWorksByCategory, getWorkCountByCategory, getCategoryByUUID } from './db/operations/category'

const apiApp = new Hono<{ Bindings: CloudflareBindings }>()

apiApp.get('/', (c) => {
  return c.text('Hello Hono!')
})


// ========== 中间件 ==========
const middleware=async (c: any, next:any) => {
    const jwtMiddleware = jwt({
        secret: c.env.JWT_SECRET as string,
    })
    return jwtMiddleware(c, next)
}

// ========== 信息管理 ==========
// ---------- 删除信息 ----------
apiApp.route('/delete', deleteInfo)
    .use("/delete/*",middleware)
// ---------- 修改信息 ----------
apiApp.route('/update', updateInfo)
    .use("/update/*",middleware)
// ---------- 录入信息 ----------
apiApp.route('/input', inputInfo)
    .use("/input/*",middleware)

// ========== 配置/权限 ==========
apiApp.route('/auth', auth)

// ========== 站点配置 ==========
apiApp.route('/footer', footer)

apiApp.get('/config', (c:any) => {
  return c.json({ 
    // Configuration endpoint for future use
    // asset_url removed - using external storage architecture
  })
})

// ========== 信息读取(仅GET方法) ==========
// ---------- 获取信息 ----------
apiApp.route('/get', getInfo)
// ---------- 搜索信息 ----------
apiApp.route('/search', searchInfo)
// ---------- 列出信息 ----------
apiApp.route('/list', listInfo)

const app = new Hono<{ Bindings: CloudflareBindings }>()

app.route('/api', apiApp)

app.get('/', async (c) => {
  const { search, page, type, tag, category, lang } = c.req.query()
  console.log(search, page, type, tag, category, lang)
  
  const db = createDrizzleClient(c.env.DB);
  let works;
  let totalCount = 0;
  let filterInfo = null;
  const currentPage = parseInt(page) || 1;
  const pageSize = 10;
  const preferredLanguage = lang || 'auto';
  
  if (search) {
    works = await searchWorks(db, search, type as 'title' | 'creator' | 'all' || 'all')
    totalCount = works.length; // Search returns all results
  } else if (tag) {
    works = await getWorksByTag(db, tag, currentPage, pageSize)
    totalCount = await getWorkCountByTag(db, tag)
    const tagInfo = await getTagByUUID(db, tag)
    if (tagInfo) {
      filterInfo = {
        type: 'tag' as const,
        name: tagInfo.name,
        uuid: tag
      }
    }
  } else if (category) {
    works = await getWorksByCategory(db, category, currentPage, pageSize)
    totalCount = await getWorkCountByCategory(db, category)
    const categoryInfo = await getCategoryByUUID(db, category)
    if (categoryInfo) {
      filterInfo = {
        type: 'category' as const, 
        name: categoryInfo.name,
        uuid: category
      }
    }
  } else {
    works = await getWorkListWithPagination(db, currentPage, pageSize)
    totalCount = await getTotalWorkCount(db)
  }
  
  const footerSettings = await getFooterSettings(db)
  const availableLanguages = await getAvailableLanguages(db)
  return c.html(<IndexPage 
    works={works} 
    footerSettings={footerSettings}
    currentPage={currentPage}
    totalCount={totalCount}
    pageSize={pageSize}
    filterInfo={filterInfo}
    searchQuery={search || ''}
    preferredLanguage={preferredLanguage}
    availableLanguages={availableLanguages}
  />)
})

app.get('/player', async (c) => {
    const { uuid } = c.req.query()
    if (!uuid) {
        return c.notFound()
    }
    const db = createDrizzleClient(c.env.DB);
    const workInfo = await getWorkByUUID(db, uuid)
    if (!workInfo) {
        return c.notFound()
    }
    const footerSettings = await getFooterSettings(db)
    return c.html(<PlayerPage workInfo={workInfo} footerSettings={footerSettings} />)
})


export default app