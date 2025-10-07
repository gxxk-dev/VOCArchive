/**
 * Material Design 3 Select Enhancement - 精简版
 * 只保留状态管理功能，所有 HTML 生成已移至 SSR
 */

class MD3Select {
    constructor() {
        this.init();
    }

    init() {
        // 初始化已存在的 MD3 select 字段
        this.initializeExistingFields();
        
        // 设置 mutation observer 监听动态添加的 select
        this.setupMutationObserver();
    }

    initializeExistingFields() {
        const selectFields = document.querySelectorAll('.md3-select-field');
        selectFields.forEach(field => this.enhanceSelectField(field));
    }

    setupMutationObserver() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        // 检查添加的节点是否是 select field
                        if (node.classList && node.classList.contains('md3-select-field')) {
                            this.enhanceSelectField(node);
                        }
                        // 检查节点内部的 select fields
                        const selectFields = node.querySelectorAll && node.querySelectorAll('.md3-select-field');
                        if (selectFields) {
                            selectFields.forEach(field => this.enhanceSelectField(field));
                        }
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    enhanceSelectField(field) {
        const select = field.querySelector('select');
        if (!select) return;

        // 设置事件监听器
        this.setupEventListeners(field, select);
        
        // 初始状态检查
        this.updateFieldState(field, select);
    }

    setupEventListeners(field, select) {
        // 防止重复监听器
        if (select.hasAttribute('data-md3-enhanced')) return;
        select.setAttribute('data-md3-enhanced', 'true');

        // 处理值变化
        select.addEventListener('change', () => {
            this.updateFieldState(field, select);
        });

        // 处理焦点事件
        select.addEventListener('focus', () => {
            field.classList.add('focused');
        });

        select.addEventListener('blur', () => {
            field.classList.remove('focused');
            this.updateFieldState(field, select);
        });

        // 处理 input 事件以提高响应性
        select.addEventListener('input', () => {
            this.updateFieldState(field, select);
        });
    }

    updateFieldState(field, select) {
        const hasValue = select.value && select.value.trim() !== '';
        
        if (hasValue) {
            field.classList.add('has-value');
        } else {
            field.classList.remove('has-value');
        }

        // 更新验证状态
        this.updateValidationState(field, select);
    }

    updateValidationState(field, select) {
        const isRequired = select.hasAttribute('required');
        const hasValue = select.value && select.value.trim() !== '';
        const isInvalid = isRequired && !hasValue && select.hasAttribute('data-touched');

        if (isInvalid) {
            field.classList.add('error');
        } else {
            field.classList.remove('error');
        }
    }
}

// DOM 加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    window.md3Select = new MD3Select();
});

// 导出供 ES 模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MD3Select;
}

console.log('MD3Select enhancement loaded (SSR mode)');
