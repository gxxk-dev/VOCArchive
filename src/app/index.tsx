import { Hono } from 'hono'
import { serveStatic } from 'hono/cloudflare-workers'

import { listInfo } from './routes/list'
import { getInfo } from './routes/get'
import { deleteInfo } from './routes/delete'
import { updateInfo } from './routes/update'
import { inputInfo } from './routes/input'
import { searchInfo } from './routes/search'
import { auth } from './routes/auth'
import { initRoutes } from './routes/init'
import footer from './routes/footer'
import config from './routes/config'
import { migration } from './routes/migration'
import { jwt } from 'hono/jwt'

import { IndexPage } from './pages/index'
import { PlayerPage } from './pages/player'
import { InitPage } from './pages/init'
import { TagsCategoriesPage } from './pages/tags-categories'
import { createDrizzleClient } from './db/client'
import { getFooterSettings, initializeDatabaseWithMigrations, isDatabaseInitialized } from './db/operations/admin'
import { getPublicSiteConfig, getSiteConfig } from './db/operations/config'
import { getWorkByUUID, getWorkListWithPagination, getTotalWorkCount } from './db/operations/work'
import { searchWorks, getAvailableLanguages } from './db/operations/search'
import { getWorksByTag, getWorkCountByTag, getTagByUUID, listTagsWithCounts } from './db/operations/tag'
import { getWorksByCategory, getWorkCountByCategory, getCategoryByUUID, listCategoriesWithCounts } from './db/operations/category'
import { listExternalSources } from './db/operations/external_source'

const apiApp = new Hono<{ Bindings: CloudflareBindings }>()

apiApp.get('/', (c) => {
  return c.text('Hello Hono!')
})


// ========== 中间件 ==========
const middleware = async (c: any, next: any) => {
    try {
        const db = createDrizzleClient(c.env.DB);
        const config = await getSiteConfig(db, 'jwt_secret');
        const secretKey = config?.value || c.env.JWT_SECRET as string;

        const jwtMiddleware = jwt({
            secret: secretKey,
        });
        return jwtMiddleware(c, next);
    } catch (error) {
        console.error('JWT middleware error:', error);
        // Fallback to environment variable
        const jwtMiddleware = jwt({
            secret: c.env.JWT_SECRET as string,
        });
        return jwtMiddleware(c, next);
    }
}

// ========== 信息管理 ==========
// ---------- 删除信息 ----------
apiApp.route('/delete', deleteInfo)
    .use("/delete/*",middleware)
// ---------- 修改信息 ----------
apiApp.route('/update', updateInfo)
    .use("/update/*",middleware)
// ---------- 录入信息 ----------
apiApp.route('/input', inputInfo)
    .use("/input/*",middleware)

// ========== 数据库迁移 ==========
apiApp.route('/migration', migration)
    .use("/migration/*", middleware)

// ========== 配置/权限 ==========
apiApp.route('/auth', auth)

// ========== 初始化 API（无需认证）==========
apiApp.route('/init', initRoutes)

// ========== 站点配置 ==========
apiApp.route('/footer', footer)
apiApp.route('/config', config)

// ========== 信息读取(仅GET方法) ==========
// ---------- 获取信息 ----------
apiApp.route('/get', getInfo)
// ---------- 搜索信息 ----------
apiApp.route('/search', searchInfo)
// ---------- 列出信息 ----------
apiApp.route('/list', listInfo)

