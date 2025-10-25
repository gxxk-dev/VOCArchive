import { nanoid } from 'nanoid';

/**
 * Index 工具函数
 *
 * 提供 index 生成、验证和清理功能
 */

// SQL 关键字和 JavaScript 保留字黑名单
const RESERVED_KEYWORDS = new Set([
    'select', 'insert', 'update', 'delete', 'drop', 'create', 'alter', 'table',
    'from', 'where', 'join', 'and', 'or', 'not', 'null', 'true', 'false',
    'function', 'var', 'let', 'const', 'class', 'return', 'if', 'else', 'for',
    'while', 'do', 'switch', 'case', 'break', 'continue', 'try', 'catch'
]);

/**
 * 生成新的 index（使用 Nano ID）
 * @param length - index 长度，默认 8 字符
 * @returns 生成的 index
 */
export function generateIndex(length: number = 8): string {
    return nanoid(length);
}

/**
 * 验证 index 格式
 * @param index - 要验证的 index
 * @returns 验证结果对象
 */
export function validateIndex(index: string): { valid: boolean; error?: string } {
    // 检查是否为空
    if (!index || typeof index !== 'string') {
        return { valid: false, error: 'Index cannot be empty' };
    }

    // 检查长度
    if (index.length < 1 || index.length > 64) {
        return { valid: false, error: 'Index length must be between 1 and 64 characters' };
    }

    // 检查字符（只允许字母、数字、连字符、下划线）
    const validPattern = /^[a-zA-Z0-9_-]+$/;
    if (!validPattern.test(index)) {
        return { valid: false, error: 'Index can only contain letters, numbers, hyphens, and underscores' };
    }

    // 检查是否是保留关键字（不区分大小写）
    if (RESERVED_KEYWORDS.has(index.toLowerCase())) {
        return { valid: false, error: 'Index cannot be a reserved keyword' };
    }

    // 检查是否全是数字（避免与 ID 混淆）
    if (/^\d+$/.test(index)) {
        return { valid: false, error: 'Index cannot be all numeric' };
    }

    return { valid: true };
}

/**
 * 清理和标准化 index
 * @param index - 原始 index
 * @returns 清理后的 index
 */
export function sanitizeIndex(index: string): string {
    if (!index) return '';

    // 移除首尾空白
    let cleaned = index.trim();

    // 移除或替换不允许的字符
    cleaned = cleaned.replace(/[^a-zA-Z0-9_-]/g, '-');

    // 移除连续的连字符
    cleaned = cleaned.replace(/-+/g, '-');

    // 移除首尾的连字符
    cleaned = cleaned.replace(/^-+|-+$/g, '');

    // 限制长度
    if (cleaned.length > 64) {
        cleaned = cleaned.substring(0, 64);
    }

    return cleaned;
}

/**
 * 检查 index 是否为 UUID 格式（用于向后兼容）
 * @param index - 要检查的 index
 * @returns 是否为 UUID 格式
 */
export function isUUIDFormat(index: string): boolean {
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidPattern.test(index);
}

/**
 * 生成唯一性检查函数（用于数据库）
 * @param existingIndices - 已存在的 indices 集合
 * @returns 检查唯一性的函数
 */
export function createUniquenessChecker(existingIndices: Set<string>) {
    return (index: string): boolean => {
        return !existingIndices.has(index.toLowerCase());
    };
}
