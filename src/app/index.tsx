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
import { checkPendingMigrations } from './db/utils/migration-engine'

import { IndexPage } from './pages/index'
import { PlayerPage } from './pages/player'
import { InitPage } from './pages/init'
import { TagsCategoriesPage } from './pages/tags-categories'
import { AdminPage } from './pages/admin'
import { MigrationPage } from './pages/migration'
import { TestToolsPage } from './pages/test-tools'
import { AdminContentPage } from './pages/admin-content'
import { AdminEditorPage } from './pages/admin-editor'
import { UnauthorizedPage } from './pages/unauthorized'
import type { FormOptions } from './pages/components/admin/form/form-field-types'
import { loadAdminData, isValidAdminType } from './admin/data-loader'
import { createDrizzleClient } from './db/client'
import { getFooterSettings, getFooterByIndex, initializeDatabaseWithMigrations, isDatabaseInitialized } from './db/operations/admin'
import { getPublicSiteConfig, getSiteConfig } from './db/operations/config'
import { getWorkByIndex, getWorkListWithPagination, getTotalWorkCount } from './db/operations/work'
import { searchWorks, getAvailableLanguages } from './db/operations/search'
import { getWorksByTag, getWorkCountByTag, getTagByIndex, listTagsWithCounts } from './db/operations/tag'
import { getWorksByCategory, getWorkCountByCategory, getCategoryByIndex, listCategoriesWithCounts } from './db/operations/category'
import { listExternalSources } from './db/operations/external_source'
import { eq } from 'drizzle-orm'
import { tag, workTag, category, workCategory, work } from './db/schema'

const apiApp = new Hono<{ Bindings: CloudflareBindings }>()

apiApp.get('/', (c) => {
  return c.text('Hello Hono!')
})


// ========== 中间�?==========
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

// Admin content specific middleware with custom 401 page
const adminContentMiddleware = async (c: any, next: any) => {
    try {
        const db = createDrizzleClient(c.env.DB);
        const config = await getSiteConfig(db, 'jwt_secret');
        const secretKey = config?.value || c.env.JWT_SECRET as string;

        // Check for token in URL parameter first, then Authorization header
        const tokenFromQuery = c.req.query('token');
        let token = tokenFromQuery;

        if (!token) {
            // Fallback to Authorization header
            const authHeader = c.req.header('Authorization');
            if (authHeader && authHeader.startsWith('Bearer ')) {
                token = authHeader.substring(7);
            }
        }

        if (!token) {
            return c.html(<UnauthorizedPage />, 401);
        }

        // Manually verify the JWT token
        const { verify } = await import('hono/jwt');
        try {
            const payload = await verify(token, secretKey);
            // Set the payload in context for downstream handlers
            c.set('jwtPayload', payload);
            return await next();
        } catch (error) {
            console.error('JWT verification failed:', error);
            return c.html(<UnauthorizedPage />, 401);
        }
    } catch (error) {
        console.error('JWT middleware error:', error);
        return c.html(<UnauthorizedPage />, 401);
    }
}

// ========== 信息管理 ==========
// ---------- 删除信息 ----------
apiApp.use("/delete/*",middleware)
apiApp.route('/delete', deleteInfo)
// ---------- 修改信息 ----------
apiApp.use("/update/*",middleware)
apiApp.route('/update', updateInfo)
// ---------- 录入信息 ----------
apiApp.use("/input/*",middleware)
apiApp.route('/input', inputInfo)
// ========== 数据库迁�?==========
apiApp.use("/migration/*", middleware)
apiApp.route('/migration', migration)

// ========== 配置/权限 ==========
apiApp.route('/auth', auth)

// ========== 初始�?API（无需认证�?=========
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

const app = new Hono<{ Bindings: CloudflareBindings }>()
app.route('/api', apiApp)

