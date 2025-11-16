// 页面路由
// Page Routes

import { Hono } from 'hono'
import { createJWTMiddleware } from '../middleware/jwt'

import { IndexPage } from '../pages/index'
import { PlayerPage } from '../pages/player'
import { InitPage } from '../pages/init'
import { TagsCategoriesPage } from '../pages/tags-categories'
import { AdminPage } from '../pages/admin'
import { MigrationPage } from '../pages/migration'
import { TestToolsPage } from '../pages/test-tools'
import { AdminContentPage } from '../pages/admin-content'
import { AdminEditorPage } from '../pages/admin-editor'
import { UnauthorizedPage } from '../pages/unauthorized'

import { loadAdminData, isValidAdminType } from '../admin/data-loader'
import { loadEditorFullData } from '../services/admin-editor-service'
import {
    loadIndexPageData,
    loadPlayerPageData,
    loadTagsCategoriesPageData,
    loadAdminPageData,
    loadSimplePageData
} from '../services/page-service'

/**
 * 创建并配置页面路由
 *
 * 所有页面路由都使用数据库中间件(通过主应用注入)
 * 管理后台相关页面需要 JWT 认证
 */
export function createPageRoutes() {
    const pageApp = new Hono<{ Bindings: CloudflareBindings }>()

    // 管理后台中间件(支持 URL 参数 token,自定义 401 页面)
    const adminContentMiddleware = createJWTMiddleware({
        allowTokenInQuery: true,
        customUnauthorizedResponse: (c) => c.html(<UnauthorizedPage />, 401) as Response
    })

    // ========== 初始化页面路由 ==========
    pageApp.get('/init', async (c) => {
        return c.html(<InitPage />);
    });

    // ========== 首页 ==========
    pageApp.get('/', async (c) => {
        const db = c.get('db');
        const pageData = await loadIndexPageData(db, c.req.query());

        return c.html(<IndexPage {...pageData as any} />)
    })

    // ========== 播放器页面 ==========
    pageApp.get('/player', async (c) => {
        const { index, uuid } = c.req.query()
        const workIndex = index || uuid  // Support both 'index' and 'uuid' query params for backward compatibility
        if (!workIndex) {
            return c.notFound()
        }

        const db = c.get('db');
        const pageData = await loadPlayerPageData(db, workIndex);
        if (!pageData) {
            return c.notFound()
        }

        return c.html(<PlayerPage {...pageData as any} />)
    })

    // ========== 标签和分类页面 ==========
    pageApp.get('/tags-categories', async (c) => {
        const { lang } = c.req.query()
        const db = c.get('db');
        const pageData = await loadTagsCategoriesPageData(db, lang);

        return c.html(<TagsCategoriesPage {...pageData as any} />)
    })

    // ========== 管理后台主页 ==========
    pageApp.get('/admin', async (c) => {
        const { tab } = c.req.query()
        const activeTab = tab && isValidAdminType(tab) ? tab : 'work';

        const db = c.get('db');
        const pageData = await loadAdminPageData(db, activeTab);

        return c.html(<AdminPage {...pageData as any} />)
    })

    // ========== 管理后台内容列表(需要认证) ==========
    pageApp.get('/admin/content/:type', adminContentMiddleware, async (c) => {
        const type = c.req.param('type')

        if (!type || !isValidAdminType(type)) {
            return c.html(<AdminContentPage
                type={'unknown'}
                contentData={{ type: 'unknown', data: null, error: 'Invalid content type' }}
            />)
        }

        const db = c.get('db');
        const contentData = await loadAdminData(db, type);

        return c.html(<AdminContentPage
            type={type}
            contentData={contentData}
        />)
    })

    // ========== 管理后台编辑器(需要认证) ==========
    pageApp.get('/admin/editor', adminContentMiddleware, async (c) => {
        const { type, uuid } = c.req.query()
        const db = c.get('db');

        // 使用服务层加载编辑器数据和选项
        const { data, options } = await loadEditorFullData(db, type, uuid);

        return c.html(<AdminEditorPage
            type={type}
            uuid={uuid}
            data={data ?? undefined as any}
            options={options as any}
        />)
    })

    // ========== 迁移管理页面 ==========
    pageApp.get('/migration', async (c) => {
        const db = c.get('db');
        const pageData = await loadSimplePageData(db);
        return c.html(<MigrationPage {...pageData as any} />)
    })

    // ========== 测试工具页面 ==========
    pageApp.get('/test-tools', async (c) => {
        const db = c.get('db');
        const pageData = await loadSimplePageData(db);
        return c.html(<TestToolsPage {...pageData as any} />)
    })

    return pageApp
}
