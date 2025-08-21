import { Hono } from 'hono'
import { serveStatic } from 'hono/cloudflare-workers'

import { listInfo } from './routes/list'
import { getInfo } from './routes/get'
import { deleteInfo } from './routes/delete'
import { updateInfo } from './routes/update'
import { inputInfo } from './routes/input'
import { searchInfo } from './routes/search'
import { auth } from './routes/auth'
import { jwt } from 'hono/jwt'

import { IndexPage } from './pages'
import { PlayerPage } from './pages/player'
import { GetWorkByUUID, GetWorkListWithPagination, SearchWorksByTitle } from './database'

const apiApp = new Hono<{ Bindings: Cloudflare }>()

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
apiApp.get('/config', (c:any) => {
  return c.json({ 
    asset_url: c.env.ASSET_URL 
  })
})

apiApp.get('/sw_config.js', (c:any) => {
    const assetUrl = c.env.ASSET_URL;
    const hostname = new URL(assetUrl).hostname;
    const content = `const ASSET_HOST = '${hostname}';`;
    return new Response(content, {
        headers: {
            'Content-Type': 'application/javascript',
        },
      });
});

// ========== 信息读取(仅GET方法) ==========
// ---------- 获取信息 ----------
apiApp.route('/get', getInfo)
// ---------- 搜索信息 ----------
apiApp.route('/search', searchInfo)
// ---------- 列出信息 ----------
apiApp.route('/list', listInfo)

const app = new Hono<{ Bindings: Cloudflare }>()

app.route('/api', apiApp)

app.get('/', async (c) => {
  const { search, page } = c.req.query()
  let works;
  if (search) {
    works = await SearchWorksByTitle(c.env.DB, search)
  } else {
    works = await GetWorkListWithPagination(c.env.DB, parseInt(page) || 1, 6)
  }
  return c.html(<IndexPage works={works} asset_url={c.env.ASSET_URL} />)
})

app.get('/player.html', async (c) => {
    const { uuid } = c.req.query()
    if (!uuid) {
        return c.notFound()
    }
    const workInfo = await GetWorkByUUID(c.env.DB, uuid)
    if (!workInfo) {
        return c.notFound()
    }
    return c.html(<PlayerPage workInfo={workInfo} asset_url={c.env.ASSET_URL} />)
})


export default app