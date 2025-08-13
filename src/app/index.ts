import { Hono } from 'hono'
import { middleware_Auth } from './auth'

import { listInfo } from './routes/list'
import { getInfo } from './routes/get'
import { deleteInfo } from './routes/delete'
import { updateInfo } from './routes/update'
import { inputInfo } from './routes/input'

const app = new Hono()
const api = new Hono()
app.route('/api', api) // 为ssr做准备...

// ========== 信息管理 ==========
const infoManage = new Hono()
infoManage.use(
    '*',
    middleware_Auth
)
api.route('/api', infoManage)
// ---------- 删除信息 ----------
infoManage.route('/api/delete', deleteInfo)
// ---------- 修改信息 ----------
infoManage.route('/api/update', updateInfo)
// ========== 配置设置 ==========
const configSetting = new Hono()
api.route('/api', configSetting)
// ---------- TOTP_SECRET重置 ----------

// ---------- JWT_SECRET重置 ----------

// ========== 信息读取 ==========
const infoGet = new Hono()
app.route('/api', infoGet)

// ---------- 获取信息 ----------

// ---------- 列出信息 ----------

export default app