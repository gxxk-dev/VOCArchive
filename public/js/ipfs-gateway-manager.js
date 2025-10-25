/**
 * IPFS网关管理器
 * 管理用户自定义的IPFS网关,数据存储在localStorage中
 */

class IPFSGatewayManager {
    constructor() {
        this.storageKey = 'user_ipfs_gateways';
        this.systemGatewaysCache = null;
    }

    /**
     * 从localStorage加载用户自定义网关
     * @returns {string[]} 网关URL数组
     */
    getUserGateways() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (!stored) return [];

            const gateways = JSON.parse(stored);
            return Array.isArray(gateways) ? gateways : [];
        } catch (error) {
            console.error('Failed to load user gateways:', error);
            return [];
        }
    }

    /**
     * 保存用户网关到localStorage
     * @param {string[]} gateways 网关URL数组
     */
    saveUserGateways(gateways) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(gateways));
            return true;
        } catch (error) {
            console.error('Failed to save user gateways:', error);
            return false;
        }
    }

    /**
     * 添加网关
     * @param {string} url 网关URL
     * @returns {{success: boolean, error?: string}}
     */
    addGateway(url) {
        // 验证URL格式
        if (!url || typeof url !== 'string') {
            return { success: false, error: '网关URL不能为空' };
        }

        // 去除前后空格
        url = url.trim();

        // 验证URL格式
        try {
            new URL(url);
        } catch {
            return { success: false, error: '无效的URL格式' };
        }

        // 检查是否以/ipfs/结尾
        if (!url.endsWith('/ipfs/')) {
            return { success: false, error: '网关URL必须以 /ipfs/ 结尾' };
        }

        // 检查是否已存在
        const current = this.getUserGateways();
        if (current.includes(url)) {
            return { success: false, error: '该网关已存在' };
        }

        // 添加到列表
        current.push(url);
        this.saveUserGateways(current);

        return { success: true };
    }

    /**
     * 删除网关
     * @param {string} url 网关URL
     * @returns {boolean}
     */
    removeGateway(url) {
        const current = this.getUserGateways();
        const filtered = current.filter(g => g !== url);

        if (filtered.length === current.length) {
            return false; // 网关不存在
        }

        this.saveUserGateways(filtered);
        return true;
    }

    /**
     * 从API获取系统默认网关
     * @returns {Promise<string[]>}
     */
    async fetchSystemGateways() {
        try {
            const response = await fetch('/api/config');
            if (!response.ok) throw new Error('Failed to fetch config');

            const config = await response.json();

            // 从ipfs_gateways配置中解析
            if (config.ipfs_gateways) {
                try {
                    const gateways = JSON.parse(config.ipfs_gateways);
                    return Array.isArray(gateways) ? gateways : [];
                } catch {
                    return [];
                }
            }

            return [];
        } catch (error) {
            console.error('Failed to fetch system gateways:', error);
            // 返回默认网关
            return [
                'https://ipfs.io/ipfs/',
                'https://gateway.pinata.cloud/ipfs/',
                'https://cf-ipfs.com/ipfs/'
            ];
        }
    }

    /**
     * 获取完整网关列表(用户网关 + 系统默认网关)
     * @returns {Promise<string[]>}
     */
    async getAllGateways() {
        const userGateways = this.getUserGateways();

        // 使用缓存的系统网关,避免重复请求
        if (!this.systemGatewaysCache) {
            this.systemGatewaysCache = await this.fetchSystemGateways();
        }

        // 合并并去重
        const all = [...userGateways, ...this.systemGatewaysCache];
        return [...new Set(all)];
    }

    /**
     * 构建IPFS URL
     * @param {string} cid IPFS CID
     * @param {number} gatewayIndex 网关索引(默认0,使用第一个)
     * @returns {Promise<string>}
     */
    async buildIPFSUrl(cid, gatewayIndex = 0) {
        const gateways = await this.getAllGateways();

        if (gateways.length === 0) {
            throw new Error('No IPFS gateways available');
        }

        const gateway = gateways[gatewayIndex] || gateways[0];
        return gateway + cid;
    }

    /**
     * 尝试使用所有网关加载资源(带故障转移)
     * @param {string} cid IPFS CID
     * @param {Object} options 选项
     * @param {number} options.timeout 单个网关超时时间(ms)
     * @param {Function} options.onTryGateway 尝试网关时的回调
     * @returns {Promise<{url: string, gateway: string}>}
     */
    async tryAllGateways(cid, options = {}) {
        const {
            timeout = 5000,
            onTryGateway = null
        } = options;

        const gateways = await this.getAllGateways();

        for (let i = 0; i < gateways.length; i++) {
            const gateway = gateways[i];
            const url = gateway + cid;

            if (onTryGateway) {
                onTryGateway(gateway, i, gateways.length);
            }

            try {
                // 使用HEAD请求测试可用性
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), timeout);

                const response = await fetch(url, {
                    method: 'HEAD',
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                if (response.ok) {
                    return { url, gateway };
                }
            } catch (error) {
                console.warn(`Gateway ${gateway} failed:`, error.message);
                continue;
            }
        }

        throw new Error('All IPFS gateways failed');
    }

    /**
     * 清空用户自定义网关
     */
    clearUserGateways() {
        localStorage.removeItem(this.storageKey);
    }
}

// 导出单例
window.IPFSGatewayManager = IPFSGatewayManager;
