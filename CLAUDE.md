# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

VOCArchive - 基于 Cloudflare Workers 的泛 VOCALOID 歌曲存档系统。

**技术栈**：
- **运行环境**：Cloudflare Workers
- **数据库**：Cloudflare D1 (SQLite)
- **Web 框架**：Hono v4
- **ORM**：Drizzle ORM
- **认证**：JWT + TOTP (otplib)
- **渲染**：服务端渲染 (Hono JSX)

## 常用命令

### 开发和部署
```bash
npm run dev                  # 本地开发服务器（自动生成版本信息）
npm run deploy               # 部署到 Cloudflare（生产环境）
npm run cf-typegen           # 生成 Cloudflare Workers 类型定义
```

### 数据库操作
```bash
npm run db:generate          # 生成 Drizzle 迁移文件（基于 schema.ts）
npm run db:push              # 推送数据库 schema 变更到 D1
npm run db:studio            # 启动 Drizzle Studio（数据库可视化工具）
npm run db:export            # 导出本地数据库为 SQL 文件
npm run db:export:prod       # 导出生产环境数据库为 SQL 文件
```

### 构建脚本
```bash
npm run build:migrations     # 生成迁移注册表（扫描 src/migrations/ 目录）
npm run build:version        # 生成版本信息文件（包含 git commit 等信息）
npm run build:version:prod   # 生成生产环境版本信息
```

## 核心架构

### 1. 应用入口和路由

- **入口文件**：`src/app/index.tsx`
- **架构设计**：采用分层中间件架构，自顶向下执行以下流程：
  1. **全局数据库中间件** - 为所有路由注入 DB 客户端（通过 `c.get('db')` 访问）
  2. **API 路由挂载** (`/api/*`) - 独立的 API 应用（包含自己的 JWT 认证）
  3. **数据库版本检查中间件** - 确保数据库版本与代码版本匹配
     - 版本不匹配时：管理后台路由重定向到 `/migration`，其他路由返回 501 错误
  4. **初始化检查中间件** - 确保数据库已初始化
     - 未初始化时重定向到 `/init` 页面
  5. **页面路由挂载** (`/`) - 所有 SSR 页面路由
  6. **错误处理** - 404 和全局错误处理

- **路由配置文件**：
  - `src/app/routes/api.ts` - API 路由配置（`createApiApp()` 工厂函数）
  - `src/app/routes/pages.tsx` - 页面路由配置（`createPageRoutes()` 工厂函数）

- **路由结构**：
  - `/api/*` - REST API 端点（详见 API 路由配置）
  - `/` - 作品列表主页（支持搜索、标签、分类过滤）
  - `/player?uuid=xxx` - 作品播放页面
  - `/tags-categories` - 标签和分类浏览页面
  - `/admin` - 管理后台主页（标签导航）
  - `/admin/content/:type` - 管理后台内容列表（需要 JWT 认证）
  - `/admin/editor?type=xxx&uuid=xxx` - 管理后台编辑器（需要 JWT 认证）
  - `/init` - 数据库初始化页面
  - `/migration` - 数据库迁移管理页面
  - `/test-tools` - 测试工具页面

**API 路由结构** (`/api/*`)：
- `/api/auth` - 认证接口（TOTP 登录、JWT 生成）
- `/api/init` - 数据库初始化接口
- `/api/delete/*` - 删除操作（需要 JWT 认证）
- `/api/update/*` - 更新操作（需要 JWT 认证）
- `/api/input/*` - 创建操作（需要 JWT 认证）
- `/api/migration/*` - 迁移管理（需要 JWT 认证）
- `/api/get/*` - 获取数据（无需认证）
- `/api/search/*` - 搜索数据（无需认证）
- `/api/list/*` - 列出数据（无需认证）
- `/api/footer` - 页脚配置
- `/api/config` - 站点配置

### 2. 认证系统

- **实现位置**：
  - 认证路由：`src/app/routes/auth.ts`
  - JWT 中间件：`src/app/middleware/jwt.ts`

- **认证方式**：
  - **TOTP**（基于时间的一次性密码）用于登录
  - **JWT**（JSON Web Token）用于会话管理（默认 8 小时过期）

- **认证配置优先级**：数据库配置（site_config 表）> 环境变量
  - `jwt_secret` - JWT 签名密钥
  - `totp_secret` - TOTP 验证密钥

