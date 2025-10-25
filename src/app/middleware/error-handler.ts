// 错误处理中间件
// Error Handler Middleware - 统一错误处理和日志记录

import { Context, MiddlewareHandler } from 'hono'
import { HTTPException } from 'hono/http-exception'

/**
 * 错误类型
 */
export class AppError extends Error {
    constructor(
        message: string,
        public statusCode: number = 500,
        public code?: string
    ) {
        super(message)
        this.name = 'AppError'
    }
}

/**
 * 数据库错误
 */
export class DatabaseError extends AppError {
    constructor(message: string, originalError?: Error) {
        super(message, 500, 'DATABASE_ERROR')
        this.name = 'DatabaseError'
        if (originalError) {
            this.stack = originalError.stack
        }
    }
}

/**
 * 验证错误
 */
export class ValidationError extends AppError {
    constructor(message: string, public fields?: Record<string, string>) {
        super(message, 400, 'VALIDATION_ERROR')
        this.name = 'ValidationError'
    }
}

/**
 * 未找到错误
 */
export class NotFoundError extends AppError {
    constructor(resource: string) {
        super(`${resource} not found`, 404, 'NOT_FOUND')
        this.name = 'NotFoundError'
    }
}

/**
 * 未授权错误
 */
export class UnauthorizedError extends AppError {
    constructor(message: string = 'Unauthorized') {
        super(message, 401, 'UNAUTHORIZED')
        this.name = 'UnauthorizedError'
    }
}

/**
 * 格式化错误响应
 */
function formatErrorResponse(
    error: Error,
    isDevelopment: boolean = false
): {
    success: false
    error: string
    code?: string
    statusCode?: number
    details?: any
    stack?: string
} {
    const response: any = {
        success: false,
        error: error.message || 'Internal Server Error'
    }

    // 如果是自定义错误,添加更多信息
    if (error instanceof AppError) {
        response.code = error.code
        response.statusCode = error.statusCode

        // 验证错误的字段详情
        if (error instanceof ValidationError && error.fields) {
            response.fields = error.fields
        }
    }

    // 开发环境下返回堆栈信息
    if (isDevelopment) {
        response.stack = error.stack
    }

    return response
}

/**
 * 错误日志记录
 */
function logError(error: Error, c: Context) {
    const timestamp = new Date().toISOString()
    const method = c.req.method
    const path = c.req.path
    const statusCode = error instanceof AppError ? error.statusCode : 500

    console.error(`[${timestamp}] ${method} ${path} - ${statusCode}`)
    console.error(`Error: ${error.message}`)

    // 记录堆栈信息(除非是预期的客户端错误)
    if (!(error instanceof AppError) || error.statusCode >= 500) {
        console.error(error.stack)
    }
}

/**
 * 错误处理中间件
 *
 * 捕获所有未处理的错误,记录日志并返回友好的错误响应
 *
 * 使用方法:
 * ```typescript
 * app.onError(errorHandler)
 * ```
 */
export function errorHandler(err: Error, c: Context): Response {
    // 记录错误
    logError(err, c)

    // 判断是否为开发环境
    const isDevelopment = c.env?.ENVIRONMENT === 'development'

    // 处理 Hono HTTPException
    if (err instanceof HTTPException) {
        return c.json(
            {
                success: false,
                error: err.message,
                statusCode: err.status
            },
            err.status
        )
    }

    // 处理自定义应用错误
    if (err instanceof AppError) {
        return c.json(
            formatErrorResponse(err, isDevelopment),
            err.statusCode as any
        )
    }

    // 处理未知错误
    return c.json(
        formatErrorResponse(
            new Error(isDevelopment ? err.message : 'Internal Server Error'),
            isDevelopment
        ),
        500
    )
}

/**
 * 异步错误包装中间件
 *
 * 包装路由处理器,自动捕获异步错误
 *
 * 使用方法:
 * ```typescript
 * app.get('/path', asyncErrorHandler(async (c) => {
 *     // 异步操作
 *     throw new AppError('Something went wrong')
 * }))
 * ```
 */
export function asyncErrorHandler(
    handler: (c: Context, next: any) => Promise<Response | void>
): MiddlewareHandler {
    return async (c, next) => {
        try {
            return await handler(c, next)
        } catch (error) {
            // 将错误传递给错误处理中间件
            throw error
        }
    }
}

/**
 * 404 处理中间件
 *
 * 处理未匹配的路由
 */
export function notFoundHandler(c: Context): Response {
    return c.json(
        {
            success: false,
            error: 'Not Found',
            code: 'NOT_FOUND',
            path: c.req.path
        },
        404
    )
}
