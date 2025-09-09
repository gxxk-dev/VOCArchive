# VOCArchive Drizzle ORM 重构计划

## 项目概述

将 VOCArchive 项目从原生 SQL 查询迁移到 Drizzle ORM，以提供类型安全的数据库操作、更好的开发体验和维护性。

## 阶段 1: 环境准备与依赖安装

### 1.1 安装依赖包
- [x] 安装 `drizzle-orm` 核心包
- [x] 安装 `drizzle-kit` 开发工具
- [x] 安装 `@libsql/client` (Cloudflare D1 兼容驱动)
- [x] 安装相关类型定义包

```bash
npm install drizzle-orm @libsql/client
npm install -D drizzle-kit
```

### 1.2 配置 Drizzle
- [x] 创建 `drizzle.config.ts` 配置文件
- [x] 配置 Cloudflare D1 连接设置
- [x] 设置 schema 文件路径和迁移目录

## 阶段 2: Schema 定义

### 2.1 创建核心 Schema 文件
- [x] 创建 `src/app/db/schema.ts` 文件
- [x] 定义所有数据表的 Drizzle schema

#### 核心表定义 (按依赖顺序):
1. **基础表** (无外键依赖):
   - [x] `creator` - 创作者表
   - [x] `work` - 作品表
   - [x] `tag` - 标签表 
   - [x] `category` - 分类表
   - [x] `footer_settings` - 页脚设置表

2. **关联表** (有外键依赖):
   - [x] `creator_wiki` - 创作者Wiki信息
   - [x] `work_title` - 作品标题(多语言)
   - [x] `work_license` - 作品许可证
   - [x] `media_source` - 媒体源文件
   - [x] `asset` - 资产文件
   - [x] `work_creator` - 作品-创作者关联
   - [x] `asset_creator` - 资产-创作者关联
   - [x] `work_relation` - 作品关系
   - [x] `work_wiki` - 作品Wiki信息
   - [x] `work_tag` - 作品-标签关联
   - [x] `work_category` - 作品-分类关联

### 2.2 类型定义优化
- [x] 使用 Drizzle 的 `InferSelectModel` 和 `InferInsertModel` 类型
- [x] 重构现有 TypeScript 接口以匹配 Drizzle schema
- [x] 创建复合查询结果类型 (如 `WorkInfo`, `WorkListItem` 等)

## 阶段 3: 数据库客户端重构

### 3.1 创建数据库连接模块
- [x] 创建 `src/app/db/client.ts`
- [x] 配置 Drizzle 客户端初始化
- [x] 处理 Cloudflare Workers 环境下的连接管理

### 3.2 重构数据库操作模块
- [x] 将 `database.ts` 重构为模块化结构:
  - [x] `src/app/db/operations/work.ts` - 作品相关操作
  - [x] `src/app/db/operations/creator.ts` - 创作者相关操作
  - [x] `src/app/db/operations/media.ts` - 媒体相关操作
  - [x] `src/app/db/operations/asset.ts` - 资产相关操作
  - [x] `src/app/db/operations/tag.ts` - 标签相关操作
  - [x] `src/app/db/operations/category.ts` - 分类相关操作
  - [x] `src/app/db/operations/search.ts` - 搜索相关操作
  - [x] `src/app/db/operations/admin.ts` - 管理相关操作

## 阶段 4: 查询操作重构 ✅

### 4.1 基础 CRUD 操作重构 (按优先级)

#### 高优先级 - 核心功能:
1. **作品查询 (Work Operations)**:
   - [x] `GetWorkListWithPagination` - 分页作品列表
   - [x] `GetWorkByUUID` - 单个作品详情查询
   - [x] `GetTotalWorkCount` - 作品总数统计
   - [x] `InputWork` - 创建作品 (需要事务处理)
   - [x] `UpdateWork` - 更新作品 (需要事务处理)
   - [x] `DeleteWork` - 删除作品

2. **搜索功能 (Search Operations)**:
   - [x] `SearchWorks` - 综合搜索
   - [x] `SearchWorksByTitle` - 标题搜索  
   - [x] `SearchWorksByCreator` - 创作者搜索
   - [x] `GetAvailableLanguages` - 获取可用语言

3. **标签/分类系统 (Tag/Category Operations)**:
   - [x] `GetWorksByTag` - 按标签筛选作品
   - [x] `GetWorksByCategory` - 按分类筛选作品
   - [x] `GetWorkCountByTag` - 标签作品计数
   - [x] `GetWorkCountByCategory` - 分类作品计数
   - [x] `ListTags` - 标签列表
   - [x] `ListCategories` - 分类树形结构

#### 中优先级 - 管理功能:
4. **创作者管理 (Creator Operations)**:
   - [x] `GetCreatorByUUID` - 创作者详情
   - [x] `ListCreators` - 创作者列表
   - [x] `InputCreator` - 创建创作者
   - [x] `UpdateCreator` - 更新创作者
   - [x] `DeleteCreator` - 删除创作者

