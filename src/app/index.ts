import { Hono } from 'hono'

import { listInfo } from './routes/list'
import { getInfo } from './routes/get'
import { deleteInfo } from './routes/delete'
import { updateInfo } from './routes/update'
import { inputInfo } from './routes/input'
import { searchInfo } from './routes/search'
import { auth } from './routes/auth'
import { jwt } from 'hono/jwt'

const app = new Hono<{ Bindings: Cloudflare }>().basePath("/api")
app.get('/', (c) => {
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
app.route('/delete', deleteInfo)
    .use("/delete/*",middleware)
// ---------- 修改信息 ----------
app.route('/update', updateInfo)
    .use("/update/*",middleware)
// ---------- 录入信息 ----------
app.route('/input', inputInfo)
    .use("/input/*",middleware)

// ========== 配置/权限 ==========
app.route('/auth', auth)

// ========== 站点配置 ==========
app.get('/config', (c:any) => {
  return c.json({ 
    asset_url: c.env.ASSET_URL 
  })
})

app.get('/sw_config.js', (c:any) => {
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
app.route('/get', getInfo)
// ---------- 搜索信息 ----------
app.route('/search', searchInfo)
// ---------- 列出信息 ----------
app.route('/list', listInfo)



export default app