/**
 * 迁移 004: [已废弃] Index 系统重命名
 *
 * ⚠️ 此迁移已被废弃并从代码库中删除
 *
 * ## 历史背景
 *
 * 此迁移原本用于将所有表的 `uuid` 列重命名为 `index`。
 * 该更改在 commit d649c33 和 f436fe5 中引入。
 *
 * ## 为何废弃
 *
 * 经过重新评估，我们决定保持使用 `uuid` 作为外部标识符的命名约定，
 * 因此通过 git rebase 删除了引入 Index 系统的 commits。
 *
 * ## 如何处理
 *
 * ### 场景 1: 数据库版本 < 4
 * - 无需操作，跳过此迁移
 * - 数据库会从版本 3 直接升级到版本 5
 *
 * ### 场景 2: 数据库版本 = 4（已应用此迁移）
 * - 你的数据库列名为 `index`，但代码使用 `uuid`
 * - 必须运行迁移 005 将列名改回 `uuid`
 * - 执行: POST /api/migration/execute { "targetVersion": 5 }
 *
 * ### 场景 3: 全新部署
 * - 数据库从版本 0 开始
 * - 直接运行到版本 5，跳过版本 4
 *
 * ## 占位符实现
 *
 * 此文件作为占位符保留，以维护迁移序列的连续性。
 * UP 和 DOWN 函数都是空操作，不会对数据库做任何更改。
 */

import type { DrizzleDB } from '../app/db/client';
import type { MigrationParameters } from '../app/db/types';

export const version = 4;

export const description = '[已废弃] Index 系统重命名 - 此迁移已被删除';

/**
 * UP 函数 - 空操作
 *
 * 此迁移已废弃，不执行任何操作。
 * 如果你的数据库当前版本是 3，应该直接升级到版本 5。
 */
export const up = async (db: DrizzleDB, params?: MigrationParameters): Promise<void> => {
    console.log('⚠️  迁移 004 已废弃');
    console.log('📝 此迁移原本用于 UUID → Index 重命名，但该功能已被移除');
    console.log('✅ 跳过此迁移，无需执行任何操作');
    console.log('');
    console.log('如果你的数据库已应用过此迁移（版本=4），');
    console.log('请继续运行迁移 005 将列名改回 uuid。');
    console.log('');
    console.log(`Migration ${version}: ${description} - SKIPPED`);
};

/**
 * DOWN 函数 - 空操作
 *
 * 此迁移已废弃，回滚也不执行任何操作。
 */
export const down = async (db: DrizzleDB, params?: MigrationParameters): Promise<void> => {
    console.log('⚠️  迁移 004 已废弃');
    console.log('✅ 回滚跳过，无需执行任何操作');
    console.log(`Migration ${version}: ${description} - ROLLBACK SKIPPED`);
};

// ====== 详细说明 ======

/*
## 时间线

1. **版本 1-3**: 正常的迁移历史
   - 001: UUID to ID migration
   - 002: Add wiki platforms
   - 003: Add IPFS load balancing

2. **版本 4 (已删除)**: Index 系统引入
   - Commit: d649c33, f436fe5
   - 功能: 将所有 uuid 列重命名为 index
   - 状态: 已通过 git rebase 从历史中删除

3. **版本 5**: Index 系统回退
   - 功能: 将 index 列改回 uuid（用于已应用 004 的数据库）
   - 状态: 当前版本

## 迁移路径

### 路径 A: 从版本 3 升级（推荐）
```
v3 → [跳过 v4] → v5
```
- 数据库列名一直是 uuid
- 版本号跳过 4，直接到 5

### 路径 B: 从版本 4 恢复
```
v4 (index 列) → v5 (uuid 列)
```
- 数据库当前使用 index 列名
- 运行迁移 005 改回 uuid

### 路径 C: 全新部署
```
v0 → v1 → v2 → v3 → [跳过 v4] → v5
```
- 初始化时直接使用 uuid 列名
- 从不应用版本 4

## 数据库版本检查

检查当前数据库版本:
```sql
SELECT value FROM site_config WHERE key = 'db_version';
```

- 如果返回 '3': 正常，升级到 5
- 如果返回 '4': 需要运行 005 迁移改回 uuid
- 如果返回 '5': 已是最新版本
- 如果不存在: 未初始化的数据库

## 手动修复（如果迁移失败）

如果你的数据库在版本 4，但无法运行迁移 005，可以手动执行:

```sql
-- 将所有 index 列改回 uuid
ALTER TABLE work RENAME COLUMN `index` TO uuid;
ALTER TABLE creator RENAME COLUMN `index` TO uuid;
ALTER TABLE tag RENAME COLUMN `index` TO uuid;
ALTER TABLE category RENAME COLUMN `index` TO uuid;
ALTER TABLE media_source RENAME COLUMN `index` TO uuid;
ALTER TABLE media_source RENAME COLUMN work_index TO work_uuid;
ALTER TABLE asset RENAME COLUMN `index` TO uuid;
ALTER TABLE asset RENAME COLUMN work_index TO work_uuid;
ALTER TABLE work_title RENAME COLUMN `index` TO uuid;
ALTER TABLE work_relation RENAME COLUMN `index` TO uuid;
ALTER TABLE work_relation RENAME COLUMN from_work_index TO from_work_uuid;
ALTER TABLE work_relation RENAME COLUMN to_work_index TO to_work_uuid;
ALTER TABLE external_source RENAME COLUMN `index` TO uuid;
ALTER TABLE external_object RENAME COLUMN `index` TO uuid;
ALTER TABLE external_object RENAME COLUMN external_source_index TO external_source_uuid;
ALTER TABLE footer_settings RENAME COLUMN `index` TO uuid;

-- 更新数据库版本
UPDATE site_config SET value = '5' WHERE key = 'db_version';
```

## 故障排除

### 问题: 迁移系统报告版本不连续

**症状**: "Migration version gap detected: 3 → 5"

**解决**:
- 这是预期行为
- 版本 4 已被废弃，可以安全跳过
- 继续升级到版本 5

### 问题: 数据库版本为 4，但列名是 uuid

**原因**: 可能手动修改过列名

**解决**:
1. 检查所有表的列名
2. 如果确认都是 uuid，手动更新版本号:
   ```sql
   UPDATE site_config SET value = '5' WHERE key = 'db_version';
   ```

### 问题: 数据库版本为 4，列名是 index

**解决**: 运行迁移 005
```bash
POST /api/migration/execute
{
  "targetVersion": 5
}
```
*/