// ========== Service Worker 配置（无需认证）==========
apiApp.get('/sw_config.js', async (c) => {
  try {
    const db = createDrizzleClient(c.env.DB);
    const externalSources = await listExternalSources(db, 1, 999);

    console.log('External sources retrieved:', externalSources);

    // 提取所有外部存储源的域名
    const externalHosts = externalSources
      .map(source => {
        try {
          // 创建测试 URL 来提取域名
          const testUrl = source.endpoint.replace('{ID}', 'test');
          if (testUrl === 'test') {
            // 这是直接替换模式，无法提取域名
            return null;
          }
          const url = new URL(testUrl);
          return url.hostname;
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    // 去重
    const uniqueHosts = [...new Set(externalHosts)];

    // 如果没有外部主机，添加默认值用于测试
    if (uniqueHosts.length === 0) {
      uniqueHosts.push('assets.vocarchive.com');
    }

    const configScript = `
// Service Worker 配置 - 由系统动态生成
const EXTERNAL_HOSTS = ${JSON.stringify(uniqueHosts)};
const ASSET_HOSTS = EXTERNAL_HOSTS; // 兼容性别名
const ASSET_HOST = EXTERNAL_HOSTS[0] || 'assets.vocarchive.com'; // 兼容性支持

// 代理配置 - 用于解决 CORS 问题
const PROXY_CONFIG = {
  enabled: true,
  proxyPath: '/proxy/assets/',
  // 需要代理的外部主机
  externalHosts: EXTERNAL_HOSTS
};

// 缓存配置
const CACHE_CONFIG = {
  version: 'v2',
  cacheName: 'vocarchive-cache-v2',
  // 媒体文件缓存时间：7天
  mediaMaxAge: 7 * 24 * 60 * 60 * 1000,
  // API 缓存时间：1小时
  apiMaxAge: 60 * 60 * 1000,
  // 最大缓存大小：500MB
  maxCacheSize: 500 * 1024 * 1024
};

// 支持的文件类型
const CACHEABLE_EXTENSIONS = ['.mp3', '.flac', '.mp4', '.wav', '.m4a', '.ogg'];
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'];
const ASSET_EXTENSIONS = [...CACHEABLE_EXTENSIONS, ...IMAGE_EXTENSIONS];

// 导出配置供 Service Worker 使用
if (typeof self !== 'undefined') {
  self.EXTERNAL_HOSTS = EXTERNAL_HOSTS;
  self.ASSET_HOSTS = ASSET_HOSTS;
  self.ASSET_HOST = ASSET_HOST;
  self.PROXY_CONFIG = PROXY_CONFIG;
  self.CACHE_CONFIG = CACHE_CONFIG;
  self.CACHEABLE_EXTENSIONS = CACHEABLE_EXTENSIONS;
  self.IMAGE_EXTENSIONS = IMAGE_EXTENSIONS;
  self.ASSET_EXTENSIONS = ASSET_EXTENSIONS;
}

// 调试信息
console.log('SW Config loaded:', {
  externalHosts: EXTERNAL_HOSTS,
  proxyConfig: PROXY_CONFIG,
  cacheConfig: CACHE_CONFIG,
  sourcesCount: ${externalSources.length}
});
`;

    return c.text(configScript, 200, {
      'Content-Type': 'application/javascript',
      'Cache-Control': 'no-cache'
    });
  } catch (error) {
    console.error('Error generating SW config:', error);
    // 返回默认配置
    const fallbackScript = `
// Service Worker 配置 - 默认配置（发生错误）
const EXTERNAL_HOSTS = ['assets.vocarchive.com'];
const ASSET_HOSTS = EXTERNAL_HOSTS;
const ASSET_HOST = 'assets.vocarchive.com';
const CACHE_CONFIG = {
  version: 'v2',
  cacheName: 'vocarchive-cache-v2',
  mediaMaxAge: 7 * 24 * 60 * 60 * 1000,
  apiMaxAge: 60 * 60 * 1000,
  maxCacheSize: 500 * 1024 * 1024
};
const CACHEABLE_EXTENSIONS = ['.mp3', '.flac', '.mp4', '.wav', '.m4a', '.ogg'];
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'];
const ASSET_EXTENSIONS = [...CACHEABLE_EXTENSIONS, ...IMAGE_EXTENSIONS];

if (typeof self !== 'undefined') {
  self.EXTERNAL_HOSTS = EXTERNAL_HOSTS;
  self.ASSET_HOSTS = ASSET_HOSTS;
  self.ASSET_HOST = ASSET_HOST;
  self.CACHE_CONFIG = CACHE_CONFIG;
  self.CACHEABLE_EXTENSIONS = CACHEABLE_EXTENSIONS;
  self.IMAGE_EXTENSIONS = IMAGE_EXTENSIONS;
  self.ASSET_EXTENSIONS = ASSET_EXTENSIONS;
}

console.log('SW Config loaded (fallback):', {
  externalHosts: EXTERNAL_HOSTS,
  error: ${JSON.stringify((error as any).message)}
});
`;
    return c.text(fallbackScript, 200, {
      'Content-Type': 'application/javascript',
      'Cache-Control': 'no-cache'
    });
  }
})

const app = new Hono<{ Bindings: CloudflareBindings }>()

// ========== 外部资源代理（添加 CORS 支持）==========
app.get('/proxy/assets/*', async (c) => {
  try {
    const path = c.req.path.replace('/proxy/assets/', '');
    const assetUrl = `https://assets.vocarchive.com/${path}`;

    console.log(`[Proxy] 代理请求: ${assetUrl}`);

    const response = await fetch(assetUrl);

    if (!response.ok) {
      return c.notFound();
    }

    // 克隆响应并添加 CORS 头部
    const newResponse = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        ...Object.fromEntries(response.headers),
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Expose-Headers': 'Content-Length,Content-Type',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept'
      }
    });

    return newResponse;
  } catch (error) {
    console.error('[Proxy] 代理请求失败:', error);
    return c.text('Proxy Error', 500);
  }
});

