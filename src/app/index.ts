import { Hono } from 'hono'
import { middleware_Auth } from './auth'

const app = new Hono()
const api = new Hono()
app.route('/api', api) // 为ssr做准备...

// ========== 信息管理 ==========
const infoManage = new Hono()
infoManage.use(
    '*',
    middleware_Auth
)
app.route('/api', infoManage)
// ---------- 删除信息 ----------
// ---------- 修改信息 ----------

// ========== 配置设置 ==========
const configSetting = new Hono()
app.route('/api', configSetting)

// ---------- TOTP_SECRET重置 ----------

// ---------- JWT_SECRET重置 ----------

// ========== 信息读取 ==========
const infoGet = new Hono()
app.route('/api', infoGet)

// ---------- 获取信息 ----------

// ---------- 列出信息 ----------

export default app