- **JWT 中间件特性**：
  - 支持从 `Authorization: Bearer <token>` header 获取 token
  - 支持从 URL 查询参数获取 token（`?token=xxx`，可配置）
  - 支持自定义 401 未授权响应页面（用于管理后台）
  - 自动从数据库读取 jwt_secret，fallback 到环境变量

- **受保护的路由**：
  - **API 路由**（仅支持 Authorization header）：
    - `/api/delete/*` - 删除操作
    - `/api/update/*` - 更新操作
    - `/api/input/*` - 创建操作
    - `/api/migration/*` - 迁移管理
  - **页面路由**（支持 URL token 和自定义 401 页面）：
    - `/admin/content/:type` - 管理后台内容列表
    - `/admin/editor` - 管理后台编辑器

### 3. 数据库架构

**Schema 定义**：`src/app/db/schema.ts`

**核心实体表**（无外键依赖）：
- `work` - 作品（核心实体，copyright_basis 字段控制版权基础）
- `creator` - 创作者（type: 'human' | 'virtual'）
- `tag` - 标签
- `category` - 分类（支持父分类，parent_id 字段）
- `external_source` - 外部存储源（支持 raw_url 和 IPFS，包含 endpoint 配置）
- `site_config` - 站点配置（key-value 存储）
- `wiki_platform` - Wiki 平台配置（用于生成 Wiki 链接）
- `footer_settings` - 页脚设置

**关联表**：
- `work_title` - 作品标题（多语言支持，is_official 和 is_for_search 字段）
- `work_creator` - 作品-创作者关联（role 字段表示创作角色）
- `work_tag` - 作品-标签关联
- `work_category` - 作品-分类关联
- `work_relation` - 作品关系（original/remix/cover/remake/picture/lyrics）
- `work_wiki` - 作品 Wiki 链接
- `creator_wiki` - 创作者 Wiki 链接

**媒体和资源表**：
- `media_source` - 媒体源（音频/视频，is_music 字段区分类型）
- `asset` - 资产（歌词/图片，asset_type 字段，is_previewpic 标记预览图）
- `external_object` - 外部对象（存储在外部存储源的实际文件）
- `asset_external_object` - 资产-外部对象关联
- `media_source_external_object` - 媒体源-外部对象关联
- `asset_creator` - 资产-创作者关联

**重要说明**：
- 所有主要实体使用 `id` (自增整数) 作为内部主键
- 所有主要实体使用 `uuid` (文本) 作为外部唯一标识符
- 关联表使用复合主键
- 外键均设置 `onDelete: 'cascade'` 确保级联删除

### 4. 数据库操作模块

所有数据库操作函数位于 `src/app/db/operations/` 目录，按实体分模块：

- `admin.ts` - 管理功能（初始化检查、页脚设置等）
- `work.ts` - 作品相关操作（CRUD、分页列表、关联查询）
- `creator.ts` - 创作者操作
- `tag.ts` - 标签操作（包含作品计数）
- `category.ts` - 分类操作（包含作品计数、父分类关系）
- `asset.ts` - 资产操作
- `media.ts` - 媒体源操作
- `external_source.ts` - 外部存储源操作
- `external_object.ts` - 外部对象操作
- `relation.ts` - 作品关系操作
- `search.ts` - 搜索功能（支持按标题、创作者搜索）
- `config.ts` - 站点配置操作（包含数据库版本管理）
- `wiki-platforms.ts` - Wiki 平台配置操作
- `work-title.ts` - 作品标题操作（多语言支持）

**操作模式**：
- 使用 Drizzle ORM 进行类型安全的数据库查询
- 复杂查询使用 `with` 进行关联加载
- UUID 与 ID 的转换通过 `src/app/db/utils/uuid-id-converter.ts` 处理

### 5. 数据库迁移系统

**这是一个自定义迁移系统，不使用 Drizzle Kit 的迁移功能。**

**核心文件**：
- `src/app/db/utils/migration-engine.ts` - 迁移执行引擎
- `src/app/db/utils/migration-scanner.ts` - 迁移文件扫描器
- `src/app/db/utils/migration-registry.ts` - 迁移注册表（自动生成）
- `src/migrations/` - 迁移文件目录

