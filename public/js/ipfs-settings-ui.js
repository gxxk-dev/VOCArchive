/**
 * IPFS网关设置UI组件
 */

class IPFSSettingsUI {
    constructor() {
        this.manager = new window.IPFSGatewayManager();
        this.modal = null;
        this.isOpen = false;
    }

    /**
     * 创建设置弹窗
     */
    createModal() {
        if (this.modal) {
            return this.modal;
        }

        const modal = document.createElement('div');
        modal.id = 'ipfs-settings-modal';
        modal.className = 'ipfs-settings-modal hidden';
        modal.innerHTML = `
            <div class="ipfs-settings-content">
                <div class="ipfs-settings-header">
                    <h3>IPFS 网关设置</h3>
                    <button class="close-btn" aria-label="关闭">&times;</button>
                </div>
                <div class="ipfs-settings-body">
                    <div class="user-gateways-section">
                        <h4>您的网关</h4>
                        <p class="help-text">添加您偏好的IPFS网关,将优先使用这些网关加载内容</p>
                        <div id="user-gateways-list" class="gateways-list"></div>
                        <div class="add-gateway-form">
                            <input
                                type="url"
                                id="new-gateway-input"
                                placeholder="https://ipfs.io/ipfs/"
                                class="gateway-input"
                            />
                            <button id="add-gateway-btn" class="add-btn">添加</button>
                        </div>
                        <p class="error-message" id="add-gateway-error"></p>
                    </div>

                    <div class="system-gateways-section">
                        <h4>系统默认网关</h4>
                        <p class="help-text">管理员配置的默认网关列表</p>
                        <div id="system-gateways-list" class="gateways-list"></div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        this.modal = modal;

        // 绑定事件
        this.bindEvents();

        return modal;
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        // 关闭按钮
        this.modal.querySelector('.close-btn').addEventListener('click', () => {
            this.close();
        });

        // 点击遮罩关闭
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.close();
            }
        });

        // 添加网关按钮
        document.getElementById('add-gateway-btn').addEventListener('click', () => {
            this.addGateway();
        });

        // 输入框回车添加
        document.getElementById('new-gateway-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addGateway();
            }
        });
    }

    /**
     * 渲染用户网关列表
     */
    async renderUserGateways() {
        const list = document.getElementById('user-gateways-list');
        const gateways = this.manager.getUserGateways();

        if (gateways.length === 0) {
            list.innerHTML = '<p class="empty-message">暂无自定义网关</p>';
            return;
        }

        list.innerHTML = gateways.map((gateway, index) => `
            <div class="gateway-item" data-gateway="${gateway}">
                <span class="gateway-url" title="${gateway}">${gateway}</span>
                <button class="remove-btn" data-gateway="${gateway}" title="删除">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');

        // 绑定删除按钮
        list.querySelectorAll('.remove-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const gateway = e.currentTarget.dataset.gateway;
                this.removeGateway(gateway);
            });
        });
    }

    /**
     * 渲染系统默认网关列表
     */
    async renderSystemGateways() {
        const list = document.getElementById('system-gateways-list');

        try {
            const gateways = await this.manager.fetchSystemGateways();

            if (gateways.length === 0) {
                list.innerHTML = '<p class="empty-message">无系统默认网关</p>';
                return;
            }

            list.innerHTML = gateways.map(gateway => `
                <div class="gateway-item system">
                    <span class="gateway-url" title="${gateway}">${gateway}</span>
                </div>
            `).join('');
        } catch (error) {
            list.innerHTML = '<p class="error-message">加载系统网关失败</p>';
        }
    }

    /**
     * 添加网关
     */
    addGateway() {
        const input = document.getElementById('new-gateway-input');
        const errorEl = document.getElementById('add-gateway-error');
        const url = input.value.trim();

        errorEl.textContent = '';

        const result = this.manager.addGateway(url);

        if (result.success) {
            input.value = '';
            this.renderUserGateways();
        } else {
            errorEl.textContent = result.error;
        }
    }

    /**
     * 删除网关
     */
    removeGateway(url) {
        if (confirm(`确定要删除网关 ${url} 吗?`)) {
            this.manager.removeGateway(url);
            this.renderUserGateways();
        }
    }

    /**
     * 打开设置弹窗
     */
    async open() {
        if (!this.modal) {
            this.createModal();
        }

        this.modal.classList.remove('hidden');
        this.isOpen = true;

        // 渲染网关列表
        await Promise.all([
            this.renderUserGateways(),
            this.renderSystemGateways()
        ]);

        // 聚焦输入框
        document.getElementById('new-gateway-input').focus();
    }

    /**
     * 关闭设置弹窗
     */
    close() {
        if (this.modal) {
            this.modal.classList.add('hidden');
        }
        this.isOpen = false;
    }

    /**
     * 切换设置弹窗
     */
    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }
}

// 导出到全局
window.IPFSSettingsUI = IPFSSettingsUI;
