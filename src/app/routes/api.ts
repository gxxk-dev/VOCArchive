// API 路由配置
// API Routes Configuration

import { Hono } from 'hono'
import { databaseMiddleware } from '../middleware/database'
import { createJWTMiddleware } from '../middleware/jwt'
import { errorHandler, notFoundHandler } from '../middleware/error-handler'

import { listInfo } from './list'
import { getInfo } from './get'
import { deleteInfo } from './delete'
import { updateInfo } from './update'
import { inputInfo } from './input'
import { searchInfo } from './search'
import { auth } from './auth'
import { initRoutes } from './init'
import footer from './footer'
import config from './config'
import { migration } from './migration'

/**
 * 创建并配置 API 应用
 *
 * 路由结构:
 * - /api/delete/* - 删除操作(需要认证)
 * - /api/update/* - 更新操作(需要认证)
 * - /api/input/* - 创建操作(需要认证)
 * - /api/migration/* - 迁移管理(需要认证)
 * - /api/auth - 认证接口
 * - /api/init - 初始化接口
 * - /api/footer - 页脚配置
 * - /api/config - 站点配置
 * - /api/get - 获取信息
 * - /api/search - 搜索信息
 * - /api/list - 列出信息
 */
export function createApiApp() {
    const apiApp = new Hono<{ Bindings: CloudflareBindings }>()

    // 应用数据库中间件(为所有 API 路由注入 DB 客户端)
    apiApp.use('/*', databaseMiddleware)

    // 根路径
    apiApp.get('/', (c) => {
        return c.text('Hello Hono!')
    })

    // JWT 认证中间件(仅支持 Authorization header)
    const jwtMiddleware = createJWTMiddleware()

    // ========== 信息管理(需要认证) ==========
    // ---------- 删除信息 ----------
    apiApp.use("/delete/*", jwtMiddleware)
    apiApp.route('/delete', deleteInfo)

    // ---------- 修改信息 ----------
    apiApp.use("/update/*", jwtMiddleware)
    apiApp.route('/update', updateInfo)

    // ---------- 录入信息 ----------
    apiApp.use("/input/*", jwtMiddleware)
    apiApp.route('/input', inputInfo)

    // ========== 数据库迁移(需要认证) ==========
    apiApp.use("/migration/*", jwtMiddleware)
    apiApp.route('/migration', migration)

    // ========== 配置/权限 ==========
    apiApp.route('/auth', auth)

    // ========== 初始化 API(无需认证) ==========
    apiApp.route('/init', initRoutes)

    // ========== 站点配置 ==========
    apiApp.route('/footer', footer)
    apiApp.route('/config', config)

    // ========== 信息读取(仅GET方法,无需认证) ==========
    // ---------- 获取信息 ----------
    apiApp.route('/get', getInfo)

    // ---------- 搜索信息 ----------
    apiApp.route('/search', searchInfo)

    // ---------- 列出信息 ----------
    apiApp.route('/list', listInfo)

    // ========== 错误处理 ==========
    // 404 处理
    apiApp.notFound(notFoundHandler)

    // 全局错误处理
    apiApp.onError(errorHandler)

    return apiApp
}