**迁移文件结构**：
- 文件名格式：`001_description.ts`, `002_description.ts`, ...
- 每个迁移导出：
  - `version` (number) - 版本号
  - `description` (string) - 描述
  - `parameters` (optional) - 参数定义
  - `up(db, params?)` - 升级函数
  - `down(db, params?)` - 回滚函数

**迁移工作流**：
1. 修改 `src/app/db/schema.ts`
2. 运行 `npm run db:generate` 生成 Drizzle 迁移（参考用）
3. 在 `src/migrations/` 创建迁移文件（参考 `_template.ts`）
4. 运行 `npm run build:migrations` 生成注册表
5. 通过 `/migration` 页面或 API 执行迁移

**迁移特性**：
- 支持版本管理（存储在 site_config 表的 db_version 键）
- 支持参数化迁移（运行时传入参数）
- 支持干运行模式（dryRun）
- 支持回滚（如果实现了 down 函数）
- 支持批量执行和部分执行
- 自动验证迁移序列

### 6. 页面组件（SSR）

- **位置**：`src/app/pages/`
- **渲染方式**：使用 Hono JSX 进行服务端渲染
- **布局**：`layouts/base-layout.tsx` - 基础布局模板
- **主要页面**：
  - `index.tsx` - 首页（作品列表）
  - `player.tsx` - 播放器页面
  - `admin.tsx` - 管理后台主页（标签导航）
  - `admin-content.tsx` - 管理后台内容列表
  - `admin-editor.tsx` - 管理后台编辑器（动态表单）
  - `tags-categories.tsx` - 标签和分类浏览
  - `init.tsx` - 初始化页面
  - `migration.tsx` - 迁移管理页面

**组件设计**：
- 支持客户端脚本注入（`pages/scripts/` 目录）
- 管理后台使用动态表单系统（`pages/components/admin/form/`）
- 表单配置位于 `pages/components/admin/form/form-config.ts`

### 7. 中间件系统

**位置**：`src/app/middleware/`

项目采用中间件架构，将横切关注点（数据库访问、认证、错误处理）从业务逻辑中分离。

#### 7.1 数据库中间件 (`database.ts`)

**功能**：统一管理数据库客户端创建和注入

```typescript
// 使用方式
app.use('/*', databaseMiddleware)

// 在路由处理器中访问
const db = c.get('db')  // 类型安全的 DrizzleDB 实例
```

**特性**：
- 自动创建 Drizzle 客户端并注入到上下文 (`c.get('db')`)
- 避免在每个路由处理器中重复创建客户端
- 扩展 Hono 上下文类型，提供类型安全的 DB 访问

#### 7.2 JWT 认证中间件 (`jwt.ts`)

**功能**：统一管理 JWT 验证逻辑

```typescript
// 创建 JWT 中间件（支持自定义选项）
const jwtMiddleware = createJWTMiddleware({
    allowTokenInQuery: true,  // 允许从 URL 参数获取 token
    customUnauthorizedResponse: (c) => c.html(<UnauthorizedPage />, 401)
})
```

**中间件选项** (`JWTMiddlewareOptions`)：
- `allowTokenInQuery` - 是否允许从 URL 查询参数中获取 token（默认：false）
- `customUnauthorizedResponse` - 自定义 401 未授权响应（用于返回 HTML 页面）

**Token 提取优先级**（当 `allowTokenInQuery=true` 时）：
1. URL 查询参数 (`?token=xxx`)
2. Authorization header (`Authorization: Bearer <token>`)

**Secret 获取优先级**：
1. 数据库配置（site_config 表的 `jwt_secret` 键）
2. 环境变量 (`c.env.JWT_SECRET`)

#### 7.3 错误处理中间件 (`error-handler.ts`)

**功能**：统一错误处理和日志记录

**自定义错误类型**：
- `AppError` - 应用错误基类（支持 statusCode 和 code）
- `DatabaseError` - 数据库错误（500）
- `ValidationError` - 验证错误（400，支持字段详情）
- `NotFoundError` - 未找到错误（404）
- `UnauthorizedError` - 未授权错误（401）

**使用方式**：
```typescript
// 全局错误处理
app.onError(errorHandler)

// 404 处理
app.notFound(notFoundHandler)

// 在路由中抛出错误
throw new NotFoundError('Work')
throw new ValidationError('Invalid input', { title: '标题不能为空' })
```

