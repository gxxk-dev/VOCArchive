import type { DrizzleDB } from '../client';
import type {
    Migration,
    MigrationInfo,
    MigrationResult,
    MigrationBatchResult,
    MigrationSystemStatus,
    MigrationExecuteOptions
} from '../types/migration';
import { getCurrentDbVersion, updateDbVersion } from '../operations/config';
import {
    scanMigrationFiles,
    getPendingMigrations,
    loadMigrationModule,
    validateMigrationSequence,
    checkBatchParameterRequirements,
    validateMigrationParameters
} from './migration-scanner';

/**
 * 迁移执行引擎
 *
 * 提供数据库迁移的核心执行逻辑，包括：
 * - 检查待执行迁移
 * - 执行单个迁移
 * - 批量执行迁移
 * - 错误处理和回滚
 * - 版本管理
 */

/**
 * 检查待执行的迁移
 */
export async function checkPendingMigrations(db: DrizzleDB): Promise<MigrationSystemStatus> {
    try {
        const currentVersion = await getCurrentDbVersion(db);
        const allMigrations = await scanMigrationFiles(db);
        const pendingMigrations = allMigrations.filter(m => m.status === 'pending' && m.canExecute);

        // 验证迁移序列
        const sequenceValidation = validateMigrationSequence(allMigrations);
        if (!sequenceValidation.isValid) {
            return {
                currentVersion,
                latestVersion: currentVersion,
                pendingCount: 0,
                migrations: allMigrations,
                needsMigration: false,
                status: 'error',
                error: `Migration sequence errors: ${sequenceValidation.errors.join('; ')}`
            };
        }

        const validMigrations = allMigrations.filter(m => m.canExecute);
        const latestVersion = validMigrations.length > 0
            ? Math.max(...validMigrations.map(m => m.version))
            : currentVersion;

        return {
            currentVersion,
            latestVersion,
            pendingCount: pendingMigrations.length,
            migrations: allMigrations,
            needsMigration: pendingMigrations.length > 0,
            status: pendingMigrations.length > 0 ? 'pending-migrations' : 'up-to-date'
        };
    } catch (error) {
        const currentVersion = await getCurrentDbVersion(db);
        return {
            currentVersion,
            latestVersion: currentVersion,
            pendingCount: 0,
            migrations: [],
            needsMigration: false,
            status: 'error',
            error: error instanceof Error ? error.message : String(error)
        };
    }
}

/**
 * 执行单个迁移
 */
export async function executeMigration(
    db: DrizzleDB,
    migration: MigrationInfo,
    options: MigrationExecuteOptions = {}
): Promise<MigrationResult> {
    const startTime = Date.now();

    try {
        // 验证迁移可以执行
        if (!migration.canExecute) {
            throw new Error(`Migration ${migration.version} cannot be executed: ${migration.error || 'Unknown error'}`);
        }

        // 加载迁移模块
        const migrationModule = await loadMigrationModule(migration.fileName);
        if (!migrationModule) {
            throw new Error(`Failed to load migration module: ${migration.fileName}`);
        }

        // 检查当前版本
        const currentVersion = await getCurrentDbVersion(db);
        if (migration.version <= currentVersion) {
            throw new Error(`Migration ${migration.version} is already applied (current version: ${currentVersion})`);
        }

        // 执行迁移（干运行模式）
        if (options.dryRun) {
            return {
                success: true,
                version: migration.version,
                duration: Date.now() - startTime,
                details: `Dry run successful for migration ${migration.version}: ${migration.description}`
            };
        }

        // 获取迁移所需的参数
        const migrationParameters = options.parameters?.[migration.version];

        // 验证参数（如果迁移需要参数）
        if (migration.parameters && migration.parameters.length > 0) {
            if (!migrationParameters) {
                throw new Error(`Migration ${migration.version} requires parameters but none were provided`);
            }

            const validation = validateMigrationParameters(migration.parameters, migrationParameters);
            if (!validation.isValid) {
                throw new Error(`Invalid parameters for migration ${migration.version}: ${validation.errors.join('; ')}`);
            }

            // 使用验证后的参数
            const processedParams = validation.processedValues!;

            // 执行迁移的 up 函数
            console.log(`Executing migration ${migration.version}: ${migration.description}`);

            try {
                await migrationModule.up(db, processedParams);
            } catch (upError) {
                throw new Error(`Migration up function failed: ${upError instanceof Error ? upError.message : String(upError)}`);
            }
        } else {
            // 执行迁移的 up 函数（无参数）
            console.log(`Executing migration ${migration.version}: ${migration.description}`);

            try {
                await migrationModule.up(db);
            } catch (upError) {
                throw new Error(`Migration up function failed: ${upError instanceof Error ? upError.message : String(upError)}`);
            }
        }

        // 更新数据库版本
        await updateDbVersion(db, migration.version);

        const duration = Date.now() - startTime;
        console.log(`Migration ${migration.version} completed successfully in ${duration}ms`);

        return {
            success: true,
            version: migration.version,
            duration,
            details: `Migration ${migration.version} applied successfully`
        };

    } catch (error) {
        const duration = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : String(error);

        console.error(`Migration ${migration.version} failed:`, errorMessage);

        return {
            success: false,
            version: migration.version,
            error: errorMessage,
            duration,
            details: `Migration ${migration.version} failed after ${duration}ms`
        };
    }
}

