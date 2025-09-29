import { Hono } from 'hono';
import { createDrizzleClient } from '../db/client';
import {
    checkPendingMigrations,
    executeMigrations,
    rollbackToVersion,
    validateMigrationSystem,
    getParameterRequirements
} from '../db/utils/migration-engine';
import { getCurrentDbVersion } from '../db/operations/config';
import type { MigrationExecuteOptions, MigrationParameters } from '../db/types';

/**
 * 迁移管理 API 路由
 *
 * 提供完整的数据库迁移管理接口：
 * - GET /status - 获取迁移系统状态
 * - GET /current-version - 获取当前数据库版本
 * - GET /parameter-requirements - 获取参数需求
 * - POST /execute - 执行迁移
 * - POST /rollback - 回滚到指定版本
 * - POST /validate - 验证迁移系统完整性
 *
 * 所有路由都需要 JWT 认证
 */

// 请求体接口定义
interface ExecuteMigrationRequest {
    targetVersion?: number;
    dryRun?: boolean;
    force?: boolean;
    batchSize?: number;
    parameters?: Record<number, MigrationParameters>;
}

interface RollbackRequest {
    targetVersion: number;
    dryRun?: boolean;
    force?: boolean;
    parameters?: Record<number, MigrationParameters>;
}

export const migration = new Hono<{ Bindings: Cloudflare.Env }>();

/**
 * GET /api/migration/status
 * 获取迁移系统状态
 */
migration.get('/status', async (c) => {
    try {
        const db = createDrizzleClient(c.env.DB);
        const status = await checkPendingMigrations(db);

        return c.json({
            success: true,
            data: status
        });
    } catch (error) {
        console.error('Failed to get migration status:', error);
        return c.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, 500);
    }
});

/**
 * GET /api/migration/current-version
 * 获取当前数据库版本
 */
migration.get('/current-version', async (c) => {
    try {
        const db = createDrizzleClient(c.env.DB);
        const currentVersion = await getCurrentDbVersion(db);

        return c.json({
            success: true,
            data: {
                version: currentVersion
            }
        });
    } catch (error) {
        console.error('Failed to get current version:', error);
        return c.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, 500);
    }
});

/**
 * GET /api/migration/parameter-requirements
 * 获取迁移参数需求
 */
migration.get('/parameter-requirements', async (c) => {
    try {
        const db = createDrizzleClient(c.env.DB);
        const targetVersion = c.req.query('targetVersion');

        const requirements = await getParameterRequirements(
            db,
            targetVersion ? parseInt(targetVersion, 10) : undefined
        );

        return c.json({
            success: true,
            data: requirements,
            message: requirements.hasUnmetRequirements
                ? `Found ${requirements.requirementsWithParameters.length} migrations requiring parameters`
                : 'No parameter requirements found'
        });
    } catch (error) {
        console.error('Failed to get parameter requirements:', error);
        return c.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, 500);
    }
});

/**
 * POST /api/migration/execute
 * 执行数据库迁移
 */
migration.post('/execute', async (c) => {
    try {
        const body: ExecuteMigrationRequest = await c.req.json();
        const db = createDrizzleClient(c.env.DB);

        // 构建执行选项
        const options: MigrationExecuteOptions = {
            targetVersion: body.targetVersion,
            dryRun: body.dryRun || false,
            force: body.force || false,
            batchSize: body.batchSize || 50,
            parameters: body.parameters
        };

        // 执行迁移
        const result = await executeMigrations(db, options);

        if (result.success) {
            return c.json({
                success: true,
                data: result,
                message: options.dryRun
                    ? 'Dry run completed successfully'
                    : `Migration completed: ${result.fromVersion} → ${result.toVersion}`
            });
        } else {
            return c.json({
                success: false,
                data: result,
                error: result.error || 'Migration failed'
            }, 400);
        }
    } catch (error) {
        console.error('Migration execution failed:', error);
        return c.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, 500);
    }
});

/**
 * POST /api/migration/rollback
 * 回滚到指定版本
 */
migration.post('/rollback', async (c) => {
    try {
        const body: RollbackRequest = await c.req.json();

        if (typeof body.targetVersion !== 'number' || body.targetVersion < 0) {
            return c.json({
                success: false,
                error: 'Invalid target version. Must be a non-negative number.'
            }, 400);
        }

        const db = createDrizzleClient(c.env.DB);

        // 构建执行选项
        const options: MigrationExecuteOptions = {
            dryRun: body.dryRun || false,
            force: body.force || false,
            parameters: body.parameters
        };

        // 执行回滚
        const result = await rollbackToVersion(db, body.targetVersion, options);

        if (result.success) {
            return c.json({
                success: true,
                data: result,
                message: options.dryRun
                    ? 'Dry run rollback completed successfully'
                    : `Rollback completed: ${result.fromVersion} → ${result.toVersion}`
            });
        } else {
            return c.json({
                success: false,
                data: result,
                error: result.error || 'Rollback failed'
            }, 400);
        }
    } catch (error) {
        console.error('Rollback execution failed:', error);
        return c.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, 500);
    }
});

/**
 * POST /api/migration/validate
 * 验证迁移系统完整性
 */
migration.post('/validate', async (c) => {
    try {
        const db = createDrizzleClient(c.env.DB);
        const validation = await validateMigrationSystem(db);

        return c.json({
            success: validation.isValid,
            data: {
                isValid: validation.isValid,
                errors: validation.errors,
                warnings: validation.warnings,
                status: validation.status
            },
            message: validation.isValid
                ? 'Migration system validation passed'
                : 'Migration system validation failed'
        });
    } catch (error) {
        console.error('Migration validation failed:', error);
        return c.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, 500);
    }
});

/**
 * 错误处理中间件
 */
migration.onError((err, c) => {
    console.error('Migration API error:', err);
    return c.json({
        success: false,
        error: 'Internal server error'
    }, 500);
});

/**
 * 404 处理
 */
migration.notFound((c) => {
    return c.json({
        success: false,
        error: 'Migration endpoint not found'
    }, 404);
});