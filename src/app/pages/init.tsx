import { jsx } from 'hono/jsx'

export const InitPage = () => {
    return (
        <html>
            <head>
                <meta charset="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <title>VOCArchive - 系统初始化</title>
                <link rel="stylesheet" href="/init/styles.css" />
                <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" />
            </head>
            <body>
                <div class="init-container">
                    <div class="init-header">
                        <i class="fas fa-cog"></i>
                        <h1>VOCArchive 系统初始化</h1>
                        <p>欢迎使用 VOCArchive！请完成系统初始化设置</p>
                    </div>

                    <div class="init-form-container">
                        <form id="init-form">
                            <div class="form-section">
                                <h3><i class="fas fa-globe"></i> 站点配置</h3>
                                
                                <div class="form-group">
                                    <label for="site-title">
                                        <i class="fas fa-tag"></i>
                                        站点标题
                                    </label>
                                    <input 
                                        type="text" 
                                        id="site-title" 
                                        name="siteTitle" 
                                        placeholder="VOCArchive" 
                                        value="VOCArchive"
                                    />
                                    <small>将显示在浏览器标签页标题</small>
                                </div>
                            </div>

                            <div class="form-section">
                                <h3><i class="fas fa-shield-alt"></i> 安全配置</h3>
                                
                                <div class="form-group">
                                    <label for="totp-secret">
                                        <i class="fas fa-key"></i>
                                        TOTP 密钥
                                    </label>
                                    <div class="secret-input-group">
                                        <input 
                                            type="text" 
                                            id="totp-secret" 
                                            name="totpSecret" 
                                            placeholder="将自动生成安全密钥"
                                            readonly
                                        />
                                        <button type="button" class="btn-generate" onclick="generateTotpSecret()">
                                            <i class="fas fa-refresh"></i>
                                            生成新密钥
                                        </button>
                                    </div>
                                    <small>用于双因素认证，请妥善保存</small>
                                </div>

                                <div class="form-group">
                                    <label for="jwt-secret">
                                        <i class="fas fa-certificate"></i>
                                        JWT 密钥
                                    </label>
                                    <div class="secret-input-group">
                                        <input 
                                            type="text" 
                                            id="jwt-secret" 
                                            name="jwtSecret" 
                                            placeholder="将自动生成安全密钥"
                                            readonly
                                        />
                                        <button type="button" class="btn-generate" onclick="generateJwtSecret()">
                                            <i class="fas fa-refresh"></i>
                                            生成新密钥
                                        </button>
                                    </div>
                                    <small>用于会话管理</small>
                                </div>
                            </div>

                            <div class="form-section">
                                <h3><i class="fas fa-cloud"></i> 存储配置（可选）</h3>
                                
                                <div class="form-group">
                                    <label for="asset-url">
                                        <i class="fas fa-link"></i>
                                        资产存储URL
                                    </label>
                                    <input 
                                        type="url" 
                                        id="asset-url" 
                                        name="assetUrl" 
                                        placeholder="https://assets.example.com"
                                    />
                                    <small>可稍后在管理后台中配置</small>
                                </div>
                            </div>

                            <div class="form-actions">
                                <button type="button" class="btn-default" onclick="useDefaults()">
                                    <i class="fas fa-magic"></i>
                                    使用默认配置
                                </button>
                                <button type="submit" class="btn-primary">
                                    <i class="fas fa-rocket"></i>
                                    开始初始化
                                </button>
                            </div>
                        </form>

                        <div id="init-progress" class="init-progress hidden">
                            <div class="progress-header">
                                <i class="fas fa-spinner fa-spin"></i>
                                <h3>正在初始化系统...</h3>
                            </div>
                            <div class="progress-bar">
                                <div class="progress-fill"></div>
                            </div>
                            <div class="progress-text">
                                <span id="progress-message">准备初始化数据库...</span>
                            </div>
                        </div>

                        <div id="init-result" class="init-result hidden">
                            <div class="result-header">
                                <i class="fas fa-check-circle"></i>
                                <h3>初始化完成！</h3>
                                <p>系统已成功初始化，请保存以下信息：</p>
                            </div>
                            
                            <div class="totp-info">
                                <h4><i class="fas fa-qrcode"></i> TOTP 设置信息</h4>
                                <div class="totp-secret">
                                    <label>密钥：</label>
                                    <span id="totp-result"></span>
                                    <button type="button" class="btn-copy" onclick="copyToClipboard('totp-result')">
                                        <i class="fas fa-copy"></i>
                                    </button>
                                </div>
                                <div class="qr-code" id="qr-code"></div>
                                <p class="totp-instructions">
                                    请使用 Google Authenticator、Authy 等应用扫描二维码或手动输入密钥
                                </p>
                            </div>

                            <div class="result-actions">
                                <a href="/admin" class="btn-primary">
                                    <i class="fas fa-arrow-right"></i>
                                    进入管理后台
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                <script src="/init/script.js"></script>
            </body>
        </html>
    )
}