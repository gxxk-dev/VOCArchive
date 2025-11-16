# 回退 d649c33 (UUID → Index) 任务清单

## 第一阶段：准备工作

- [ ] **创建备份分支** - `git checkout -b backup-before-revert-index`（安全保障）
- [ ] **检查工作区状态** - `git status` 确保没有未提交的更改

## 第二阶段：交互式 Rebase

- [ ] **启动交互式 rebase** - `git rebase -i d649c33^`（回到 baef6d8）
- [ ] **编辑 rebase 计划**：
  ```
  drop d649c33  # 删除 "将 UUID 系统重命名为 Index 系统"
  drop f436fe5  # 删除 "完善 Index 生成系统"（完全依赖 Index）
  pick 755afc9  # 保留 "修复管理后台"（尝试保留，有冲突再处理）
  pick 6d3de88  # 保留 "架构重构"（尝试保留，有冲突再处理）
  pick 9a8beba  # 保留 "IPFS网关功能"（独立功能）
  ```

## 第三阶段：处理冲突和涟漪效应

### 数据库层面
- [ ] 恢复 `src/app/db/schema.ts`（`index` → `uuid`）
- [ ] 恢复 `src/app/db/types.ts`（类型定义）
- [ ] 重命名文件：`src/app/db/utils/index-id-converter.ts` → `uuid-id-converter.ts`
- [ ] 删除 `src/app/db/utils/index-utils.ts`（新增的文件）
- [ ] 恢复所有 `src/app/db/operations/*.ts` 中的字段引用

### API 路由层面
- [ ] 恢复 `src/app/index.tsx` 中的参数名称
- [ ] 恢复 `src/app/routes/*.ts` 中的 API 端点参数（`index` → `uuid`）
  - [ ] delete.ts
  - [ ] get.ts
  - [ ] input.ts
  - [ ] list.ts
  - [ ] update.ts

### 前端组件层面
- [ ] 重命名组件：`src/app/pages/components/admin/base/index-cell.tsx` → `uuid-cell.tsx`
- [ ] 恢复组件导出：`src/app/pages/components/admin/base/index.ts`
- [ ] 恢复所有页面组件中的引用：
  - [ ] admin-content.tsx
  - [ ] admin-editor.tsx
  - [ ] 各类 table 组件
  - [ ] form 组件
- [ ] 恢复表单配置：`form-config.ts`、`form-field-types.ts`、`form-field-renderer.tsx`

### 前端脚本和样式
- [ ] 恢复客户端脚本：
  - [ ] `public/admin/js/main.js`
  - [ ] `public/admin/js/editor-client.js`
  - [ ] `public/admin/js/iframe-client.js`
  - [ ] `public/admin/js/utils/index.js`
  - [ ] `public/admin/js/ui/components/selector-config.js`
  - [ ] `public/admin/js/core/config.js`
- [ ] 恢复 CSS 样式：
  - [ ] `public/admin/style.css`
  - [ ] `public/css/admin.css`
  - [ ] `public/css/editor.css`
  - [ ] `public/css/player.css`

### 依赖管理
- [ ] 检查 nanoid 是否有其他用途
- [ ] 如果没有其他用途，从 `package.json` 移除 nanoid
- [ ] 运行 `npm install` 更新依赖

## 第四阶段：创建数据库回滚迁移

- [ ] **创建迁移文件** - `src/migrations/005_revert_index_to_uuid.ts`
  ```typescript
  export const version = 5;
  export const description = '回滚：将 Index 字段重命名回 UUID';

  export async function up(db: DrizzleDB) {
    // 将所有表的 index 字段重命名为 uuid
    // 包括：work, creator, tag, category, external_source,
    //       media_source, asset, external_object, work_title,
    //       footer_settings, wiki_platform
  }

  export async function down(db: DrizzleDB) {
    // 反向操作：uuid → index
  }
  ```
- [ ] **更新迁移注册表** - `npm run build:migrations`

## 第五阶段：文档和清理

- [ ] **更新 CLAUDE.md**：
  - [ ] 移除 Index 系统相关文档
  - [ ] 恢复 UUID 系统说明
  - [ ] 更新架构说明中的字段名称
- [ ] **检查并更新其他文档**（如果有）

## 第六阶段：验证

- [ ] **类型检查**：
  - [ ] `npm run cf-typegen`
  - [ ] `npx tsc --noEmit`
- [ ] **检查是否有遗漏的 Index 引用**：
  - [ ] 在代码中搜索 `\bindex\b` 相关引用
  - [ ] 确认所有 UUID 引用已恢复
- [ ] **本地测试**（如果需要）：
  - [ ] `npm run dev`
  - [ ] 测试管理后台功能
  - [ ] 测试播放器功能

## 第七阶段：提交和推送

- [ ] **创建回退 commit**：
  ```bash
  git add .
  git commit -m "revert: 回退 UUID → Index 重命名 (d649c33 + f436fe5)

  回退以下变更：
  - d649c33: 将 UUID 系统重命名为 Index 系统
  - f436fe5: 完善 Index generation 系统

  保留以下 commits：
  - 755afc9: 修复管理后台
  - 6d3de88: 架构重构
  - 9a8beba: IPFS网关功能

  数据库迁移：新增 005_revert_index_to_uuid.ts

  🤖 Generated with [Claude Code](https://claude.com/claude-code)

  Co-Authored-By: Claude <noreply@anthropic.com>"
  ```
- [ ] **推送到远程**（如果需要强制推送）：
  ```bash
  # 警告：这会改写远程历史！
  git push --force-with-lease
  ```

## 风险提示和注意事项

⚠️ **重要警告**：
- 交互式 rebase 会修改 git 历史，如果已推送到远程则需要强制推送
- 可能需要多次解决冲突，特别是架构重构 commit (6d3de88)
- 某些自动合并可能不完美，需要手动审查每个冲突
- 数据库迁移需要在生产环境执行（如果已部署）
- 建议在本地完全测试后再推送到远程

## 涟漪效应检查清单

### 关键文件（需要重点检查）
1. `src/app/db/schema.ts` - 数据库 schema 定义
2. `src/app/db/utils/uuid-id-converter.ts` - UUID/ID 转换工具
3. `src/app/routes/*.ts` - 所有 API 路由
4. `src/app/pages/components/admin/form/*` - 表单系统
5. `public/admin/js/*` - 前端管理脚本

### 搜索模式（用于查找遗漏）
```bash
# 搜索可能遗漏的 index 引用
grep -r "\.index" src/ --include="*.ts" --include="*.tsx"
grep -r "index:" src/ --include="*.ts" --include="*.tsx"
grep -r "IndexCell" src/ --include="*.tsx"
grep -r "generateIndex" src/ --include="*.ts"

# 搜索前端脚本中的引用
grep -r "index" public/admin/js/ --include="*.js"
```

---

**创建时间**: 2025-11-16
**目标**: 回退 d649c33 (UUID → Index) 并处理所有涟漪效应
**策略**: 交互式 rebase + 数据库回滚迁移
