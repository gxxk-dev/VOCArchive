import { jsx } from 'hono/jsx'
import { html } from 'hono/html'
import { Footer } from './footer'
import { FooterSetting } from '../database'

const WorkList = (props: { works: any[], asset_url: string }) => {
    return props.works.length > 0 ? props.works.map((item: any) => {
                                const userLang = "zh-cn"
                                let mainTitle = '[Untitled]';
                                if (item.titles && item.titles.length > 0) {
                                    const userLangTitle = item.titles.find((t: any) => t.language === userLang);
                                    if (userLangTitle) {
                                        mainTitle = userLangTitle.title;
                                    } else {
                                        const officialTitle = item.titles.find((t: any) => t.is_official);
                                        if (officialTitle) {
                                            mainTitle = officialTitle.title;
                                        } else {
                                            mainTitle = item.titles[0].title;
                                        }
                                    }
                                }

                                let artistName = '[Unknown Artist]';
                                if (item.creator && item.creator.length > 0) {
                                    const humanCreator = item.creator.filter((c: any) => c.creator_type === 'human');
                                    if (humanCreator.length > 0) {
                                        artistName = humanCreator.map((c: any) => c.creator_name).join(' / ');
                                    } else {
                                        artistName = item.creator[0].creator_name;
                                    }
                                }

                                let coverUrl = '';
                                if (item.preview_asset) {
                                    coverUrl = `${props.asset_url}/${item.preview_asset.file_id}`;
                                } else if (item.non_preview_asset) {
                                    coverUrl = `${props.asset_url}/${item.non_preview_asset.file_id}`;
                                } else {
                                    coverUrl = 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=100';
                                }

                                return (
                                    <div class="work-item" data-id={item.work_uuid}>
                                        <img class="work-preview" src={coverUrl} alt={mainTitle} />
                                        <div class="work-info">
                                            <div class="work-title">{mainTitle}</div>
                                            <div class="work-artist">{artistName}</div>
                                        </div>
                                        <button class="work-play-btn"><i class="fas fa-play"></i></button>
                                    </div>
                                )
                            }) : <div class="no-results">未找到歌曲</div>
}

