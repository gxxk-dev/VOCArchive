import type { ExternalSource } from '../types';

/**
 * 存储源类型处理器接口
 */
export interface StorageHandler {
    /**
     * 构建访问URL
     * @param source 外部存储源配置
     * @param fileId 文件标识符
     * @returns 完整的访问URL
     */
    buildURL(source: ExternalSource, fileId: string): string;
    
    /**
     * 验证存储源配置
     * @param source 外部存储源配置
     * @returns 验证结果
     */
    validateConfig(source: ExternalSource): boolean;
    
    /**
     * 获取存储类型名称
     */
    getTypeName(): string;
}

/**
 * 原始URL处理器 - 直接URL访问
 */
export class RawUrlHandler implements StorageHandler {
    buildURL(source: ExternalSource, fileId: string): string {
        // 支持多种占位符格式: {id}, {FILE_ID}
        let url = source.endpoint;
        if (url.includes('{FILE_ID}')) {
            url = url.replace('{FILE_ID}', fileId);
        } else if (url.includes('{id}')) {
            url = url.replace('{id}', fileId);
        } else {
            // 如果没有占位符，直接返回 fileId (用于 Direct URL Storage)
            return fileId;
        }
        
        // 检测和防止 URL 重叠
        if (fileId.startsWith('http://') || fileId.startsWith('https://')) {
            // 如果 fileId 本身就是完整 URL，检查是否会导致重复
            const baseUrl = source.endpoint.replace('{FILE_ID}', '').replace('{id}', '');
            if (fileId.startsWith(baseUrl) || (baseUrl && fileId.includes(baseUrl))) {
                console.warn(`URL overlap detected: endpoint="${source.endpoint}", fileId="${fileId}" -> using direct fileId instead`);
                return fileId;
            }
        }
        
        console.log(`Built URL: ${source.endpoint} + ${fileId} = ${url}`);
        return url;
    }
    
    validateConfig(source: ExternalSource): boolean {
        // 验证端点格式是否包含占位符或为直接替换模式
        if (!source.endpoint) {
            return false;
        }
        
        // 支持占位符模式或直接替换模式
        if (source.endpoint.includes('{FILE_ID}') || 
            source.endpoint.includes('{id}') || 
            source.endpoint === '{FILE_ID}') {
            
            // 验证是否为有效的URL格式（如果不是直接替换）
            if (source.endpoint !== '{FILE_ID}') {
                try {
                    const testUrl = source.endpoint
                        .replace('{FILE_ID}', 'test')
                        .replace('{id}', 'test');
                    new URL(testUrl);
                    return true;
                } catch {
                    return false;
                }
            }
            return true;
        }
        
        return false;
    }
    
    getTypeName(): string {
        return 'Raw URL';
    }
}

/**
 * Backblaze B2私有存储处理器
 */
export class B2Handler implements StorageHandler {
    buildURL(source: ExternalSource, fileId: string): string {
        // 支持多种占位符格式: {id}, {FILE_ID}
        let url = source.endpoint;
        if (url.includes('{FILE_ID}')) {
            url = url.replace('{FILE_ID}', fileId);
        } else if (url.includes('{id}')) {
            url = url.replace('{id}', fileId);
        } else {
            return fileId;
        }
        
        console.log(`Built B2 URL: ${source.endpoint} + ${fileId} = ${url}`);
        return url;
    }
    
    validateConfig(source: ExternalSource): boolean {
        // 验证B2端点格式
        if (!source.endpoint) {
            return false;
        }
        
        // 必须包含占位符
        if (!source.endpoint.includes('{FILE_ID}') && 
            !source.endpoint.includes('{id}')) {
            return false;
        }
        
        // 验证是否包含B2特有的域名格式
        if (!source.endpoint.includes('backblazeb2.com') && 
            !source.endpoint.includes('b2-api.')) {
            return false;
        }
        
        try {
            const testUrl = source.endpoint
                .replace('{FILE_ID}', 'test')
                .replace('{id}', 'test');
            new URL(testUrl);
            return true;
        } catch {
            return false;
        }
    }
    
    getTypeName(): string {
        return 'Backblaze B2 Private';
    }
}

/**
 * 存储处理器工厂
 */
export class StorageHandlerFactory {
    private static handlers: Map<string, StorageHandler> = new Map([
        ['raw_url', new RawUrlHandler()],
        ['private_b2', new B2Handler()],
    ]);
    
    /**
     * 根据存储类型获取处理器
     * @param storageType 存储类型
     * @returns 对应的存储处理器
     */
    static getHandler(storageType: string): StorageHandler | null {
        return this.handlers.get(storageType) || null;
    }
    
    /**
     * 获取所有支持的存储类型
     * @returns 存储类型列表
     */
    static getSupportedTypes(): string[] {
        return Array.from(this.handlers.keys());
    }
    
    /**
     * 验证存储类型是否支持
     * @param storageType 存储类型
     * @returns 是否支持
     */
    static isTypeSupported(storageType: string): boolean {
        return this.handlers.has(storageType);
    }
}

/**
 * 使用存储处理器构建URL
 * @param source 外部存储源
 * @param fileId 文件ID
 * @returns 构建的URL，如果失败返回null
 */
export function buildStorageURL(source: ExternalSource, fileId: string): string | null {
    const handler = StorageHandlerFactory.getHandler(source.type);
    if (!handler) {
        console.error(`Unsupported storage type: ${source.type}`);
        return null;
    }
    
    if (!handler.validateConfig(source)) {
        console.error(`Invalid configuration for storage type: ${source.type}`);
        return null;
    }
    
    try {
        return handler.buildURL(source, fileId);
    } catch (error) {
        console.error(`Error building URL for storage type ${source.type}:`, error);
        return null;
    }
}

/**
 * 验证存储源配置
 * @param source 外部存储源
 * @returns 验证结果和错误信息
 */
export function validateStorageSource(source: ExternalSource): { valid: boolean; error?: string } {
    if (!StorageHandlerFactory.isTypeSupported(source.type)) {
        return {
            valid: false,
            error: `Unsupported storage type: ${source.type}. Supported types: ${StorageHandlerFactory.getSupportedTypes().join(', ')}`
        };
    }
    
    const handler = StorageHandlerFactory.getHandler(source.type)!;
    if (!handler.validateConfig(source)) {
        return {
            valid: false,
            error: `Invalid configuration for ${handler.getTypeName()}`
        };
    }
    
    return { valid: true };
}