/**
 * 迁移 005: 回滚 Index 系统到 UUID 命名体系
 *
 * 此迁移用于回滚已删除的 004_rename_uuid_to_index 迁移的影响。
 * 如果你的数据库已经应用了 004 迁移（将 uuid 重命名为 index），
 * 运行此迁移可以将字段名恢复为 uuid。
 *
 * ⚠️ 注意：
 * - 004 迁移已从代码库中删除（通过 git rebase）
 * - 新部署默认使用 uuid 命名
 * - 此迁移仅用于已应用 004 迁移的现有数据库
 * - 如果数据库已经使用 uuid 列名，此迁移会自动跳过
 */

import type { DrizzleDB } from '../app/db/client';
import type { MigrationParameters } from '../app/db/types';

export const version = 5;

export const description = '回滚 Index 系统到 UUID 命名体系';

/**
 * 检查表中是否存在指定列
 */
async function hasColumn(db: DrizzleDB, tableName: string, columnName: string): Promise<boolean> {
    try {
        const result = await db.all(`PRAGMA table_info(${tableName})`);
        return result.some((col: any) => col.name === columnName);
    } catch (error) {
        console.error(`Error checking column ${tableName}.${columnName}:`, error);
        return false;
    }
}

/**
 * 安全地重命名列（仅当源列存在且目标列不存在时）
 */
async function renameColumnSafely(
    db: DrizzleDB,
    tableName: string,
    oldColumn: string,
    newColumn: string
): Promise<boolean> {
    const hasOld = await hasColumn(db, tableName, oldColumn);
    const hasNew = await hasColumn(db, tableName, newColumn);

    if (hasNew && !hasOld) {
        console.log(`⏭️  ${tableName}.${oldColumn} → ${tableName}.${newColumn} (已是 ${newColumn}，跳过)`);
        return false;
    }

    if (!hasOld) {
        console.log(`⚠️  ${tableName}.${oldColumn} 列不存在，跳过重命名`);
        return false;
    }

    if (hasNew) {
        console.log(`⚠️  ${tableName}.${newColumn} 列已存在，无法重命名`);
        return false;
    }

    try {
        await db.run(`ALTER TABLE ${tableName} RENAME COLUMN \`${oldColumn}\` TO ${newColumn}`);
        console.log(`✓ ${tableName}.${oldColumn} → ${tableName}.${newColumn}`);
        return true;
    } catch (error) {
        console.error(`❌ 重命名 ${tableName}.${oldColumn} 失败:`, error);
        throw error;
    }
}

/**
 * 正向迁移: 将 index 列重命名回 uuid
 *
 * 如果你的数据库应用过 004_rename_uuid_to_index 迁移，
 * 此函数会将所有 index 列重命名为 uuid。
 *
 * 如果列名已经是 uuid，此迁移会安全地跳过。
 */
