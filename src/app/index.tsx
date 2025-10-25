// 应用入口
// Application Entry Point

import { Hono } from 'hono'
import { databaseMiddleware } from './middleware/database'
import { errorHandler, notFoundHandler } from './middleware/error-handler'
import { checkPendingMigrations } from './db/utils/migration-engine'
import { isDatabaseInitialized } from './db/operations/admin'
import { createApiApp } from './routes/api'
import { createPageRoutes } from './routes/pages'

/**
 * VOCArchive 主应用
 *
 * 架构:
 * - 数据库中间件: 为所有路由注入 DB 客户端
 * - 版本检查中间件: 确保数据库版本与代码版本匹配
 * - 初始化检查中间件: 确保数据库已初始化
 * - API 路由: /api/* (REST API 接口)
 * - 页面路由: 所有其他路由(SSR 页面)
 */

const app = new Hono<{ Bindings: CloudflareBindings }>()

// ========== 应用数据库中间件 ==========
// 为所有路由注入 DB 客户端(通过 c.get('db') 访问)
app.use('/*', databaseMiddleware)

// ========== 挂载 API 路由 ==========
// API 路由包含自己的 JWT 认证中间件
app.route('/api', createApiApp())

// ========== 数据库版本检查中间件 ==========
// 检查数据库版本是否匹配最新迁移版本
app.use('/*', async (c, next) => {
    const path = c.req.path;

    // 跳过 /init、/migration、/api/init、/api/migration、静态资源的检查
    if (path.startsWith('/init') || path.startsWith('/migration') ||
        path.startsWith('/api/init') || path.startsWith('/api/migration') ||
        path.startsWith('/static') || path.includes('.')) {
        return next();
    }

    try {
        const db = c.get('db');
        const isInitialized = await isDatabaseInitialized(db);

        // 如果未初始化,跳过版本检查(由下一个中间件处理)
        if (!isInitialized) {
            return next();
        }

        // 检查数据库版本
        const migrationStatus = await checkPendingMigrations(db);

        if (migrationStatus.currentVersion !== migrationStatus.latestVersion) {
            // 数据库版本不匹配
            if (path.startsWith('/admin')) {
                // 管理后台路由 -> 重定向到迁移页面
                return c.redirect('/migration');
            } else {
                // 其他主页路由 -> 返回 501 错误
                return c.text(
                    `数据库版本不匹配。当前版本: ${migrationStatus.currentVersion}, 预期版本: ${migrationStatus.latestVersion}。\n` +
                    `此功能需要数据库迁移才能使用。请联系管理员访问 /migration 页面进行数据库迁移。`,
                    501
                );
            }
        }
    } catch (error) {
        console.error('Database version check failed:', error);
        // 版本检查失败时,允许继续(避免阻塞正常流程)
    }

    return next();
});

// ========== 初始化检查中间件 ==========
// 检查数据库是否已初始化,如果未初始化则重定向到 /init
app.use('/*', async (c, next) => {
    const path = c.req.path;

    // 跳过 /init、/api/init、静态资源的检查
    if (path.startsWith('/init') || path.startsWith('/api/init') || path.startsWith('/admin') || path.startsWith('/static') || path.includes('.')) {
        return next();
    }

    try {
        const db = c.get('db');
        const isInitialized = await isDatabaseInitialized(db);

        if (!isInitialized && path !== '/init') {
            return c.redirect('/init');
        }
    } catch (error) {
        console.error('Database initialization check failed:', error);
        if (path !== '/init') {
            return c.redirect('/init');
        }
    }

    return next();
});

// ========== 挂载页面路由 ==========
// 页面路由包含自己的 JWT 认证中间件(用于管理后台)
app.route('/', createPageRoutes())

// ========== 错误处理 ==========
// 404 处理
app.notFound(notFoundHandler)

// 全局错误处理
app.onError(errorHandler)

export default app