**错误响应格式**：
```json
{
    "success": false,
    "error": "错误消息",
    "code": "ERROR_CODE",
    "statusCode": 400,
    "fields": { "fieldName": "错误详情" },
    "stack": "..."
}
```

### 8. 服务层

**位置**：`src/app/services/`

服务层封装复杂的业务逻辑，将数据加载逻辑从路由处理器中分离，提供清晰的职责划分。

#### 8.1 页面数据服务 (`page-service.ts`)

**功能**：封装页面数据加载逻辑，支持数据并行加载优化性能

**主要函数**：
- `loadIndexPageData(db, params)` - 加载首页数据（作品列表、分页、过滤、搜索）
- `loadPlayerPageData(db, workIndex)` - 加载播放器页面数据（作品详情、相关数据）
- `loadTagsCategoriesPageData(db, lang?)` - 加载标签分类页面数据
- `loadAdminPageData(db, tab?)` - 加载管理后台主页数据
- `loadSimplePageData(db)` - 加载简单页面数据（仅页脚设置）

**设计特点**：
- 使用 `Promise.all()` 并行加载多个数据源，提升性能
- 返回结构化的页面数据对象（符合类型定义）
- 集中处理数据加载逻辑，路由层只负责调用和渲染

**使用示例**：
```typescript
// 在路由处理器中
pageApp.get('/', async (c) => {
    const db = c.get('db');
    const pageData = await loadIndexPageData(db, c.req.query());
    return c.html(<IndexPage {...pageData} />)
})
```

#### 8.2 管理后台编辑器服务 (`admin-editor-service.ts`)

**功能**：封装编辑器页面的复杂业务逻辑，包括数据加载和表单选项加载

**主要函数**：
- `loadEditorData(db, type, index?)` - 加载编辑器数据（根据类型和索引）
- `loadFormOptions(db, type)` - 加载表单选项数据（创作者、标签、分类等）
- `loadEditorFullData(db, type, index?)` - 加载完整编辑器数据（数据 + 选项）

**支持的数据类型**：
- `work`, `creator`, `tag`, `category`
- `asset`, `media`, `relation`
- `external_source`, `external_object`
- `site_config`, `wiki_platform`, `footer`

**设计特点**：
- 根据数据类型动态加载相应的选项（如 work 表单需要标签和分类选项）
- 使用 `Promise.all()` 并行加载数据和选项
- 特殊处理：asset 和 media 数据包含所属作品的标签和分类信息

### 9. 类型系统

**位置**：`src/app/types/`

项目使用 TypeScript 严格模式，所有数据结构都有明确的类型定义。

#### 9.1 页面数据类型 (`page-data.ts`)

**核心类型**：
- `WorkInfo` - 作品信息（包含标题、创作者、标签、分类、媒体、资产）
- `CreatorInfo` - 创作者信息
- `TagInfo`, `TagWithCount` - 标签信息（带/不带作品计数）
- `CategoryInfo`, `CategoryWithCount` - 分类信息（带/不带作品计数）
- `MediaSource` - 媒体源信息
- `Asset` - 资产信息
- `FooterSettings` - 页脚设置
- `SiteConfig` - 站点配置

**页面数据类型**：
- `IndexPageData` - 首页数据（作品列表、分页、过滤、搜索）
- `PlayerPageData` - 播放器页面数据
- `TagsCategoriesPageData` - 标签分类页面数据
- `AdminPageData` - 管理后台主页数据
- `SimplePageData` - 简单页面数据

#### 9.2 管理后台数据类型 (`admin-data.ts`)

**核心类型**：
- `FormOptions` - 表单选项（创作者、标签、分类、作品、外部资源）
- `ExternalSource` - 外部存储源
- `ExternalObject` - 外部对象
- `WorkRelation` - 作品关系
- `SiteConfigItem` - 站点配置项
- `WikiPlatform` - Wiki 平台
- `FooterSettingsItem` - 页脚设置项

**特殊类型**：
- `AssetWithWorkInfo` - 资产数据（带作品标签和分类）
- `MediaWithWorkInfo` - 媒体源数据（带作品标签和分类）
- `EditorData` - 编辑器数据联合类型
- `EditorFullData` - 编辑器完整数据（数据 + 选项）

