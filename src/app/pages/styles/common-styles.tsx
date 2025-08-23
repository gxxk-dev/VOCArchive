export const CommonStyles = `
:root {
    /* 颜色变量 */
    --bg-dark: #0c0c0c;
    --bg-darker: #1a1a1a;
    --bg-overlay: rgba(0, 0, 0, 0.75);
    --card-bg: rgba(15, 15, 15, 0.85);
    --card-border: rgba(255, 255, 255, 0.12);
    --primary-gradient: linear-gradient(135deg, #7c77c6, #6366f1);
    --secondary-gradient: linear-gradient(135deg, #ff77c6, #77dbff);
    --text-primary: #ffffff;
    --text-secondary: #888;
    --text-accent: #b0b0b0;
    
    /* 尺寸变量 */
    --card-radius: 24px;
    --element-radius: 16px;
    --spacing-sm: 12px;
    --spacing-md: 20px;
    --spacing-lg: 32px;
    --spacing-xl: 40px;
    
    /* 阴影 */
    --shadow-sm: 0 4px 8px rgba(0, 0, 0, 0.3);
    --shadow-md: 0 8px 24px rgba(0, 0, 0, 0.4);
    --shadow-lg: 0 12px 35px rgba(0, 0, 0, 0.5);
}

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    background: linear-gradient(135deg, var(--bg-dark) 0%, var(--bg-darker) 50%, var(--bg-dark) 100%);
    color: var(--text-primary);
    min-height: 100vh;
    overflow-x: hidden;
    position: relative;
    line-height: 1.6;
}

/* 背景层 */
.background-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: -3;
    overflow: hidden;
}

.background-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, 
        rgba(0, 0, 0, 0.75) 0%, 
        rgba(0, 0, 0, 0.6) 50%,
        rgba(0, 0, 0, 0.8) 100%);
    transition: opacity 0.8s ease-in-out;
}

.background-pattern {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-image: 
        radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.08) 0%, transparent 50%),
        radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.08) 0%, transparent 50%),
        radial-gradient(circle at 40% 80%, rgba(120, 219, 255, 0.08) 0%, transparent 50%);
}

/* 动画 */
@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(30px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes slideInRight {
    from {
        opacity: 0;
        transform: translateX(30px);
    }
    to {
        opacity: 1;
        transform: translateX(0);
    }
}

@keyframes pulse {
    0%, 100% {
        transform: scale(1);
        opacity: 1;
    }
    50% {
        transform: scale(1.2);
        opacity: 0.7;
    }
}

/* Footer */
.site-footer {
    text-align: center;
    padding: var(--spacing-lg) var(--spacing-md);
    margin-top: var(--spacing-xl);
    color: var(--text-secondary);
    font-size: 0.9rem;
    border-top: 1px solid var(--card-border);
}

.footer-content {
    display: flex;
    justify-content: center;
    align-items: center;
    flex-wrap: wrap;
    gap: var(--spacing-md);
    margin-bottom: var(--spacing-md);
}

.footer-links {
    display: flex;
    gap: var(--spacing-md);
    flex-wrap: wrap;
    justify-content: center;
}

.footer-links a {
    color: var(--text-accent);
    text-decoration: none;
    transition: color 0.3s ease;
}

.footer-links a:hover {
    color: var(--text-primary);
    text-decoration: underline;
}

.footer-social {
    display: flex;
    gap: var(--spacing-lg);
}

.footer-social a {
    color: var(--text-accent);
    font-size: 1.4rem;
    transition: color 0.3s ease, transform 0.3s ease;
    display: inline-block;
}

.footer-social a:hover {
    color: var(--text-primary);
    transform: translateY(-2px);
}

.footer-copyright p {
    margin: 0;
    font-size: 0.85rem;
}
`