export const IndexPage = (props: { works: any[], asset_url: string, footerSettings: FooterSetting[] }) => {
    return html`
        <html>
            <head>
                <meta charset="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <title>VOCArchive - 作品选择</title>
                <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
                <style>
                    
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
            padding: var(--spacing-md);
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

        /* 主容器 */
        .page-container {
            max-width: 100%;
            margin: 0 auto;
            background: var(--card-bg);
            backdrop-filter: blur(25px);
            border-radius: var(--card-radius);
            padding: var(--spacing-xl);
            box-shadow: 
                var(--shadow-md),
                0 0 0 1px rgba(255, 255, 255, 0.08);
            border: 1px solid var(--card-border);
            transition: all 0.5s ease;
            animation: fadeInUp 0.8s ease-out;
        }

        /* 浮动搜索 */
        .floating-search {
            position: fixed;
            top: var(--spacing-md);
            right: var(--spacing-md);
            z-index: 1000;
            display: flex;
            align-items: center;
            gap: 8px;
            background: rgba(20, 20, 20, 0.85);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.15);
            border-radius: var(--element-radius);
            padding: var(--spacing-sm) 16px;
            box-shadow: 
                var(--shadow-md),
                0 0 0 1px rgba(255, 255, 255, 0.05);
            transition: all 0.3s ease;
            min-width: 280px;
            animation: slideInRight 0.6s ease-out;
        }

        .floating-search:hover {
            background: rgba(25, 25, 25, 0.9);
            border-color: rgba(120, 119, 198, 0.3);
            transform: translateY(-2px);
            box-shadow: 
                var(--shadow-lg),
                0 0 0 1px rgba(255, 255, 255, 0.08);
        }

        .floating-search-input {
            flex: 1;
            background: transparent;
            color: var(--text-primary);
            border: none;
            font-size: 0.95rem;
            font-weight: 400;
            outline: none;
            padding: 4px 0;
        }

        .floating-search-input::placeholder {
            color: #666;
        }

        .floating-search-btn {
            background: var(--primary-gradient);
            border: none;
            border-radius: 10px;
            color: white;
            cursor: pointer;
            padding: 8px 12px;
            font-size: 0.9rem;
            font-weight: 500;
            transition: all 0.3s ease;
            white-space: nowrap;
        }

        .floating-search-btn:hover {
            transform: scale(1.05);
            box-shadow: 0 4px 15px rgba(124, 119, 198, 0.4);
        }

        /* 头部区域 */
        .page-header {
            text-align: center;
            margin-bottom: 50px;
            position: relative;
        }

        .page-header::before {
            content: '';
            position: absolute;
            top: -16px;
            left: 50%;
            transform: translateX(-50%);
            width: 80px;
            height: 4px;
            background: linear-gradient(90deg, #7c77c6, #ff77c6, #77dbff);
            border-radius: 2px;
        }

        .page-title {
            font-size: clamp(2rem, 5vw, 2.8rem);
            font-weight: 700;
            margin-bottom: var(--spacing-sm);
            background: linear-gradient(135deg, #ffffff, #b0b0b0);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            letter-spacing: -0.02em;
        }

        .page-subtitle {
            font-size: clamp(1rem, 2.5vw, 1.1rem);
            color: var(--text-secondary);
            font-weight: 400;
        }

        /* 歌曲列表区域 */
        .work-list-section {
            background: rgba(25, 25, 25, 0.6);
            border-radius: var(--element-radius);
            padding: var(--spacing-lg);
            border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .section-title {
            font-size: clamp(1.2rem, 3.5vw, 1.5rem);
            font-weight: 600;
            color: #ddd;
            margin-bottom: var(--spacing-lg);
            display: flex;
            align-items: center;
            gap: var(--spacing-sm);
            justify-content: center;
        }

        .work-list {
            display: grid;
            gap: var(--spacing-sm);
            grid-template-columns: 1fr;
        }

        /* 宽屏布局 - 2列 */
        @media (min-width: 1024px) {
            .work-list {
                grid-template-columns: 1fr 1fr;
                gap: var(--spacing-md);
            }
        }

        .work-item {
            display: grid;
            grid-template-columns: auto 1fr auto;
            align-items: center;
            gap: var(--spacing-md);
            padding: var(--spacing-md);
            background: rgba(35, 35, 35, 0.6);
            border-radius: var(--element-radius);
            cursor: pointer;
            transition: all 0.4s ease;
            border: 1px solid rgba(255, 255, 255, 0.06);
            position: relative;
            overflow: hidden;
            animation: fadeInUp 0.5s ease-out;
            animation-fill-mode: both;
        }

        .work-item::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.04), transparent);
            transition: left 0.6s ease;
        }

        .work-item:hover::before {
            left: 100%;
        }

        .work-item:hover {
            background: rgba(50, 50, 50, 0.8);
            transform: translateY(-6px) scale(1.02);
            border-color: rgba(120, 119, 198, 0.3);
            box-shadow: var(--shadow-lg);
        }

        .work-preview {
            width: 40px;
            height: 40px;
            border-radius: 8px;
            object-fit: cover;
            background: linear-gradient(135deg, #7c77c6, #6366f1);
        }

        .work-info {
            display: flex;
            flex-direction: column;
            gap: 8px;
            min-width: 0;
        }

        .work-title {
            font-size: clamp(1.05rem, 2.8vw, 1.2rem);
            font-weight: 600;
            color: var(--text-primary);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            line-height: 1.3;
        }

        .work-artist {
            font-size: clamp(0.9rem, 2.2vw, 1rem);
            color: var(--text-secondary);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            line-height: 1.2;
        }

        .work-play-btn {
            width: 48px;
            height: 48px;
            background: var(--primary-gradient);
            border: none;
            border-radius: 50%;
            color: white;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.2rem;
            transition: all 0.3s ease;
            opacity: 0;
            flex-shrink: 0;
        }

        .work-item:hover .work-play-btn {
            opacity: 1;
        }

        .work-play-btn:hover {
            transform: scale(1.15);
            box-shadow: 0 8px 25px rgba(124, 119, 198, 0.5);
        }

        /* 分页 */
        .pagination {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: var(--spacing-sm);
            margin-top: var(--spacing-xl);
            flex-wrap: wrap;
        }

        .pagination-btn {
            padding: var(--spacing-sm) 18px;
            background: rgba(40, 40, 40, 0.7);
            color: #ccc;
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: var(--element-radius);
            cursor: pointer;
            font-size: clamp(0.85rem, 2vw, 0.95rem);
            transition: all 0.3s ease;
            white-space: nowrap;
        }

        .pagination-btn:hover {
            background: rgba(60, 60, 60, 0.8);
            color: #fff;
            transform: translateY(-2px);
        }

        .pagination-btn.active {
            background: var(--primary-gradient);
            color: white;
            border-color: #7c77c6;
        }

        .pagination-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        .back-button:hover {
            background: rgba(25, 25, 25, 0.9);
            border-color: rgba(120, 119, 198, 0.3);
            transform: translateY(-2px);
            box-shadow: 
                var(--shadow-lg),
                0 0 0 1px rgba(255, 255, 255, 0.08);
        }

        /* 加载动画 */
        .loader {
            display: flex;
            justify-content: center;
            padding: 40px 0;
        }

        .loader-dots {
            display: flex;
            gap: 8px;
        }

        .loader-dot {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: var(--primary-gradient);
            animation: pulse 1.2s infinite;
        }

        .loader-dot:nth-child(2) {
            animation-delay: 0.2s;
        }

        .loader-dot:nth-child(3) {
            animation-delay: 0.4s;
        }

        /* 响应式设计 */
        @media (max-width: 1023px) {
            .work-list {
                grid-template-columns: 1fr;
            }
        }

        @media (max-width: 768px) {
            body {
                padding: 15px;
            }
            
            .page-container {
                padding: 24px;
                border-radius: 20px;
            }
            
            .work-list-section {
                padding: 24px;
            }
            
            .work-item {
                padding: 18px;
                gap: 16px;
            }
            
            .floating-search {
                position: relative;
                top: auto;
                right: auto;
                margin-bottom: 20px;
                min-width: auto;
                width: 100%;
            }
            
            .back-button {
                top: 20px;
                left: 20px;
                padding: 10px 16px;
            }
        }

        @media (max-width: 480px) {
            body {
                padding: 10px;
            }
            
            .page-container {
                padding: 20px;
                border-radius: 16px;
            }
            
            .work-list-section {
                padding: 20px;
            }
            
            .work-item {
                padding: 16px;
                gap: 12px;
            }
            
            .floating-search {
                padding: 10px 14px;
                border-radius: 12px;
            }
            
            .back-button {
                top: 15px;
                left: 15px;
                padding: 8px 14px;
            }
        }

        /* 大屏幕 */
        @media (min-width: 1200px) {
            .page-container {
                max-width: 1100px;
                margin: 0 auto;
            }
        }

        @media (min-width: 1400px) {
            .page-container {
                max-width: 1200px;
            }
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
                </style>
            </head>
            <body>
                <div class="background-container">
                    <div class="background-overlay" id="backgroundOverlay"></div>
                    <div class="background-pattern" id="backgroundPattern"></div>
                </div>

                <div class="floating-search">
                    <input type="text" class="floating-search-input" placeholder="搜索歌曲、艺术家..." id="searchInput" />
                    <button class="floating-search-btn" id="searchButton">
                        <i class="fas fa-search"></i>
                    </button>
                </div>

                <div class="page-container" id="pageContainer">
                    <header class="page-header">
                        <h1 class="page-title">VOCArchive - 作品选择</h1>
                        
                    </header>

                    <section class="work-list-section">
                        <h2 class="section-title">
                            <i class="fas fa-list-music"></i> 歌曲列表
                        </h2>

                        <div class="work-list" id="workList">
                            ${WorkList({works:props.works,asset_url:props.asset_url})}
                        </div>

                        <div class="pagination" id="pagination">
                            <button class="pagination-btn" id="prevPage" disabled>
                                <i class="fas fa-arrow-left"></i> 上一页
                            </button>
                            <button class="pagination-btn" id="nextPage">
                                下一页 <i class="fas fa-arrow-right"></i>
                            </button>
                        </div>
                    </section>
                </div>

                <script>
        const workList = document.getElementById('workList');
        const searchInput = document.getElementById('searchInput');
        const searchButton = document.getElementById('searchButton');
        const prevPageBtn = document.getElementById('prevPage');
        const nextPageBtn = document.getElementById('nextPage');
        const paginationContainer = document.getElementById('pagination');
        
        let currentPage = 1; 
        let itemsPerPage = 6;
        window.ASSET_URL = "${props.asset_url}";

        function setupEventListeners() {
            workList.addEventListener('click', function(e) {
                const workItem = e.target.closest('.work-item');
                if (workItem) {
                    const songId = workItem.dataset.id;
                    window.location.href = \`/player?uuid=\${songId}\`;
                }
                
                const playBtn = e.target.closest('.work-play-btn');
                if (playBtn) {
                    e.stopPropagation();
                    const workItem = playBtn.closest('.work-item');
                    const songId = workItem.dataset.id;
                    window.location.href = \`/player?uuid=\${songId}\`;
                }
            });
            
            paginationContainer.addEventListener('click', function(e) {
                const btn = e.target.closest('.pagination-btn');
                if (!btn) return;
                
                if (btn.id === 'prevPage') {
                    changePage(-1);
                } else if (btn.id === 'nextPage') {
                    changePage(1);
                } else if (btn.dataset.page) {
                    goToPage(parseInt(btn.dataset.page));
                }
            });

            searchButton.addEventListener('click', searchMusic);
            searchInput.addEventListener('keyup', function(e) {
                if (e.key === 'Enter') {
                    searchMusic();
                }
            });
        }

        function changePage(direction) {
            const params = new URLSearchParams(window.location.search);
            let page = parseInt(params.get('page') || '1');
            page += direction;
            if (page > 0) {
                params.set('page', page.toString());
                window.location.search = params.toString();
            }
        }

        function goToPage(page) {
            const params = new URLSearchParams(window.location.search);
            params.set('page', page.toString());
            window.location.search = params.toString();
        }

        function searchMusic() {
            const query = searchInput.value.trim();
            if (query) {
                window.location.href = \`/?search=\${encodeURIComponent(query)}\`;
            }
        }
        
        document.addEventListener('DOMContentLoaded', setupEventListeners);
                </script>
                ${<Footer settings={props.footerSettings}/>}
            </body>
        </html>
    `
}