import type { DrizzleDB } from '../client';

/**
 * 迁移参数定义类型
 */
export type MigrationParameterType = 'string' | 'number' | 'boolean' | 'url';

/**
 * 迁移参数定义
 */
export interface MigrationParameterDefinition {
    /** 参数名称 */
    name: string;

    /** 参数类型 */
    type: MigrationParameterType;

    /** 参数描述 */
    description: string;

    /** 是否必需 */
    required?: boolean;

    /** 默认值 */
    defaultValue?: string | number | boolean;

    /** 验证规则 */
    validation?: {
        /** 最小值/最小长度 */
        min?: number;
        /** 最大值/最大长度 */
        max?: number;
        /** 正则表达式模式 */
        pattern?: string;
        /** 枚举值 */
        enum?: (string | number)[];
    };
}

/**
 * 迁移参数值
 */
export interface MigrationParameters {
    [key: string]: string | number | boolean;
}

/**
 * 迁移脚本接口
 * 所有迁移文件必须导出符合此接口的对象
 */
export interface Migration {
    /** 版本号，必须与文件名序号一致 */
    version: number;

    /** 迁移描述 */
    description: string;

    /** 参数定义（可选） */
    parameters?: MigrationParameterDefinition[];

    /** 正向迁移函数 */
    up: (db: DrizzleDB, params?: MigrationParameters) => Promise<void>;

    /** 回滚函数 */
    down: (db: DrizzleDB, params?: MigrationParameters) => Promise<void>;
}

/**
 * 迁移状态类型
 */
export type MigrationStatus =
    | 'current'    // 当前版本
    | 'available'  // 可用的迁移
    | 'pending'    // 待执行的迁移
    | 'applied';   // 已应用的迁移

/**
 * 迁移文件信息
 */
export interface MigrationInfo {
    /** 文件名 */
    fileName: string;

    /** 文件路径 */
    filePath: string;

    /** 版本号 */
    version: number;

    /** 描述 */
    description: string;

    /** 迁移状态 */
    status: MigrationStatus;

    /** 是否可以执行 */
    canExecute: boolean;

    /** 参数定义 */
    parameters?: MigrationParameterDefinition[];

    /** 错误信息（如果有） */
    error?: string;
}

/**
 * 迁移执行结果
 */
export interface MigrationResult {
    /** 是否成功 */
    success: boolean;

    /** 执行的版本号 */
    version: number;

    /** 错误信息 */
    error?: string;

    /** 执行时间（毫秒） */
    duration?: number;

    /** 详细信息 */
    details?: string;
}

/**
 * 批量迁移执行结果
 */
export interface MigrationBatchResult {
    /** 是否全部成功 */
    success: boolean;

    /** 执行前的版本 */
    fromVersion: number;

    /** 执行后的版本 */
    toVersion: number;

    /** 各个迁移的执行结果 */
    results: MigrationResult[];

    /** 总错误信息 */
    error?: string;

    /** 总执行时间（毫秒） */
    totalDuration: number;
}

/**
 * 迁移系统状态
 */
export interface MigrationSystemStatus {
    /** 当前数据库版本 */
    currentVersion: number;

    /** 最新可用版本 */
    latestVersion: number;

    /** 待执行的迁移数量 */
    pendingCount: number;

    /** 所有迁移信息 */
    migrations: MigrationInfo[];

    /** 是否需要迁移 */
    needsMigration: boolean;

    /** 系统状态 */
    status: 'up-to-date' | 'pending-migrations' | 'error';

    /** 错误信息 */
    error?: string;
}

/**
 * 迁移执行选项
 */
export interface MigrationExecuteOptions {
    /** 目标版本（如果不指定，则迁移到最新版本） */
    targetVersion?: number;

    /** 是否干运行（不实际执行） */
    dryRun?: boolean;

    /** 是否强制执行（忽略错误继续） */
    force?: boolean;

    /** 批量大小 */
    batchSize?: number;

    /** 迁移参数 */
    parameters?: Record<number, MigrationParameters>;
}

/**
 * 迁移文件验证结果
 */
export interface MigrationValidationResult {
    /** 是否有效 */
    isValid: boolean;

    /** 错误信息 */
    errors: string[];

    /** 警告信息 */
    warnings: string[];

    /** 验证的迁移信息 */
    migration?: MigrationInfo;
}

/**
 * 参数验证结果
 */
export interface ParameterValidationResult {
    /** 是否有效 */
    isValid: boolean;

    /** 错误信息 */
    errors: string[];

    /** 处理后的参数值 */
    processedValues?: MigrationParameters;
}

/**
 * 迁移参数需求
 */
export interface MigrationParameterRequirement {
    /** 迁移版本 */
    version: number;

    /** 迁移描述 */
    description: string;

    /** 参数定义 */
    parameters: MigrationParameterDefinition[];
}

/**
 * 批量迁移的参数需求检查结果
 */
export interface BatchParameterRequirements {
    /** 需要参数的迁移列表 */
    requirementsWithParameters: MigrationParameterRequirement[];

    /** 缺失参数的迁移版本 */
    missingParameters: number[];

    /** 是否有未满足的参数需求 */
    hasUnmetRequirements: boolean;
}