export const up = async (db: DrizzleDB, params?: MigrationParameters): Promise<void> => {
    console.log('开始回滚 Index 系统到 UUID 系统...');
    console.log('检查各表列名并执行必要的重命名...');
    console.log('');

    let changedCount = 0;
    let skippedCount = 0;

    try {
        // 1. Work 表
        if (await renameColumnSafely(db, 'work', 'index', 'uuid')) {
            changedCount++;
        } else {
            skippedCount++;
        }

        // 2. Creator 表
        if (await renameColumnSafely(db, 'creator', 'index', 'uuid')) {
            changedCount++;
        } else {
            skippedCount++;
        }

        // 3. Tag 表
        if (await renameColumnSafely(db, 'tag', 'index', 'uuid')) {
            changedCount++;
        } else {
            skippedCount++;
        }

        // 4. Category 表
        if (await renameColumnSafely(db, 'category', 'index', 'uuid')) {
            changedCount++;
        } else {
            skippedCount++;
        }

        // 5. Media Source 表
        if (await renameColumnSafely(db, 'media_source', 'index', 'uuid')) {
            changedCount++;
        } else {
            skippedCount++;
        }
        if (await renameColumnSafely(db, 'media_source', 'work_index', 'work_uuid')) {
            changedCount++;
        } else {
            skippedCount++;
        }

        // 6. Asset 表
        if (await renameColumnSafely(db, 'asset', 'index', 'uuid')) {
            changedCount++;
        } else {
            skippedCount++;
        }
        if (await renameColumnSafely(db, 'asset', 'work_index', 'work_uuid')) {
            changedCount++;
        } else {
            skippedCount++;
        }

        // 7. Work Title 表
        if (await renameColumnSafely(db, 'work_title', 'index', 'uuid')) {
            changedCount++;
        } else {
            skippedCount++;
        }

        // 8. Work Relation 表
        if (await renameColumnSafely(db, 'work_relation', 'index', 'uuid')) {
            changedCount++;
        } else {
            skippedCount++;
        }
        if (await renameColumnSafely(db, 'work_relation', 'from_work_index', 'from_work_uuid')) {
            changedCount++;
        } else {
            skippedCount++;
        }
        if (await renameColumnSafely(db, 'work_relation', 'to_work_index', 'to_work_uuid')) {
            changedCount++;
        } else {
            skippedCount++;
        }

        // 9. External Source 表
        if (await renameColumnSafely(db, 'external_source', 'index', 'uuid')) {
            changedCount++;
        } else {
            skippedCount++;
        }

        // 10. External Object 表
        if (await renameColumnSafely(db, 'external_object', 'index', 'uuid')) {
            changedCount++;
        } else {
            skippedCount++;
        }
        if (await renameColumnSafely(db, 'external_object', 'external_source_index', 'external_source_uuid')) {
            changedCount++;
        } else {
            skippedCount++;
        }

        // 11. Footer Settings 表
        if (await renameColumnSafely(db, 'footer_settings', 'index', 'uuid')) {
            changedCount++;
        } else {
            skippedCount++;
        }

        console.log('');
        console.log(`✅ Index 系统已成功回滚到 UUID 系统`);
        console.log(`📊 重命名了 ${changedCount} 个列，跳过了 ${skippedCount} 个列`);

        if (changedCount === 0) {
            console.log('');
            console.log('ℹ️  数据库列名已经是 uuid 格式，无需修改');
            console.log('ℹ️  这表明数据库从未应用过 004 迁移（Index 系统）');
        }

        console.log(`Migration ${version}: ${description} - UP completed`);
    } catch (error) {
        console.error('');
        console.error('❌ 迁移失败:', error);
        console.error('可能的原因:');
        console.error('  1. 数据库版本不支持 ALTER TABLE RENAME COLUMN');
        console.error('  2. 列名冲突或其他数据库错误');
        console.error('  3. 数据库表结构与预期不符');
        throw error;
    }
};

/**
 * 回滚函数: 将 uuid 列重命名为 index
 *
 * 此函数实际上是将数据库改回 Index 系统。
 * ⚠️ 注意：这会使代码与数据库不匹配，因为代码已回退到使用 uuid！
 */