5. **媒体/资产管理 (Media/Asset Operations)**:
   - [x] `GetMediaByUUID` - 媒体详情
   - [x] `GetAssetByUUID` - 资产详情
   - [x] `GetFileURLByUUID` - 文件URL获取
   - [x] `ListMedia` - 媒体列表
   - [x] `ListAssets` - 资产列表
   - [x] `InputMedia` - 创建媒体
   - [x] `InputAsset` - 创建资产

#### 低优先级 - 辅助功能:
6. **关系管理 (Relation Operations)**:
   - [x] `GetRelationByUUID` - 关系详情
   - [x] `ListRelations` - 关系列表
   - [x] `InputRelation` - 创建关系
   - [x] `UpdateRelation` - 更新关系
   - [x] `DeleteRelation` - 删除关系

7. **标签/分类管理 (Tag/Category Management)**:
   - [x] `InputTag` / `InputCategory` - 创建标签/分类
   - [x] `UpdateTag` / `UpdateCategory` - 更新标签/分类
   - [x] `DeleteTag` / `DeleteCategory` - 删除标签/分类
   - [x] `AddWorkTags` / `RemoveWorkTags` - 作品标签关联管理
   - [x] `AddWorkCategories` / `RemoveWorkCategories` - 作品分类关联管理

### 4.2 复杂查询优化
- [x] 使用 Drizzle 的关系查询替代手工 JOIN
- [x] 优化多表关联查询性能
- [x] 实现批量操作和事务处理

### 4.3 路由层部分集成 ✅
- [x] 更新 `routes/get.ts` - 数据获取路由
- [x] 更新 `routes/search.ts` - 搜索路由
- [x] 更新 `routes/list.ts` - 数据列表路由
- [x] 更新 `routes/input.ts` - 数据创建路由
- [x] 更新 `routes/update.ts` - 数据更新路由
- [x] 更新 `routes/delete.ts` - 数据删除路由
- [x] 更新 `routes/footer.ts` - 页脚管理路由
- [x] 更新主应用路由 (`index.tsx`) 中的数据库调用

## 阶段 5: 迁移系统重构 ✅

### 5.1 Schema 迁移
- [x] 生成初始 Drizzle 迁移文件 (`drizzle-kit generate`)
- [x] 验证生成的迁移与现有 `initdb.sql` 的兼容性
- [x] 创建数据迁移脚本 (如果需要)

### 5.2 数据库初始化重构
- [x] 重构 `DropUserTables` 使用 Drizzle schema
- [x] 重构 `ExportAllTables` 使用 Drizzle 查询
- [x] 更新数据库初始化逻辑

## 阶段 6: 路由层集成 ✅

### 6.1 API 路由更新 (按模块)
1. **核心数据路由**:
   - [x] `routes/get.ts` - 数据获取路由
   - [x] `routes/list.ts` - 数据列表路由
   - [x] `routes/search.ts` - 搜索路由

2. **数据修改路由**:
   - [x] `routes/input.ts` - 数据创建路由
   - [x] `routes/update.ts` - 数据更新路由
   - [x] `routes/delete.ts` - 数据删除路由

3. **辅助路由**:
   - [x] `routes/footer.ts` - 页脚管理路由
   - [x] 主应用路由 (`index.tsx`) 中的数据库调用

### 6.2 页面组件更新
- [x] 更新 `pages/index.tsx` 中的数据库调用
- [x] 更新 `pages/player.tsx` 中的数据库调用
- [x] 更新 `pages/footer.tsx` 中的数据库调用
- [x] 更新 `pages/layouts/base-layout.tsx` 中的数据库调用
- [x] 确保所有页面组件使用新的数据库接口

### 6.3 清理工作
- [x] 移除旧的 `database.ts` 文件
- [x] 更新所有组件的类型导入

## 阶段 7: 测试与验证

### 7.1 功能测试
- [ ] 验证所有 API 端点正常工作
- [ ] 测试复杂查询的性能和正确性
- [ ] 验证事务操作的原子性
- [ ] 测试分页、搜索、筛选功能

### 7.2 性能对比
- [ ] 对比重构前后的查询性能
- [ ] 优化查询热点
- [ ] 验证内存使用情况

### 7.3 数据一致性验证
- [ ] 验证所有 CRUD 操作的数据完整性
- [ ] 测试级联删除和外键约束
- [ ] 验证多语言标题查询逻辑

## 阶段 8: 文档与清理

### 8.1 代码清理
- [ ] 删除旧的原生 SQL 查询代码
- [ ] 清理未使用的函数和接口
- [ ] 统一代码风格和命名规范

### 8.2 文档更新
- [ ] 更新 `CLAUDE.md` 中的数据库操作说明
- [ ] 更新 `apilist.md` (如有API变化)
- [ ] 创建 Drizzle 使用指南 (`docs/drizzle-guide.md`)

### 8.3 开发工具配置
- [ ] 更新 `package.json` 脚本命令
- [ ] 配置 Drizzle Studio (可选的数据库管理界面)
- [ ] 更新开发环境设置说明