/**
 * 批量执行迁移
 */
export async function executeMigrations(
    db: DrizzleDB,
    options: MigrationExecuteOptions = {}
): Promise<MigrationBatchResult> {
    const startTime = Date.now();
    const results: MigrationResult[] = [];

    try {
        const currentVersion = await getCurrentDbVersion(db);
        const pendingMigrations = await getPendingMigrations(db);

        if (pendingMigrations.length === 0) {
            return {
                success: true,
                fromVersion: currentVersion,
                toVersion: currentVersion,
                results: [],
                totalDuration: Date.now() - startTime
            };
        }

        // 应用目标版本过滤
        let migrationsToExecute = pendingMigrations;
        if (options.targetVersion !== undefined) {
            migrationsToExecute = pendingMigrations.filter(m => m.version <= options.targetVersion!);
        }

        // 检查参数需求
        const parameterRequirements = await checkBatchParameterRequirements(db, options.targetVersion);

        if (parameterRequirements.hasUnmetRequirements) {
            const missingVersions = parameterRequirements.missingParameters;
            const providedVersions = Object.keys(options.parameters || {}).map(Number);
            const actuallyMissing = missingVersions.filter(version => !providedVersions.includes(version));

            if (actuallyMissing.length > 0) {
                const missingDetails = parameterRequirements.requirementsWithParameters
                    .filter(req => actuallyMissing.includes(req.version))
                    .map(req => `Version ${req.version}: requires parameters ${req.parameters.map(p => p.name).join(', ')}`)
                    .join('; ');

                return {
                    success: false,
                    fromVersion: currentVersion,
                    toVersion: currentVersion,
                    results: [],
                    error: `Missing required parameters for migrations: ${missingDetails}`,
                    totalDuration: Date.now() - startTime
                };
            }
        }

        // 按版本号排序
        migrationsToExecute.sort((a, b) => a.version - b.version);

        console.log(`Executing ${migrationsToExecute.length} migrations from version ${currentVersion}`);

        // 逐个执行迁移
        for (const migration of migrationsToExecute) {
            const result = await executeMigration(db, migration, options);
            results.push(result);

            if (!result.success && !options.force) {
                // 如果失败且不是强制模式，停止执行
                console.error(`Migration ${migration.version} failed, stopping execution`);
                break;
            }

            if (result.success) {
                console.log(`✓ Migration ${migration.version} completed`);
            } else {
                console.error(`✗ Migration ${migration.version} failed: ${result.error}`);
            }
        }

        const finalVersion = await getCurrentDbVersion(db);
        const allSucceeded = results.every(r => r.success);
        const totalDuration = Date.now() - startTime;

        if (allSucceeded) {
            console.log(`All migrations completed successfully. Version: ${currentVersion} → ${finalVersion}`);
        } else {
            console.warn(`Migration batch completed with errors. Version: ${currentVersion} → ${finalVersion}`);
        }

        return {
            success: allSucceeded,
            fromVersion: currentVersion,
            toVersion: finalVersion,
            results,
            totalDuration,
            error: allSucceeded ? undefined : 'Some migrations failed'
        };

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('Migration batch execution failed:', errorMessage);

        const currentVersionAfterError = await getCurrentDbVersion(db);

        return {
            success: false,
            fromVersion: currentVersionAfterError,  // May have changed during execution
            toVersion: currentVersionAfterError,
            results,
            error: errorMessage,
            totalDuration: Date.now() - startTime
        };
    }
}