// 处理 OPTIONS 预检请求
app.options('/proxy/assets/*', (c) => {
  return c.text('', 200, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
    'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
    'Access-Control-Max-Age': '86400'
  });
});

app.route('/api', apiApp)

// ========== 初始化检查中间件 ==========
// 检查数据库是否已初始化，如果未初始化则重定向到 /init
app.use('/*', async (c, next) => {
  const path = c.req.path;
  
  // 跳过对 /init、/api/init、静态资源的检查
  if (path.startsWith('/init') || path.startsWith('/api/init') || path.startsWith('/admin') || path.startsWith('/static') || path.includes('.')) {
    return next();
  }
  
  try {
    const db = createDrizzleClient(c.env.DB);
    const isInitialized = await isDatabaseInitialized(db);
    
    if (!isInitialized && path !== '/init') {
      return c.redirect('/init');
    }
  } catch (error) {
    console.error('Database initialization check failed:', error);
    if (path !== '/init') {
      return c.redirect('/init');
    }
  }
  
  return next();
});

// ========== 初始化页面路由 ==========
app.get('/init', async (c) => {
  return c.html(<InitPage />);
});

app.get('/', async (c) => {
  const { search, page, type, tag, category, lang } = c.req.query()
  console.log(search, page, type, tag, category, lang)
  
  const db = createDrizzleClient(c.env.DB);
  let works;
  let totalCount = 0;
  let filterInfo = null;
  const currentPage = parseInt(page) || 1;
  const pageSize = 10;
  const preferredLanguage = lang || 'auto';
  
  if (search) {
    works = await searchWorks(db, search, type as 'title' | 'creator' | 'all' || 'all')
    totalCount = works.length; // Search returns all results
  } else if (tag) {
    works = await getWorksByTag(db, tag, currentPage, pageSize)
    totalCount = await getWorkCountByTag(db, tag)
    const tagInfo = await getTagByUUID(db, tag)
    if (tagInfo) {
      filterInfo = {
        type: 'tag' as const,
        name: tagInfo.name,
        uuid: tag
      }
    }
  } else if (category) {
    works = await getWorksByCategory(db, category, currentPage, pageSize)
    totalCount = await getWorkCountByCategory(db, category)
    const categoryInfo = await getCategoryByUUID(db, category)
    if (categoryInfo) {
      filterInfo = {
        type: 'category' as const, 
        name: categoryInfo.name,
        uuid: category
      }
    }
  } else {
    works = await getWorkListWithPagination(db, currentPage, pageSize)
    totalCount = await getTotalWorkCount(db)
  }
  
  const footerSettings = await getFooterSettings(db)
  const siteConfig = await getPublicSiteConfig(db)
  const availableLanguages = await getAvailableLanguages(db)
  return c.html(<IndexPage 
    works={works} 
    footerSettings={footerSettings}
    siteConfig={siteConfig}
    currentPage={currentPage}
    totalCount={totalCount}
    pageSize={pageSize}
    filterInfo={filterInfo}
    searchQuery={search || ''}
    preferredLanguage={preferredLanguage}
    availableLanguages={availableLanguages}
  />)
})

app.get('/player', async (c) => {
    const { uuid } = c.req.query()
    if (!uuid) {
        return c.notFound()
    }
    const db = createDrizzleClient(c.env.DB);
    const workInfo = await getWorkByUUID(db, uuid)
    if (!workInfo) {
        return c.notFound()
    }
    const footerSettings = await getFooterSettings(db)
    const siteConfig = await getPublicSiteConfig(db)
    return c.html(<PlayerPage workInfo={workInfo} footerSettings={footerSettings} siteConfig={siteConfig} />)
})

app.get('/tags-categories', async (c) => {
    const { lang } = c.req.query()
    const preferredLanguage = lang || 'auto';

    const db = createDrizzleClient(c.env.DB);
    const tags = await listTagsWithCounts(db);
    const categories = await listCategoriesWithCounts(db);
    const footerSettings = await getFooterSettings(db)
    const siteConfig = await getPublicSiteConfig(db)
    const availableLanguages = await getAvailableLanguages(db)

    return c.html(<TagsCategoriesPage
        tags={tags}
        categories={categories}
        footerSettings={footerSettings}
        siteConfig={siteConfig}
        availableLanguages={availableLanguages}
        preferredLanguage={preferredLanguage}
    />)
})

export default app