// ========== 数据库版本检查中间件 ==========
// 检查数据库版本是否匹配最新迁移版�?
app.use('/*', async (c, next) => {
  const path = c.req.path;

  // 跳过�?/init�?migration�?api/init�?api/migration、静态资源的检�?
  if (path.startsWith('/init') || path.startsWith('/migration') ||
      path.startsWith('/api/init') || path.startsWith('/api/migration') ||
      path.startsWith('/static') || path.includes('.')) {
    return next();
  }

  try {
    const db = createDrizzleClient(c.env.DB);
    const isInitialized = await isDatabaseInitialized(db);

    // 如果未初始化,跳过版本检�?由下一个中间件处理)
    if (!isInitialized) {
      return next();
    }

    // 检查数据库版本
    const migrationStatus = await checkPendingMigrations(db);

    if (migrationStatus.currentVersion !== migrationStatus.latestVersion) {
      // 数据库版本不匹配
      if (path.startsWith('/admin')) {
        // 管理后台路由 -> 重定向到迁移页面
        return c.redirect('/migration');
      } else {
        // 其他主页路由 -> 返回 501 错误
        return c.text(
          `数据库版本不匹配。当前版�? ${migrationStatus.currentVersion}, 预期版本: ${migrationStatus.latestVersion}。\n` +
          `此功能需要数据库迁移才能使用。请联系管理员访�?/migration 页面进行数据库迁移。`,
          501
        );
      }
    }
  } catch (error) {
    console.error('Database version check failed:', error);
    // 版本检查失败时,允许继续(避免阻塞正常流程)
  }

  return next();
});