/**
 * 回滚到指定版本
 */
export async function rollbackToVersion(
    db: DrizzleDB,
    targetVersion: number,
    options: MigrationExecuteOptions = {}
): Promise<MigrationBatchResult> {
    const startTime = Date.now();
    const results: MigrationResult[] = [];

    try {
        const currentVersion = await getCurrentDbVersion(db);

        if (targetVersion >= currentVersion) {
            throw new Error(`Target version ${targetVersion} must be less than current version ${currentVersion}`);
        }

        const allMigrations = await scanMigrationFiles(db);
        const migrationsToRollback = allMigrations
            .filter(m => m.version > targetVersion && m.version <= currentVersion && m.canExecute)
            .sort((a, b) => b.version - a.version); // 逆序执行回滚

        console.log(`Rolling back ${migrationsToRollback.length} migrations from version ${currentVersion} to ${targetVersion}`);

        // 逐个执行回滚
        for (const migration of migrationsToRollback) {
            const result = await rollbackMigration(db, migration, options);
            results.push(result);

            if (!result.success && !options.force) {
                console.error(`Rollback of migration ${migration.version} failed, stopping rollback`);
                break;
            }

            if (result.success) {
                console.log(`✓ Migration ${migration.version} rolled back`);
            } else {
                console.error(`✗ Rollback of migration ${migration.version} failed: ${result.error}`);
            }
        }

        const finalVersion = await getCurrentDbVersion(db);
        const allSucceeded = results.every(r => r.success);
        const totalDuration = Date.now() - startTime;

        return {
            success: allSucceeded,
            fromVersion: currentVersion,
            toVersion: finalVersion,
            results,
            totalDuration,
            error: allSucceeded ? undefined : 'Some rollbacks failed'
        };

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('Rollback execution failed:', errorMessage);

        const currentVersionAfterError = await getCurrentDbVersion(db);

        return {
            success: false,
            fromVersion: currentVersionAfterError,
            toVersion: currentVersionAfterError,
            results,
            error: errorMessage,
            totalDuration: Date.now() - startTime
        };
    }
}

/**
 * 执行单个迁移的回滚
 */
