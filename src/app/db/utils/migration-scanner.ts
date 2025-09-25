import type { Migration, MigrationInfo, MigrationValidationResult } from '../types/migration';
import { getCurrentDbVersion } from '../operations/config';
import type { DrizzleDB } from '../client';

/**
 * 迁移文件扫描器
 *
 * 注意：在 Cloudflare Workers 环境中，传统的文件系统访问不可用
 * 这个实现提供了扫描迁移文件的基础结构，实际的文件发现可能需要
 * 在构建时预生成或使用其他方式
 */

/**
 * 迁移文件名称验证正则表达式
 * 格式：001_description.ts
 */
const MIGRATION_FILE_PATTERN = /^(\d{3})_(.+)\.ts$/;

/**
 * 从文件名提取版本号和描述
 */
export function parseMigrationFileName(fileName: string): { version: number; description: string } | null {
    const match = fileName.match(MIGRATION_FILE_PATTERN);
    if (!match) {
        return null;
    }

    const [, versionStr, description] = match;
    const version = parseInt(versionStr, 10);

    if (isNaN(version) || version <= 0) {
        return null;
    }

    return {
        version,
        description: description.replace(/_/g, ' ')
    };
}

/**
 * 验证迁移文件格式
 */
export function validateMigrationFileName(fileName: string): MigrationValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 检查文件名格式
    if (!MIGRATION_FILE_PATTERN.test(fileName)) {
        errors.push(`文件名格式无效: ${fileName}。应该使用格式: 001_description.ts`);
        return { isValid: false, errors, warnings };
    }

    const parsed = parseMigrationFileName(fileName);
    if (!parsed) {
        errors.push(`无法解析文件名: ${fileName}`);
        return { isValid: false, errors, warnings };
    }

    // 检查版本号
    if (parsed.version <= 0) {
        errors.push(`版本号必须大于0: ${parsed.version}`);
    }

    // 检查描述
    if (!parsed.description || parsed.description.trim().length === 0) {
        warnings.push(`建议提供有意义的描述: ${fileName}`);
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings
    };
}

/**
 * 动态导入迁移模块
 *
 * 在 Cloudflare Workers 中，我们使用动态 import() 来加载迁移文件
 */
export async function loadMigrationModule(fileName: string): Promise<Migration | null> {
    try {
        // 构建模块路径
        const modulePath = `../../../migrations/${fileName}`;

        // 动态导入模块
        const module = await import(modulePath);

        // 验证模块导出
        if (typeof module.version !== 'number') {
            throw new Error(`Missing or invalid version export in ${fileName}`);
        }

        if (typeof module.description !== 'string') {
            throw new Error(`Missing or invalid description export in ${fileName}`);
        }

        if (typeof module.up !== 'function') {
            throw new Error(`Missing or invalid up function in ${fileName}`);
        }

        if (typeof module.down !== 'function') {
            throw new Error(`Missing or invalid down function in ${fileName}`);
        }

        // 验证版本号与文件名一致
        const parsed = parseMigrationFileName(fileName);
        if (parsed && parsed.version !== module.version) {
            throw new Error(
                `Version mismatch in ${fileName}: file suggests ${parsed.version}, module exports ${module.version}`
            );
        }

        return {
            version: module.version,
            description: module.description,
            parameters: module.parameters || undefined,
            up: module.up,
            down: module.down
        };
    } catch (error) {
        console.error(`Failed to load migration ${fileName}:`, error);
        return null;
    }
}

/**
 * 验证迁移模块
 */
export async function validateMigrationModule(
    fileName: string,
    migration: Migration
): Promise<MigrationValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 验证版本号
    if (!Number.isInteger(migration.version) || migration.version <= 0) {
        errors.push(`Invalid version number: ${migration.version}`);
    }

    // 验证描述
    if (!migration.description || migration.description.trim().length === 0) {
        warnings.push('Empty or missing description');
    }

    // 验证函数
    if (typeof migration.up !== 'function') {
        errors.push('Missing or invalid up function');
    }

    if (typeof migration.down !== 'function') {
        errors.push('Missing or invalid down function');
    }

    // 验证参数定义（如果存在）
    if (migration.parameters) {
        if (!Array.isArray(migration.parameters)) {
            errors.push('Parameters must be an array');
        } else {
            migration.parameters.forEach((param, index) => {
                if (!param.name || typeof param.name !== 'string') {
                    errors.push(`Parameter ${index}: missing or invalid name`);
                }
                if (!param.type || !['string', 'number', 'boolean', 'url'].includes(param.type)) {
                    errors.push(`Parameter ${index}: invalid type "${param.type}"`);
                }
                if (!param.description || typeof param.description !== 'string') {
                    errors.push(`Parameter ${index}: missing or invalid description`);
                }
                if (param.validation) {
                    const validation = param.validation;
                    if (validation.pattern && typeof validation.pattern !== 'string') {
                        errors.push(`Parameter ${index}: validation pattern must be a string`);
                    }
                    if (validation.enum && !Array.isArray(validation.enum)) {
                        errors.push(`Parameter ${index}: validation enum must be an array`);
                    }
                }
            });
        }
    }

    // 验证版本号与文件名一致性
    const parsed = parseMigrationFileName(fileName);
    if (parsed && parsed.version !== migration.version) {
        errors.push(
            `Version mismatch: filename suggests ${parsed.version}, module exports ${migration.version}`
        );
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings,
        migration: errors.length === 0 ? {
            fileName,
            filePath: fileName,
            version: migration.version,
            description: migration.description,
            parameters: migration.parameters,
            status: 'available',
            canExecute: true
        } : undefined
    };
}

