// JWT 认证中间件 - 统一管理 JWT 验证逻辑
// JWT Authentication Middleware - Unified JWT verification logic

import { MiddlewareHandler, Context } from 'hono';
import { jwt } from 'hono/jwt';
import { getSiteConfig } from '../db/operations/config';

export interface JWTMiddlewareOptions {
    /**
     * 是否允许从 URL 查询参数中获取 token (例如: ?token=xxx)
     * 默认: false
     */
    allowTokenInQuery?: boolean;

    /**
     * 自定义 401 未授权响应
     * 如果提供,将使用此函数生成响应而不是默认的 401 错误
     */
    customUnauthorizedResponse?: (c: Context) => Response;
}

/**
 * 创建 JWT 中间件
 *
 * 功能:
 * - 从数据库获取 jwt_secret,fallback 到环境变量
 * - 支持从 Authorization header 获取 token
 * - 可选支持从 URL 参数获取 token
 * - 可选自定义 401 响应页面
 *
 * @param options - 中间件配置选项
 * @returns Hono 中间件处理器
 */
export function createJWTMiddleware(options: JWTMiddlewareOptions = {}): MiddlewareHandler {
    const { allowTokenInQuery = false, customUnauthorizedResponse } = options;

    return async (c, next) => {
        try {
            const db = c.get('db');
            const config = await getSiteConfig(db, 'jwt_secret');
            const secretKey = config?.value || c.env.JWT_SECRET as string;

            // 如果需要自定义 token 提取或 401 响应,使用手动验证
            if (allowTokenInQuery || customUnauthorizedResponse) {
                // 1. 提取 token
                let token: string | undefined;

                // 优先从 URL 参数获取 (如果允许)
                if (allowTokenInQuery) {
                    token = c.req.query('token');
                }

                // Fallback 到 Authorization header
                if (!token) {
                    const authHeader = c.req.header('Authorization');
                    if (authHeader && authHeader.startsWith('Bearer ')) {
                        token = authHeader.substring(7);
                    }
                }

                // 2. 验证 token
                if (!token) {
                    return customUnauthorizedResponse
                        ? customUnauthorizedResponse(c)
                        : c.text('Unauthorized', 401);
                }

                // 3. 手动验证 JWT
                const { verify } = await import('hono/jwt');
                try {
                    const payload = await verify(token, secretKey);
                    // 将 payload 设置到上下文中供后续处理器使用
                    c.set('jwtPayload', payload);
                    return await next();
                } catch (error) {
                    console.error('JWT verification failed:', error);
                    return customUnauthorizedResponse
                        ? customUnauthorizedResponse(c)
                        : c.text('Unauthorized', 401);
                }
            }

            // 使用标准的 Hono JWT 中间件 (仅支持 Authorization header)
            const jwtMiddleware = jwt({
                secret: secretKey,
            });
            return jwtMiddleware(c, next);

        } catch (error) {
            console.error('JWT middleware error:', error);
            // Fallback 到环境变量
            const secretKey = c.env.JWT_SECRET as string;

            if (customUnauthorizedResponse) {
                // 使用手动验证以支持自定义响应
                let token: string | undefined;
                if (allowTokenInQuery) {
                    token = c.req.query('token');
                }
                if (!token) {
                    const authHeader = c.req.header('Authorization');
                    if (authHeader && authHeader.startsWith('Bearer ')) {
                        token = authHeader.substring(7);
                    }
                }

                if (!token) {
                    return customUnauthorizedResponse(c);
                }

                const { verify } = await import('hono/jwt');
                try {
                    const payload = await verify(token, secretKey);
                    c.set('jwtPayload', payload);
                    return await next();
                } catch (verifyError) {
                    console.error('JWT verification failed:', verifyError);
                    return customUnauthorizedResponse(c);
                }
            }

            // 使用标准 JWT 中间件作为 fallback
            const jwtMiddleware = jwt({
                secret: secretKey,
            });
            return jwtMiddleware(c, next);
        }
    };
}
