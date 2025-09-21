document.addEventListener('DOMContentLoaded', async () => {
    // --- DOM Elements ---
    const initForm = document.getElementById('init-form');
    const progressContainer = document.getElementById('init-progress');
    const resultContainer = document.getElementById('init-result');
    const progressMessage = document.getElementById('progress-message');
    const progressFill = document.querySelector('.progress-fill');
    
    const siteTitle = document.getElementById('site-title');
    const totpSecret = document.getElementById('totp-secret');
    const jwtSecret = document.getElementById('jwt-secret');
    const assetUrl = document.getElementById('asset-url');
    
    const totpResult = document.getElementById('totp-result');
    const qrCode = document.getElementById('qr-code');
    
    // --- State ---
    const API_BASE_URL = '/api';
    
    // --- Helper Functions ---
    function showElement(element) {
        element.classList.remove('hidden');
    }
    
    function hideElement(element) {
        element.classList.add('hidden');
    }
    
    function updateProgress(percent, message) {
        progressFill.style.width = `${percent}%`;
        progressMessage.textContent = message;
    }
    
    // 生成随机密钥
    async function generateRandomSecret() {
        try {
            const response = await fetch(`${API_BASE_URL}/init/generate-secret`);
            const data = await response.json();
            return data.secret;
        } catch (error) {
            console.error('Failed to generate secret:', error);
            // 客户端生成随机密钥作为后备方案
            return generateClientSecret();
        }
    }
    
    // 客户端生成密钥（后备方案）
    function generateClientSecret() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        let secret = '';
        for (let i = 0; i < 32; i++) {
            secret += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return secret;
    }
    
    // 生成 TOTP QR 码
    function generateTotpQrCode(secret, issuer = 'VOCArchive') {
        const qrText = `otpauth://totp/${encodeURIComponent(issuer)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}`;
        
        // 使用 QRCode 库生成二维码
        if (typeof QRCode !== 'undefined') {
            qrCode.innerHTML = '';
            new QRCode(qrCode, {
                text: qrText,
                width: 200,
                height: 200,
                colorDark: "#000000",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.M
            });
        } else {
            // 如果 QRCode 库未加载，显示文本链接
            qrCode.innerHTML = `
                <p>请在认证器应用中手动添加以下信息：</p>
                <p>账户：VOCArchive</p>
                <p>密钥：${secret}</p>
            `;
        }
    }
    
    // 复制到剪贴板
    function copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            // 显示复制成功提示
            const button = event.target.closest('.btn-copy');
            const originalText = button.innerHTML;
            button.innerHTML = '<i class="fas fa-check"></i>';
            setTimeout(() => {
                button.innerHTML = originalText;
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy text: ', err);
        });
    }
    
    // 使用默认配置
    async function useDefaults() {
        try {
            // 生成密钥
            const generatedTotpSecret = await generateRandomSecret();
            const generatedJwtSecret = await generateRandomSecret();
            
            // 填充表单
            siteTitle.value = 'VOCArchive';
            totpSecret.value = generatedTotpSecret;
            jwtSecret.value = generatedJwtSecret;
            assetUrl.value = '';
            
        } catch (error) {
            console.error('Failed to generate defaults:', error);
            alert('生成默认配置失败，请手动配置或重试');
        }
    }
    
    // 生成 TOTP 密钥
    async function generateTotpSecret() {
        try {
            const secret = await generateRandomSecret();
            totpSecret.value = secret;
        } catch (error) {
            console.error('Failed to generate TOTP secret:', error);
            alert('生成密钥失败，请重试');
        }
    }
    
    // 生成 JWT 密钥
    async function generateJwtSecret() {
        try {
            const secret = await generateRandomSecret();
            jwtSecret.value = secret;
        } catch (error) {
            console.error('Failed to generate JWT secret:', error);
            alert('生成密钥失败，请重试');
        }
    }
    
    // 执行初始化
    async function performInitialization(formData) {
        try {
            updateProgress(10, '开始初始化...');
            
            const response = await fetch(`${API_BASE_URL}/init/setup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });
            
            updateProgress(50, '初始化数据库结构...');
            
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.message || '初始化失败');
            }
            
            updateProgress(80, '配置系统设置...');
            
            // 短暂延迟以显示进度
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            updateProgress(100, '初始化完成！');
            
            // 显示结果
            setTimeout(() => {
                hideElement(progressContainer);
                showElement(resultContainer);
                
                // 显示 TOTP 密钥
                totpResult.textContent = result.secrets.totpSecret;
                
                // 生成二维码
                generateTotpQrCode(result.secrets.totpSecret);
            }, 1000);
            
        } catch (error) {
            console.error('Initialization failed:', error);
            updateProgress(0, `初始化失败: ${error.message}`);
            
            // 3秒后重新显示表单
            setTimeout(() => {
                hideElement(progressContainer);
                showElement(initForm.parentElement);
            }, 3000);
        }
    }
    
    // --- Event Handlers ---
    
    // 表单提交
    initForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = {
            siteTitle: siteTitle.value.trim() || 'VOCArchive',
            totpSecret: totpSecret.value.trim(),
            jwtSecret: jwtSecret.value.trim(),
            assetUrl: assetUrl.value.trim() || null
        };
        
        // 验证必填字段
        if (!formData.totpSecret || !formData.jwtSecret) {
            alert('请生成或输入 TOTP 和 JWT 密钥');
            return;
        }
        
        // 隐藏表单，显示进度
        hideElement(initForm.parentElement);
        showElement(progressContainer);
        
        // 执行初始化
        await performInitialization(formData);
    });
    
    // --- 全局函数（供 HTML 调用）---
    window.useDefaults = useDefaults;
    window.generateTotpSecret = generateTotpSecret;
    window.generateJwtSecret = generateJwtSecret;
    window.copyToClipboard = (elementId) => {
        const element = document.getElementById(elementId);
        if (element) {
            copyToClipboard(element.textContent);
        }
    };
    
    // --- 初始化 ---
    
    // 检查初始化状态
    try {
        const response = await fetch(`${API_BASE_URL}/init/status`);
        const data = await response.json();
        
        if (data.initialized) {
            // 如果已初始化，显示提示并跳转
            document.body.innerHTML = `
                <div class="init-container">
                    <div class="init-header">
                        <i class="fas fa-check-circle"></i>
                        <h1>系统已初始化</h1>
                        <p>系统已经完成初始化，正在跳转到主页...</p>
                    </div>
                </div>
            `;
            
            setTimeout(() => {
                window.location.href = '/';
            }, 2000);
            return;
        }
    } catch (error) {
        console.error('Failed to check initialization status:', error);
    }
    
    // 自动生成初始密钥
    try {
        const generatedTotpSecret = await generateRandomSecret();
        const generatedJwtSecret = await generateRandomSecret();
        
        totpSecret.value = generatedTotpSecret;
        jwtSecret.value = generatedJwtSecret;
    } catch (error) {
        console.error('Failed to generate initial secrets:', error);
    }
});

// 动态加载 QRCode 库
const script = document.createElement('script');
script.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
script.async = true;
document.head.appendChild(script);