/**
 * 扫描迁移文件
 *
 * 注意：这是一个基础实现。在 Cloudflare Workers 环境中，
 * 可能需要预先注册迁移文件列表或使用构建时生成的索引
 */
export async function scanMigrationFiles(
    db: DrizzleDB,
    migrationFileList?: string[]
): Promise<MigrationInfo[]> {
    const migrations: MigrationInfo[] = [];
    const currentVersion = await getCurrentDbVersion(db);

    // 如果提供了文件列表，使用它；否则使用预定义的列表
    const fileList = migrationFileList || getKnownMigrationFiles();

    for (const fileName of fileList) {
        // 跳过非TypeScript文件和模板文件
        if (!fileName.endsWith('.ts') || fileName.startsWith('_')) {
            continue;
        }

        // 验证文件名
        const nameValidation = validateMigrationFileName(fileName);
        if (!nameValidation.isValid) {
            migrations.push({
                fileName,
                filePath: fileName,
                version: 0,
                description: '无效的文件名',
                status: 'available',
                canExecute: false,
                error: nameValidation.errors.join('; ')
            });
            continue;
        }

        try {
            // 加载迁移模块
            const migration = await loadMigrationModule(fileName);
            if (!migration) {
                migrations.push({
                    fileName,
                    filePath: fileName,
                    version: 0,
                    description: '无法加载模块',
                    status: 'available',
                    canExecute: false,
                    error: '模块加载失败'
                });
                continue;
            }

            // 验证模块
            const moduleValidation = await validateMigrationModule(fileName, migration);
            if (!moduleValidation.isValid) {
                migrations.push({
                    fileName,
                    filePath: fileName,
                    version: migration.version,
                    description: migration.description,
                    status: 'available',
                    canExecute: false,
                    error: moduleValidation.errors.join('; ')
                });
                continue;
            }

            // 确定迁移状态
            let status: MigrationInfo['status'];
            if (migration.version === currentVersion) {
                status = 'current';
            } else if (migration.version < currentVersion) {
                status = 'applied';
            } else {
                status = 'pending';
            }

            migrations.push({
                fileName,
                filePath: fileName,
                version: migration.version,
                description: migration.description,
                parameters: migration.parameters,
                status,
                canExecute: true
            });
        } catch (error) {
            migrations.push({
                fileName,
                filePath: fileName,
                version: 0,
                description: '处理错误',
                status: 'available',
                canExecute: false,
                error: error instanceof Error ? error.message : String(error)
            });
        }
    }

    // 按版本号排序
    migrations.sort((a, b) => a.version - b.version);

    return migrations;
}

/**
 * 获取已知的迁移文件列表
 *
 * 在实际实现中，这个列表可能需要在构建时生成，
 * 或者通过其他方式动态维护
 */
function getKnownMigrationFiles(): string[] {
    // 这里可以返回一个预定义的文件列表
    // 在构建过程中，可以通过脚本扫描 src/migrations 目录
    // 并生成这个列表

    return [
        // 示例文件 - 实际实现中应该动态生成
        // '001_example.ts',
        // '002_another_migration.ts',
    ];
}

/**
 * 获取待执行的迁移
 */
export async function getPendingMigrations(db: DrizzleDB): Promise<MigrationInfo[]> {
    const allMigrations = await scanMigrationFiles(db);
    return allMigrations.filter(migration =>
        migration.status === 'pending' && migration.canExecute
    );
}

/**
 * 获取特定版本的迁移信息
 */
export async function getMigrationByVersion(
    db: DrizzleDB,
    version: number
): Promise<MigrationInfo | null> {
    const allMigrations = await scanMigrationFiles(db);
    return allMigrations.find(migration => migration.version === version) || null;
}

/**
 * 检查迁移序列的连续性
 */