**类型复用**：
- admin-data 复用 page-data 中的基础类型（如 `WorkInfo`, `CreatorInfo`）
- 避免类型重复定义，保持类型一致性

### 10. 管理后台业务逻辑

**位置**：`src/app/admin/`

#### 10.1 数据加载器 (`data-loader.ts`)

**功能**：统一的管理后台数据加载器，根据类型获取对应数据

**核心类型**：
```typescript
type AdminDataType =
    | 'work' | 'creator' | 'media' | 'asset' | 'relation'
    | 'tag' | 'category' | 'external_source' | 'external_object'
    | 'footer' | 'site_config' | 'wiki_platform' | 'migration'
```

**主要函数**：
- `loadAdminData(db, type)` - 加载指定类型的管理数据
- `getSupportedAdminTypes()` - 获取支持的数据类型列表
- `isValidAdminType(type)` - 验证数据类型是否有效（类型守卫）

**使用示例**：
```typescript
const contentData = await loadAdminData(db, 'work');
// 返回: { type: 'work', data: [...], error?: string }
```

**错误处理**：
- 捕获所有数据加载错误，返回错误信息而不是抛出异常
- 便于在页面层统一处理错误显示

## 开发注意事项

### 数据库相关
- **不要直接使用 Drizzle Kit 的迁移**：项目使用自定义迁移系统
- **UUID vs ID**：API 和 URL 使用 UUID，内部查询使用 ID（性能考虑）
- **外部存储**：media_source 和 asset 的 `url` 和 `file_id` 字段已废弃，改用 external_object 关联

### 认证相关
- JWT Secret 和 TOTP Secret 优先从数据库 site_config 读取，环境变量作为 fallback
- JWT 默认有效期 8 小时
- 管理后台支持 URL 参数传递 token：`?token=xxx`

### 部署相关
- Cloudflare Workers 限制：不支持 Node.js 所有 API，使用 `nodejs_compat` 兼容标志
- 静态资源位于 `public/` 目录，通过 `assets.directory` 配置
- 部署前自动生成版本信息（git commit hash、时间戳等）

### 代码风格

**TypeScript 规范**：
- 使用 TypeScript strict 模式
- 所有数据结构使用类型定义（位于 `src/app/types/`）
- 避免使用 `any`，优先使用明确的类型或联合类型

**框架使用**：
- JSX 使用 Hono JSX（不是 React）
- 路由使用工厂函数创建（`createApiApp()`, `createPageRoutes()`）
- 统一使用 async/await，不使用 Promise callbacks

**架构模式**：
- **数据库访问**：
  - 不要直接创建数据库客户端，使用 `c.get('db')` 获取注入的实例
  - 数据库操作函数位于 `src/app/db/operations/` 目录

- **数据加载**：
  - 页面数据加载使用服务层（`src/app/services/page-service.ts`）
  - 管理后台数据加载使用编辑器服务和数据加载器
  - 使用 `Promise.all()` 并行加载多个数据源

- **路由处理**：
  - 路由处理器职责：接收请求 → 调用服务层 → 渲染响应
  - 不要在路由处理器中直接调用数据库操作函数
  - 复杂业务逻辑封装到服务层

- **认证和授权**：
  - API 路由使用 `createJWTMiddleware()` 保护敏感操作
  - 页面路由使用带选项的 JWT 中间件（支持 URL token 和自定义 401 页面）
  - 不要手动验证 JWT，使用中间件

- **错误处理**：
  - 使用自定义错误类型（`NotFoundError`, `ValidationError`, `DatabaseError` 等）
  - 不要返回通用的 Error，使用具有语义的错误类型
  - 全局错误处理已配置，无需在每个路由中 try-catch

**命名规范**：
- 文件名：kebab-case（如 `page-service.ts`, `admin-editor-service.ts`）
- 类型名：PascalCase（如 `IndexPageData`, `FormOptions`）
- 函数名：camelCase（如 `loadIndexPageData`, `createJWTMiddleware`）
- 常量名：UPPER_SNAKE_CASE（如数据库配置键）

## 项目状态

- 当前版本：0.0.1（早期开发阶段）
- 文档站点：https://vocarchive.com（正在构建中）
- 许可证：AGPL v3 (or-later)
- 注意：0.0.0 版本内存在大量 BREAKING CHANGES
