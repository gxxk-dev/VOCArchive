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
- **路由结构**：
  - `/api/*` - REST API 端点
  - `/` - 作品列表主页（支持搜索、标签、分类过滤）
  - `/player?uuid=xxx` - 作品播放页面
  - `/tags-categories` - 标签和分类浏览页面
  - `/admin` - 管理后台（需要认证）
  - `/admin/content/:type` - 管理后台内容列表（需要认证）
  - `/admin/editor?type=xxx&uuid=xxx` - 管理后台编辑器（需要认证）
  - `/init` - 数据库初始化页面
  - `/migration` - 数据库迁移管理页面

### 2. 认证系统

- **实现位置**：`src/app/auth.ts`
- **认证方式**：
  - TOTP（基于时间的一次性密码）用于登录
  - JWT（JSON Web Token）用于会话管理（默认 8 小时过期）
- **认证配置优先级**：数据库配置（site_config 表）> 环境变量
- **受保护的路由**：
  - `/api/delete/*` - 删除操作
  - `/api/update/*` - 更新操作
  - `/api/input/*` - 创建操作
  - `/api/migration/*` - 迁移管理
  - `/admin/content/:type` - 管理后台内容
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
- 使用 TypeScript strict 模式
- JSX 使用 Hono JSX（不是 React）
- 数据库客户端通过 `createDrizzleClient(c.env.DB)` 创建
- 统一使用 async/await，不使用 Promise callbacks

## 项目状态

- 当前版本：0.0.1（早期开发阶段）
- 文档站点：https://vocarchive.com（正在构建中）
- 许可证：AGPL v3 (or-later)
- 注意：0.0.0 版本内存在大量 BREAKING CHANGES