export function validateMigrationSequence(migrations: MigrationInfo[]): {
    isValid: boolean;
    errors: string[];
} {
    const errors: string[] = [];
    const validMigrations = migrations.filter(m => m.canExecute);

    if (validMigrations.length === 0) {
        return { isValid: true, errors: [] };
    }

    // 检查版本号连续性
    const versions = validMigrations.map(m => m.version).sort((a, b) => a - b);

    for (let i = 0; i < versions.length - 1; i++) {
        if (versions[i + 1] - versions[i] !== 1) {
            errors.push(`Migration sequence gap: missing version ${versions[i] + 1}`);
        }
    }

    // 检查重复版本
    const uniqueVersions = new Set(versions);
    if (uniqueVersions.size !== versions.length) {
        errors.push('Duplicate migration versions found');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * 检查批量迁移的参数需求
 */
export async function checkBatchParameterRequirements(
    db: DrizzleDB,
    targetVersion?: number
): Promise<import('../types/migration').BatchParameterRequirements> {
    const pendingMigrations = await getPendingMigrations(db);

    // 如果指定了目标版本，则过滤迁移
    const migrationsToCheck = targetVersion
        ? pendingMigrations.filter(m => m.version <= targetVersion)
        : pendingMigrations;

    const requirementsWithParameters: import('../types/migration').MigrationParameterRequirement[] = [];

    for (const migration of migrationsToCheck) {
        if (migration.parameters && migration.parameters.length > 0) {
            requirementsWithParameters.push({
                version: migration.version,
                description: migration.description,
                parameters: migration.parameters
            });
        }
    }

    return {
        requirementsWithParameters,
        missingParameters: requirementsWithParameters.map(r => r.version),
        hasUnmetRequirements: requirementsWithParameters.length > 0
    };
}

/**
 * 验证用户提供的参数
 */
export function validateMigrationParameters(
    parameterDefinitions: import('../types/migration').MigrationParameterDefinition[],
    userParameters: import('../types/migration').MigrationParameters
): import('../types/migration').ParameterValidationResult {
    const errors: string[] = [];
    const processedValues: import('../types/migration').MigrationParameters = {};

    for (const paramDef of parameterDefinitions) {
        const userValue = userParameters[paramDef.name];

        // 检查必需参数
        if (paramDef.required && (userValue === undefined || userValue === null || userValue === '')) {
            errors.push(`Required parameter "${paramDef.name}" is missing`);
            continue;
        }

        // 如果值为空且不是必需参数，使用默认值或跳过
        if (userValue === undefined || userValue === null || userValue === '') {
            if (paramDef.defaultValue !== undefined) {
                processedValues[paramDef.name] = paramDef.defaultValue;
            }
            continue;
        }

        // 类型转换和验证
        let processedValue: string | number | boolean;

        try {
            switch (paramDef.type) {
                case 'string':
                case 'url':
                    processedValue = String(userValue);
                    break;
                case 'number':
                    processedValue = Number(userValue);
                    if (isNaN(processedValue)) {
                        errors.push(`Parameter "${paramDef.name}" must be a valid number`);
                        continue;
                    }
                    break;
                case 'boolean':
                    if (typeof userValue === 'boolean') {
                        processedValue = userValue;
                    } else {
                        const strValue = String(userValue).toLowerCase();
                        processedValue = strValue === 'true' || strValue === '1';
                    }
                    break;
                default:
                    errors.push(`Parameter "${paramDef.name}" has unknown type "${paramDef.type}"`);
                    continue;
            }

            // 验证规则
            if (paramDef.validation) {
                const validation = paramDef.validation;

                // 字符串长度或数值范围验证
                if (validation.min !== undefined) {
                    if (paramDef.type === 'string' || paramDef.type === 'url') {
                        if (String(processedValue).length < validation.min) {
                            errors.push(`Parameter "${paramDef.name}" must be at least ${validation.min} characters long`);
                        }
                    } else if (paramDef.type === 'number') {
                        if (Number(processedValue) < validation.min) {
                            errors.push(`Parameter "${paramDef.name}" must be at least ${validation.min}`);
                        }
                    }
                }

                if (validation.max !== undefined) {
                    if (paramDef.type === 'string' || paramDef.type === 'url') {
                        if (String(processedValue).length > validation.max) {
                            errors.push(`Parameter "${paramDef.name}" must be at most ${validation.max} characters long`);
                        }
                    } else if (paramDef.type === 'number') {
                        if (Number(processedValue) > validation.max) {
                            errors.push(`Parameter "${paramDef.name}" must be at most ${validation.max}`);
                        }
                    }
                }

                // 正则表达式验证
                if (validation.pattern && (paramDef.type === 'string' || paramDef.type === 'url')) {
                    const regex = new RegExp(validation.pattern);
                    if (!regex.test(String(processedValue))) {
                        errors.push(`Parameter "${paramDef.name}" does not match required pattern`);
                    }
                }

                // 枚举值验证
                if (validation.enum) {
                    // 对于 boolean 类型，转换为字符串进行枚举检查
                    const valueToCheck = paramDef.type === 'boolean'
                        ? String(processedValue)
                        : processedValue as string | number;

                    if (!validation.enum.includes(valueToCheck)) {
                        errors.push(`Parameter "${paramDef.name}" must be one of: ${validation.enum.join(', ')}`);
                    }
                }

                // URL 特定验证
                if (paramDef.type === 'url') {
                    try {
                        new URL(String(processedValue));
                    } catch {
                        errors.push(`Parameter "${paramDef.name}" must be a valid URL`);
                    }
                }
            }

            processedValues[paramDef.name] = processedValue;
        } catch (error) {
            errors.push(`Failed to process parameter "${paramDef.name}": ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    return {
        isValid: errors.length === 0,
        errors,
        processedValues: errors.length === 0 ? processedValues : undefined
    };
}