// ========== 初始化检查中间件 ==========
// 检查数据库是否已初始化，如果未初始化则重定向到 /init
app.use('/*', async (c, next) => {
  const path = c.req.path;
  
  // 跳过�?/init�?api/init、静态资源的检�?
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

// ========== 初始化页面路�?==========
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
    const tagInfo = await getTagByIndex(db, tag)
    if (tagInfo) {
      filterInfo = {
        type: 'tag' as const,
        name: tagInfo.name,
        index: tag
      }
    }
  } else if (category) {
    works = await getWorksByCategory(db, category, currentPage, pageSize)
    totalCount = await getWorkCountByCategory(db, category)
    const categoryInfo = await getCategoryByIndex(db, category)
    if (categoryInfo) {
      filterInfo = {
        type: 'category' as const,
        name: categoryInfo.name,
        index: category
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
    const { index, uuid } = c.req.query()
    const workIndex = index || uuid  // Support both 'index' and 'uuid' query params for backward compatibility
    if (!workIndex) {
        return c.notFound()
    }
    const db = createDrizzleClient(c.env.DB);
    const workInfo = await getWorkByIndex(db, workIndex)
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

app.get('/admin', async (c) => {
    const { tab } = c.req.query()
    const activeTab = tab && isValidAdminType(tab) ? tab : 'work';

    const db = createDrizzleClient(c.env.DB);
    const footerSettings = await getFooterSettings(db)

    return c.html(<AdminPage
        footerSettings={footerSettings}
        activeTab={activeTab}
    />)
})

app.get('/admin/content/:type', adminContentMiddleware, async (c) => {
    const type = c.req.param('type')

    if (!type || !isValidAdminType(type)) {
        return c.html(<AdminContentPage
            type={'unknown'}
            contentData={{ type: 'unknown', data: null, error: 'Invalid content type' }}
        />)
    }

    const db = createDrizzleClient(c.env.DB);
    const contentData = await loadAdminData(db, type);

    return c.html(<AdminContentPage
        type={type}
        contentData={contentData}
    />)
})

app.get('/admin/editor', adminContentMiddleware, async (c) => {
    const { type, index } = c.req.query()
    const db = createDrizzleClient(c.env.DB);

    let data = undefined;
    let options: FormOptions = {
        creators: [],
        tags: [],
        categories: [],
        works: [],
        allExternalSources: [],
        allExternalObjects: []
    };

    try {
        // 根据type和index获取数据
        if (index && type) {
            console.log(`Loading data for ${type} with index: ${index}`);

            switch (type) {
                case 'work':
                    data = await getWorkByIndex(db, index);
                    console.log('Loaded work data:', data);
                    break;
                case 'creator':
                    const { getCreatorByIndex } = await import('./db/operations/creator');
                    data = await getCreatorByIndex(db, index);
                    console.log('Loaded creator data:', data);
                    break;
                case 'tag':
                    data = await getTagByIndex(db, index);
                    console.log('Loaded tag data:', data);
                    break;
                case 'category':
                    data = await getCategoryByIndex(db, index);
                    console.log('Loaded category data:', data);
                    break;
                case 'asset':
                    const { getAssetByIndex } = await import('./db/operations/asset');
                    const assetData = await getAssetByIndex(db, index);
                    console.log('Loaded asset data:', assetData);

                    // Load work's tags and categories
                    if (assetData && assetData.work_index) {
                        const workTags = await db
                            .select({
                                index: tag.index,
                                name: tag.name,
                            })
                            .from(tag)
                            .innerJoin(workTag, eq(tag.id, workTag.tag_id))
                            .innerJoin(work, eq(workTag.work_id, work.id))
                            .where(eq(work.index, assetData.work_index));

                        const workCategories = await db
                            .select({
                                index: category.index,
                                name: category.name,
                            })
                            .from(category)
                            .innerJoin(workCategory, eq(category.id, workCategory.category_id))
                            .innerJoin(work, eq(workCategory.work_id, work.id))
                            .where(eq(work.index, assetData.work_index));

                        data = {
                            asset: assetData,
                            work_tags: workTags,
                            work_categories: workCategories
                        };
                    } else {
                        data = assetData;
                    }
                    break;
                case 'media':
                    const { getMediaByIndex } = await import('./db/operations/media');
                    const mediaData = await getMediaByIndex(db, index);
                    console.log('Loaded media data:', mediaData);

                    // Load work's tags and categories
                    if (mediaData && mediaData.work_index) {
                        const workTags = await db
                            .select({
                                index: tag.index,
                                name: tag.name,
                            })
                            .from(tag)
                            .innerJoin(workTag, eq(tag.id, workTag.tag_id))
                            .innerJoin(work, eq(workTag.work_id, work.id))
                            .where(eq(work.index, mediaData.work_index));

                        const workCategories = await db
                            .select({
                                index: category.index,
                                name: category.name,
                            })
                            .from(category)
                            .innerJoin(workCategory, eq(category.id, workCategory.category_id))
                            .innerJoin(work, eq(workCategory.work_id, work.id))
                            .where(eq(work.index, mediaData.work_index));

                        data = {
                            media: mediaData,
                            work_tags: workTags,
                            work_categories: workCategories
                        };
                    } else {
                        data = mediaData;
                    }
                    break;
                case 'relation':
                    const { getRelationByIndex } = await import('./db/operations/relation');
                    data = await getRelationByIndex(db, index);
                    console.log('Loaded relation data:', data);
                    break;
                case 'external_source':
                    const { getExternalSourceByIndex } = await import('./db/operations/external_source');
                    data = await getExternalSourceByIndex(db, index);
                    console.log('Loaded external_source data:', data);
                    break;
                case 'external_object':
                    const { getExternalObjectByIndex } = await import('./db/operations/external_object');
                    data = await getExternalObjectByIndex(db, index);
                    console.log('Loaded external_object data:', data);
                    break;
                case 'site_config':
                    // Site config使用key而不是index
                    try {
                        data = await getSiteConfig(db, index);
                        console.log('Loaded site_config data:', data);
                    } catch (error) {
                        console.error('Error loading site_config:', error);
                        data = undefined;
                    }
                    break;
                case 'wiki_platform':
                    // Wiki platform使用platform_key而不是index
                    try {
                        const { getWikiPlatformByKey } = await import('./db/operations/wiki-platforms');
                        data = await getWikiPlatformByKey(db, index);
                        console.log('Loaded wiki_platform data:', data);
                    } catch (error) {
                        console.error('Error loading wiki_platform:', error);
                        data = undefined;
                    }
                    break;
                case 'footer':
                    data = await getFooterByIndex(db, index);
                    console.log('Loaded footer data:', data);
                    break;
                default:
                    console.warn(`Unsupported type for data loading: ${type}`);
            }
        } else {
            console.log(`New item creation for type: ${type}`);
        }

        // 加载通用选项数据（用于下拉框等）
        console.log(`Loading options for type: ${type}`);

        // 根据表单类型加载相应的选项数据
        if (['work', 'asset'].includes(type)) {
            // 加载所有创作�?
            try {
                const { listCreators } = await import('./db/operations/creator');
                const allCreators = await listCreators(db, 1, 999);
                options.creators = allCreators || [];
                console.log(`Loaded ${options.creators.length} creators`);
            } catch (error) {
                console.error('Error loading creators:', error);
                options.creators = [];
            }
        }

        if (['media', 'asset', 'relation'].includes(type)) {
            // 加载所有作�?
            try {
                const allWorks = await getWorkListWithPagination(db, 1, 999);
                options.works = allWorks || [];
                console.log(`Loaded ${options.works.length} works`);
            } catch (error) {
                console.error('Error loading works:', error);
                options.works = [];
            }
        }

        if (type === 'work') {
            // 为work表单加载标签和分�?
            try {
                const tags = await listTagsWithCounts(db);
                options.tags = tags || [];
                console.log(`Loaded ${options.tags.length} tags`);

                const categories = await listCategoriesWithCounts(db);
                options.categories = categories || [];
                console.log(`Loaded ${options.categories.length} categories`);
            } catch (error) {
                console.error('Error loading tags/categories:', error);
                options.tags = [];
                options.categories = [];
            }
        }

        if (type === 'category') {
            // 为category表单加载分类（用于父分类选择�?
            try {
                const categories = await listCategoriesWithCounts(db);
                options.categories = categories || [];
                console.log(`Loaded ${options.categories.length} categories for parent selection`);
            } catch (error) {
                console.error('Error loading categories:', error);
                options.categories = [];
            }
        }

        // 加载外部存储源（所有表单都可能需要）
        try {
            const externalSources = await listExternalSources(db, 1, 999);
            options.allExternalSources = externalSources || [];
            console.log(`Loaded ${options.allExternalSources.length} external sources`);
        } catch (error) {
            console.error('Error loading external sources:', error);
            options.allExternalSources = [];
        }

        // 加载外部对象（用于media和asset表单�?
        try {
            const { listExternalObjects } = await import('./db/operations/external_object');
            const externalObjects = await listExternalObjects(db, 1, 999);
            options.allExternalObjects = externalObjects || [];
            console.log(`Loaded ${options.allExternalObjects.length} external objects`);
        } catch (error) {
            console.error('Error loading external objects:', error);
            options.allExternalObjects = [];
        }

    } catch (error) {
        console.error('Error loading editor data:', error);
        // 数据加载失败时仍然显示表单，但不填充数据
    }

    console.log(`Final data being passed to AdminEditorPage:`, {
        type,
        index,
        hasData: !!data,
        dataKeys: data ? Object.keys(data) : [],
        data: data ? JSON.stringify(data, null, 2) : 'undefined'
    });

    return c.html(<AdminEditorPage
        type={type}
        index={index}
        data={data ?? undefined}
        options={options}
    />)
})

app.get('/migration', async (c) => {
    const db = createDrizzleClient(c.env.DB);
    const footerSettings = await getFooterSettings(db)
    return c.html(<MigrationPage footerSettings={footerSettings} />)
})

app.get('/test-tools', async (c) => {
    const db = createDrizzleClient(c.env.DB);
    const footerSettings = await getFooterSettings(db)
    return c.html(<TestToolsPage footerSettings={footerSettings} />)
})

export default app