export async function rollbackMigration(
    db: DrizzleDB,
    migration: MigrationInfo,
    options: MigrationExecuteOptions = {}
): Promise<MigrationResult> {
    const startTime = Date.now();

    try {
        // 验证迁移可以回滚
        if (!migration.canExecute) {
            throw new Error(`Migration ${migration.version} cannot be rolled back: ${migration.error || 'Unknown error'}`);
        }

        // 加载迁移模块
        const migrationModule = await loadMigrationModule(migration.fileName);
        if (!migrationModule) {
            throw new Error(`Failed to load migration module: ${migration.fileName}`);
        }

        // 检查当前版本
        const currentVersion = await getCurrentDbVersion(db);
        if (migration.version > currentVersion) {
            throw new Error(`Cannot rollback migration ${migration.version}: not applied (current version: ${currentVersion})`);
        }

        // 执行回滚（干运行模式）
        if (options.dryRun) {
            return {
                success: true,
                version: migration.version,
                duration: Date.now() - startTime,
                details: `Dry run rollback successful for migration ${migration.version}: ${migration.description}`
            };
        }

        // 获取迁移所需的参数
        const migrationParameters = options.parameters?.[migration.version];

        // 验证参数（如果迁移需要参数）
        if (migration.parameters && migration.parameters.length > 0) {
            if (!migrationParameters) {
                throw new Error(`Migration ${migration.version} requires parameters but none were provided for rollback`);
            }

            const validation = validateMigrationParameters(migration.parameters, migrationParameters);
            if (!validation.isValid) {
                throw new Error(`Invalid parameters for migration ${migration.version} rollback: ${validation.errors.join('; ')}`);
            }

            // 使用验证后的参数
            const processedParams = validation.processedValues!;

            // 执行迁移的 down 函数
            console.log(`Rolling back migration ${migration.version}: ${migration.description}`);

            try {
                await migrationModule.down(db, processedParams);
            } catch (downError) {
                throw new Error(`Migration down function failed: ${downError instanceof Error ? downError.message : String(downError)}`);
            }
        } else {
            // 执行迁移的 down 函数（无参数）
            console.log(`Rolling back migration ${migration.version}: ${migration.description}`);

            try {
                await migrationModule.down(db);
            } catch (downError) {
                throw new Error(`Migration down function failed: ${downError instanceof Error ? downError.message : String(downError)}`);
            }
        }

        // 更新数据库版本到前一个版本
        const newVersion = migration.version - 1;
        await updateDbVersion(db, newVersion);

        const duration = Date.now() - startTime;
        console.log(`Migration ${migration.version} rolled back successfully in ${duration}ms`);

        return {
            success: true,
            version: migration.version,
            duration,
            details: `Migration ${migration.version} rolled back successfully`
        };

    } catch (error) {
        const duration = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : String(error);

        console.error(`Rollback of migration ${migration.version} failed:`, errorMessage);

        return {
            success: false,
            version: migration.version,
            error: errorMessage,
            duration,
            details: `Rollback of migration ${migration.version} failed after ${duration}ms`
        };
    }
}

/**
 * 验证迁移系统状态
 */
export async function validateMigrationSystem(db: DrizzleDB): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
    status: MigrationSystemStatus;
}> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
        const status = await checkPendingMigrations(db);

        // 检查系统状态
        if (status.status === 'error') {
            errors.push(status.error || 'Unknown system error');
        }

        // 检查迁移序列
        const sequenceValidation = validateMigrationSequence(status.migrations);
        if (!sequenceValidation.isValid) {
            errors.push(...sequenceValidation.errors);
        }

        // 检查不可执行的迁移
        const invalidMigrations = status.migrations.filter(m => !m.canExecute);
        if (invalidMigrations.length > 0) {
            warnings.push(`Found ${invalidMigrations.length} invalid migrations`);
            invalidMigrations.forEach(m => {
                warnings.push(`- ${m.fileName}: ${m.error || 'Unknown error'}`);
            });
        }

        // 检查版本一致性
        const appliedMigrations = status.migrations.filter(m => m.status === 'applied');
        if (appliedMigrations.length > 0) {
            const maxAppliedVersion = Math.max(...appliedMigrations.map(m => m.version));
            if (maxAppliedVersion !== status.currentVersion) {
                errors.push(`Version inconsistency: current version is ${status.currentVersion}, but max applied migration is ${maxAppliedVersion}`);
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            status
        };

    } catch (error) {
        errors.push(`Validation failed: ${error instanceof Error ? error.message : String(error)}`);

        return {
            isValid: false,
            errors,
            warnings,
            status: {
                currentVersion: 0,
                latestVersion: 0,
                pendingCount: 0,
                migrations: [],
                needsMigration: false,
                status: 'error',
                error: 'Validation failed'
            }
        };
    }
}

/**
 * 检查迁移的参数需求
 * 返回需要用户提供参数的迁移列表
 */
export async function getParameterRequirements(
    db: DrizzleDB,
    targetVersion?: number
): Promise<import('../types/migration').BatchParameterRequirements> {
    return await checkBatchParameterRequirements(db, targetVersion);
}