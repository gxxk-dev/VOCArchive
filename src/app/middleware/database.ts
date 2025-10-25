// 数据库中间件 - 统一管理数据库客户端创建
// Database Middleware - Unified database client management

import { MiddlewareHandler } from 'hono';
import { createDrizzleClient } from '../db/client';
import type { DrizzleDB } from '../db/client';

// 扩展 Hono 上下文类型，添加 db 属性
declare module 'hono' {
    interface ContextVariableMap {
        db: DrizzleDB;
    }
}

/**
 * 数据库中间件
 * 在请求处理前创建 Drizzle 客户端并注入到上下文中
 * 避免在每个路由处理器中重复创建客户端
 */
export const databaseMiddleware: MiddlewareHandler = async (c, next) => {
    // 创建数据库客户端
    const db = createDrizzleClient(c.env.DB);

    // 将客户端注入到上下文变量中
    c.set('db', db);

    // 继续处理请求
    await next();
};