export const down = async (db: DrizzleDB, params?: MigrationParameters): Promise<void> => {
    console.log('⚠️  警告: 正在将 UUID 系统改回 Index 系统');
    console.log('⚠️  这会导致代码与数据库列名不匹配！');
    console.log('');

    let changedCount = 0;
    let skippedCount = 0;

    try {
        // 1. Work 表
        if (await renameColumnSafely(db, 'work', 'uuid', 'index')) {
            changedCount++;
        } else {
            skippedCount++;
        }

        // 2. Creator 表
        if (await renameColumnSafely(db, 'creator', 'uuid', 'index')) {
            changedCount++;
        } else {
            skippedCount++;
        }

        // 3. Tag 表
        if (await renameColumnSafely(db, 'tag', 'uuid', 'index')) {
            changedCount++;
        } else {
            skippedCount++;
        }

        // 4. Category 表
        if (await renameColumnSafely(db, 'category', 'uuid', 'index')) {
            changedCount++;
        } else {
            skippedCount++;
        }

        // 5. Media Source 表
        if (await renameColumnSafely(db, 'media_source', 'uuid', 'index')) {
            changedCount++;
        } else {
            skippedCount++;
        }
        if (await renameColumnSafely(db, 'media_source', 'work_uuid', 'work_index')) {
            changedCount++;
        } else {
            skippedCount++;
        }

        // 6. Asset 表
        if (await renameColumnSafely(db, 'asset', 'uuid', 'index')) {
            changedCount++;
        } else {
            skippedCount++;
        }
        if (await renameColumnSafely(db, 'asset', 'work_uuid', 'work_index')) {
            changedCount++;
        } else {
            skippedCount++;
        }

        // 7. Work Title 表
        if (await renameColumnSafely(db, 'work_title', 'uuid', 'index')) {
            changedCount++;
        } else {
            skippedCount++;
        }

        // 8. Work Relation 表
        if (await renameColumnSafely(db, 'work_relation', 'uuid', 'index')) {
            changedCount++;
        } else {
            skippedCount++;
        }
        if (await renameColumnSafely(db, 'work_relation', 'from_work_uuid', 'from_work_index')) {
            changedCount++;
        } else {
            skippedCount++;
        }
        if (await renameColumnSafely(db, 'work_relation', 'to_work_uuid', 'to_work_index')) {
            changedCount++;
        } else {
            skippedCount++;
        }

        // 9. External Source 表
        if (await renameColumnSafely(db, 'external_source', 'uuid', 'index')) {
            changedCount++;
        } else {
            skippedCount++;
        }

        // 10. External Object 表
        if (await renameColumnSafely(db, 'external_object', 'uuid', 'index')) {
            changedCount++;
        } else {
            skippedCount++;
        }
        if (await renameColumnSafely(db, 'external_object', 'external_source_uuid', 'external_source_index')) {
            changedCount++;
        } else {
            skippedCount++;
        }

        // 11. Footer Settings 表
        if (await renameColumnSafely(db, 'footer_settings', 'uuid', 'index')) {
            changedCount++;
        } else {
            skippedCount++;
        }

        console.log('');
        console.log(`✅ UUID 系统已回滚到 Index 系统（不推荐）`);
        console.log(`📊 重命名了 ${changedCount} 个列，跳过了 ${skippedCount} 个列`);
        console.log(`Migration ${version}: ${description} - DOWN completed`);
    } catch (error) {
        console.error('');
        console.error('❌ 回滚失败:', error);
        throw error;
    }
};

// ====== 使用说明 ======

/*
## 适用场景

1. **已应用 004 迁移的数据库**：
   - 你的数据库列名为 `index`，但代码已回退到使用 `uuid`
   - 运行此迁移的 UP 函数将列名改回 `uuid`

2. **全新部署**：
   - 不需要运行此迁移（但可以安全执行，会自动跳过）
   - 数据库会直接使用 uuid 列名

## 执行方法

### 通过迁移管理页面 (/migration)
1. 访问 `/migration` 页面
2. 查看当前数据库版本
3. 如果显示版本 4，点击"执行迁移到版本 5"
4. 迁移将自动执行

### 通过 API
```bash
POST /api/migration/execute
Content-Type: application/json

{
  "targetVersion": 5,
  "parameters": {}
}
```

## 验证

迁移完成后，检查数据库列名：
```sql
PRAGMA table_info(work);
-- 应该看到 uuid 列而不是 index 列
```

## 安全特性

- ✅ 自动检测列是否存在
- ✅ 如果列名已经是 uuid，自动跳过
- ✅ 避免重复重命名导致的错误
- ✅ 详细的日志输出，显示每个表的处理结果

## 回滚（不推荐）

如果需要回滚到 Index 系统：
```bash
POST /api/migration/rollback
Content-Type: application/json

{
  "targetVersion": 4
}
```

⚠️ 警告：回滚会导致代码与数据库不匹配！
*/
