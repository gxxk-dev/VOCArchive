import type { ExternalSource, ExternalSourceApiInput } from '../types';
import type { DrizzleDB } from '../client';

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
    validateConfig(source: ExternalSourceApiInput): boolean;
    
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
    
    validateConfig(source: ExternalSourceApiInput): boolean {
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
        // 如果启用了IPFS负载均衡，则直接返回fileId（CID）
        // 实际的URL构建将由buildStorageURLWithLoadBalancing处理
        if (source.isIPFS) {
            return fileId; // 直接返回CID，让上层处理网关选择
        }

        // 传统IPFS模式：使用endpoint模板
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
    
    validateConfig(source: ExternalSourceApiInput): boolean {
        // 如果启用了IPFS负载均衡，则不需要endpoint格式验证
        if (source.isIPFS) {
            return true;
        }

        // 传统IPFS模式的验证逻辑
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
 * 异步版本：使用存储处理器构建URL，支持IPFS负载均衡
 * @param db 数据库连接
 * @param source 外部存储源
 * @param fileId 文件ID
 * @returns 构建的URL，如果失败返回null
 */
export async function buildStorageURLWithLoadBalancing(
    db: DrizzleDB,
    source: ExternalSource,
    fileId: string
): Promise<string | null> {
    // 如果是IPFS且启用了负载均衡
    if (source.isIPFS) {
        return await buildIPFSURLWithLoadBalancing(db, source, fileId);
    }

    // 对于非IPFS源，使用原有逻辑
    return buildStorageURL(source, fileId);
}

/**
 * IPFS负载均衡URL构建
 * @param db 数据库连接
 * @param source 外部存储源
 * @param fileId IPFS CID
 * @returns 构建的URL，如果失败返回null
 */
async function buildIPFSURLWithLoadBalancing(
    db: DrizzleDB,
    source: ExternalSource,
    fileId: string
): Promise<string | null> {
    try {
        // 动态导入避免循环依赖
        const { getIPFSGateways } = await import('../operations/config');

        // 获取IPFS网关列表
        const gateways = await getIPFSGateways(db);

        if (gateways.length === 0) {
            console.error('No IPFS gateways configured');
            return null;
        }

        // 返回第一个网关的URL
        // 故障转移逻辑将在文件访问层面实现
        const gateway = gateways[0];
        const url = gateway + fileId;

        console.log(`Built IPFS URL with load balancing: ${url} (${gateways.length} gateways available)`);
        return url;

    } catch (error) {
        console.error('Error building IPFS URL with load balancing:', error);
        return null;
    }
}

/**
 * 尝试所有IPFS网关获取文件URL（带故障转移）
 * @param db 数据库连接
 * @param source 外部存储源
 * @param fileId IPFS CID
 * @param timeout 网关响应超时时间（毫秒）
 * @returns 可用的URL，如果全部失败返回null
 */
export async function tryAllIPFSGateways(
    db: DrizzleDB,
    source: ExternalSource,
    fileId: string,
    timeout: number = 5000
): Promise<string | null> {
    try {
        // 动态导入避免循环依赖
        const { getIPFSGateways } = await import('../operations/config');

        // 获取IPFS网关列表
        const gateways = await getIPFSGateways(db);

        if (gateways.length === 0) {
            console.error('No IPFS gateways configured');
            return null;
        }

        // 尝试每个网关
        for (const gateway of gateways) {
            const url = gateway + fileId;

            try {
                // 简单的URL可用性检查（通过HEAD请求）
                const response = await Promise.race([
                    fetch(url, { method: 'HEAD' }),
                    new Promise<Response>((_, reject) =>
                        setTimeout(() => reject(new Error('Timeout')), timeout)
                    )
                ]);

                if (response.ok) {
                    console.log(`IPFS gateway success: ${url}`);
                    return url;
                }
            } catch (error) {
                console.warn(`IPFS gateway failed: ${url} - ${error}`);
                continue;
            }
        }

        console.error(`All IPFS gateways failed for CID: ${fileId}`);
        return null;

    } catch (error) {
        console.error('Error trying IPFS gateways:', error);
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