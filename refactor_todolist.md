# 多存储源重构 TODO 清单

## 项目概述
重构以支持资产/媒体源的多存储源功能。每个资产/媒体源可以对应多个外部资源，每个外部资源对应不同的存储源类型（rawurl/s3/r2）。

## 数据库架构设计

### 1. 设计 external_objects 和 external_sources 表结构
- **external_sources 表**：存储源配置信息
  - uuid (主键) - 存储源标识符
  - type (TEXT) - 存储类型：'raw_url', 'ipfs'
  - name (TEXT) - 用户友好的存储源名称
  - endpoint (TEXT) - 访问端点，使用 {ID} 标记文件标识符位置

- **external_objects 表**：外部资源映射
  - uuid (主键) - 外部对象标识符
  - external_source_uuid (外键) - 引用 external_sources.uuid
  - mime_type (TEXT) - 文件MIME类型
  - file_id (TEXT) - 存储源内的路径/键值

### 2. 更新数据库架构文件
- 更新 `src/app/db/schema.ts` 添加新表定义
- 为两个新表添加 CREATE TABLE 语句
- 定义适当的外键约束
- 添加性能优化索引

## 代码结构更新

### 3. 创建新数据结构的 TypeScript 接口
- 在 `src/app/db/types.ts` 中添加 ExternalSource 接口定义
- 在 `src/app/db/types.ts` 中添加 ExternalObject 接口定义
- 更新现有的 Asset 和 MediaSource 接口

### 4. 创建数据库操作文件
- 创建 `src/app/db/operations/external_source.ts` 为 external_sources 添加 CRUD 操作
- 创建 `src/app/db/operations/external_object.ts` 为 external_objects 添加 CRUD 操作
- 更新 `src/app/db/operations/asset.ts` 和 `src/app/db/operations/media.ts` 的操作逻辑
- 在 `src/app/db/index.ts` 中导出新的操作函数

### 5. 修改现有 asset/media_source 表以引用 external_objects
- 在 `src/app/db/schema.ts` 中更新表关系结构
- 在 `src/app/db/operations/admin.ts` 中添加迁移逻辑链接现有记录

## API 实现

### 6. 更新 /api/get/file/{uuid} 端点支持多存储源
- 在 `src/app/routes/get.ts` 中更新文件获取逻辑
- 同时支持 asset/media_source UUID 和 external_object UUID
- 实现存储类型解析逻辑
- 处理每个资产的多个外部对象

### 7. 创建 external_sources 管理 API 端点
- 在 `src/app/routes/list.ts` 中添加 `GET /api/list/external_sources` - 列出所有存储源
- 在 `src/app/routes/get.ts` 中添加 `GET /api/get/external_source/{uuid}` - 获取特定存储源
- 在 `src/app/routes/input.ts` 中添加 `POST /api/input/external_source` - 创建新存储源（需认证）
- 在 `src/app/routes/update.ts` 中添加 `POST /api/update/external_source` - 更新存储源（需认证）
- 在 `src/app/routes/delete.ts` 中添加 `POST /api/delete/external_source` - 删除存储源（需认证）

### 8. 创建 external_objects 管理 API 端点
- 在 `src/app/routes/list.ts` 中添加 `GET /api/list/external_objects` - 列出所有外部对象
- 在 `src/app/routes/get.ts` 中添加 `GET /api/get/external_object/{uuid}` - 获取特定外部对象
- 在 `src/app/routes/input.ts` 中添加 `POST /api/input/external_object` - 创建新外部对象（需认证）
- 在 `src/app/routes/update.ts` 中添加 `POST /api/update/external_object` - 更新外部对象（需认证）
- 在 `src/app/routes/delete.ts` 中添加 `POST /api/delete/external_object` - 删除外部对象（需认证）

## 存储处理器

### 9. 实现存储源类型处理器（rawurl/ipfs）
- 创建 `src/app/db/utils/storage-handlers.ts` 文件
- RawUrlHandler：直接URL访问
- IpfsHandler：IPFS分布式存储网关

### 10. 更新 asset/media_source 输入/更新端点处理外部对象
- 在 `src/app/routes/input.ts` 中修改 asset/media_source 创建工作流支持外部对象分配
- 在 `src/app/routes/update.ts` 中更新端点管理外部对象关系

## 前端界面更新

### 11. 创建前端管理页面
- 修改 `public/admin/script.js` 用于管理存储源配置、管理外部对象
- 更新 `public/admin/index.html` 添加导航链接
- 更新 `public/admin/style.css` 支持新页面样式
- 添加存储源类型选择器和配置表单
- 实现外部对象与存储源的关联界面

### 12. 更新现有前端页面支持多存储源
- 更新现有的 `public/admin/` 管理页面
- 修改资产/媒体源创建表单支持外部对象选择
- 修改文件上传界面支持多存储源
- 在资产详情页面显示所有关联的外部对象
- 添加存储源状态指示器
- 更新批量操作界面支持外部对象管理

## 数据迁移

### 13. 创建现有数据的迁移策略
- 在 `src/app/db/operations/admin.ts` 中编写迁移函数
- 将现有资产迁移到新结构
- 在过渡期间保持现有功能
- 数据验证和完整性检查

## 文档更新

### 14. 更新 CLAUDE.md 文档新架构
- 更新 API 文档包含新端点
- 记录存储源配置方法
- 更新架构图表和示例
