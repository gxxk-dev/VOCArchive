import type { ExternalSource, ExternalSourceApiInput } from '../types';

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
        // 支持 {ID} 占位符
        let url = source.endpoint;
        if (url.includes('{ID}')) {
            url = url.replace('{ID}', fileId);
        } else {
            // 如果没有占位符，直接返回 fileId (用于 Direct URL Storage)
            return fileId;
        }
        
        // 检测和防止 URL 重叠
        if (fileId.startsWith('http://') || fileId.startsWith('https://')) {
            // 如果 fileId 本身就是完整 URL，检查是否会导致重复
            const baseUrl = source.endpoint.replace('{ID}', '');
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
        if (source.endpoint.includes('{ID}') || 
            source.endpoint === '{ID}') {
            
            // 验证是否为有效的URL格式（如果不是直接替换）
            if (source.endpoint !== '{ID}') {
                try {
                    const testUrl = source.endpoint.replace('{ID}', 'test');
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
 * IPFS存储处理器 - 通过 IPFS 网关访问分布式存储
 */
export class IpfsHandler implements StorageHandler {
    buildURL(source: ExternalSource, fileId: string): string {
        // 支持 {ID} 占位符
        let url = source.endpoint;
        if (url.includes('{ID}')) {
            url = url.replace('{ID}', fileId);
        } else {
            // 如果没有占位符，直接返回 fileId
            return fileId;
        }
        
        console.log(`Built IPFS URL: ${source.endpoint} + ${fileId} = ${url}`);
        return url;
    }
    
    validateConfig(source: ExternalSource): boolean {
        // 验证端点格式
        if (!source.endpoint) {
            return false;
        }
        
        // 必须包含 {ID} 占位符
        if (!source.endpoint.includes('{ID}')) {
            return false;
        }
        
        // 验证是否为有效的 URL 格式（如果不是直接替换）
        if (source.endpoint !== '{ID}') {
            try {
                const testUrl = source.endpoint.replace('{ID}', 'QmTest');
                new URL(testUrl);
                return true;
            } catch {
                return false;
            }
        }
        
        return true;
    }
    
    getTypeName(): string {
        return 'IPFS';
    }
}


/**
 * 存储处理器工厂
 */
export class StorageHandlerFactory {
    private static handlers: Map<string, StorageHandler> = new Map([
        ['raw_url', new RawUrlHandler()],
        ['ipfs', new IpfsHandler()],
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
export function validateStorageSource(source: ExternalSourceApiInput): { valid: boolean; error?: string } {
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