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
 */

import type { DrizzleDB } from '../app/db/client';
import type { MigrationParameters } from '../app/db/types';

export const version = 5;

export const description = '回滚 Index 系统到 UUID 命名体系';

/**
 * 正向迁移: 将 index 列重命名回 uuid
 *
 * 如果你的数据库应用过 004_rename_uuid_to_index 迁移，
 * 此函数会将所有 index 列重命名为 uuid。
 */
export const up = async (db: DrizzleDB, params?: MigrationParameters): Promise<void> => {
    console.log('开始回滚 Index 系统到 UUID 系统...');

    try {
        // 注意: Cloudflare D1 使用 ALTER TABLE RENAME COLUMN
        // SQLite 3.25.0+ 支持此语法

        // 1. Work 表
        await db.run(`ALTER TABLE work RENAME COLUMN \`index\` TO uuid`);
        console.log('✓ work.index → work.uuid');

        // 2. Creator 表
        await db.run(`ALTER TABLE creator RENAME COLUMN \`index\` TO uuid`);
        console.log('✓ creator.index → creator.uuid');

        // 3. Tag 表
        await db.run(`ALTER TABLE tag RENAME COLUMN \`index\` TO uuid`);
        console.log('✓ tag.index → tag.uuid');

        // 4. Category 表
        await db.run(`ALTER TABLE category RENAME COLUMN \`index\` TO uuid`);
        console.log('✓ category.index → category.uuid');

        // 5. Media Source 表
        await db.run(`ALTER TABLE media_source RENAME COLUMN \`index\` TO uuid`);
        await db.run(`ALTER TABLE media_source RENAME COLUMN work_index TO work_uuid`);
        console.log('✓ media_source.index → media_source.uuid');
        console.log('✓ media_source.work_index → media_source.work_uuid');

        // 6. Asset 表
        await db.run(`ALTER TABLE asset RENAME COLUMN \`index\` TO uuid`);
        await db.run(`ALTER TABLE asset RENAME COLUMN work_index TO work_uuid`);
        console.log('✓ asset.index → asset.uuid');
        console.log('✓ asset.work_index → asset.work_uuid');

        // 7. Work Title 表
        await db.run(`ALTER TABLE work_title RENAME COLUMN \`index\` TO uuid`);
        console.log('✓ work_title.index → work_title.uuid');

        // 8. Work Relation 表
        await db.run(`ALTER TABLE work_relation RENAME COLUMN \`index\` TO uuid`);
        await db.run(`ALTER TABLE work_relation RENAME COLUMN from_work_index TO from_work_uuid`);
        await db.run(`ALTER TABLE work_relation RENAME COLUMN to_work_index TO to_work_uuid`);
        console.log('✓ work_relation.index → work_relation.uuid');
        console.log('✓ work_relation.from_work_index → work_relation.from_work_uuid');
        console.log('✓ work_relation.to_work_index → work_relation.to_work_uuid');

        // 9. External Source 表
        await db.run(`ALTER TABLE external_source RENAME COLUMN \`index\` TO uuid`);
        console.log('✓ external_source.index → external_source.uuid');

        // 10. External Object 表
        await db.run(`ALTER TABLE external_object RENAME COLUMN \`index\` TO uuid`);
        await db.run(`ALTER TABLE external_object RENAME COLUMN external_source_index TO external_source_uuid`);
        console.log('✓ external_object.index → external_object.uuid');
        console.log('✓ external_object.external_source_index → external_object.external_source_uuid');

        // 11. Footer Settings 表
        await db.run(`ALTER TABLE footer_settings RENAME COLUMN \`index\` TO uuid`);
        console.log('✓ footer_settings.index → footer_settings.uuid');

        console.log('✅ Index 系统已成功回滚到 UUID 系统');
        console.log(`Migration ${version}: ${description} - UP completed`);
    } catch (error) {
        console.error('❌ 迁移失败:', error);
        console.error('可能的原因:');
        console.error('  1. 数据库已经使用 uuid 列名（未应用过 004 迁移）');
        console.error('  2. 数据库版本不支持 ALTER TABLE RENAME COLUMN');
        console.error('  3. 列名冲突或其他数据库错误');
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

    try {
        // 1. Work 表
        await db.run(`ALTER TABLE work RENAME COLUMN uuid TO \`index\``);
        console.log('✓ work.uuid → work.index');

        // 2. Creator 表
        await db.run(`ALTER TABLE creator RENAME COLUMN uuid TO \`index\``);
        console.log('✓ creator.uuid → creator.index');

        // 3. Tag 表
        await db.run(`ALTER TABLE tag RENAME COLUMN uuid TO \`index\``);
        console.log('✓ tag.uuid → tag.index');

        // 4. Category 表
        await db.run(`ALTER TABLE category RENAME COLUMN uuid TO \`index\``);
        console.log('✓ category.uuid → category.index');

        // 5. Media Source 表
        await db.run(`ALTER TABLE media_source RENAME COLUMN uuid TO \`index\``);
        await db.run(`ALTER TABLE media_source RENAME COLUMN work_uuid TO work_index`);
        console.log('✓ media_source.uuid → media_source.index');
        console.log('✓ media_source.work_uuid → media_source.work_index');

        // 6. Asset 表
        await db.run(`ALTER TABLE asset RENAME COLUMN uuid TO \`index\``);
        await db.run(`ALTER TABLE asset RENAME COLUMN work_uuid TO work_index`);
        console.log('✓ asset.uuid → asset.index');
        console.log('✓ asset.work_uuid → asset.work_index');

        // 7. Work Title 表
        await db.run(`ALTER TABLE work_title RENAME COLUMN uuid TO \`index\``);
        console.log('✓ work_title.uuid → work_title.index');

        // 8. Work Relation 表
        await db.run(`ALTER TABLE work_relation RENAME COLUMN uuid TO \`index\``);
        await db.run(`ALTER TABLE work_relation RENAME COLUMN from_work_uuid TO from_work_index`);
        await db.run(`ALTER TABLE work_relation RENAME COLUMN to_work_uuid TO to_work_index`);
        console.log('✓ work_relation.uuid → work_relation.index');
        console.log('✓ work_relation.from_work_uuid → work_relation.from_work_index');
        console.log('✓ work_relation.to_work_uuid → work_relation.to_work_index');

        // 9. External Source 表
        await db.run(`ALTER TABLE external_source RENAME COLUMN uuid TO \`index\``);
        console.log('✓ external_source.uuid → external_source.index');

        // 10. External Object 表
        await db.run(`ALTER TABLE external_object RENAME COLUMN uuid TO \`index\``);
        await db.run(`ALTER TABLE external_object RENAME COLUMN external_source_uuid TO external_source_index`);
        console.log('✓ external_object.uuid → external_object.index');
        console.log('✓ external_object.external_source_uuid → external_object.external_source_index');

        // 11. Footer Settings 表
        await db.run(`ALTER TABLE footer_settings RENAME COLUMN uuid TO \`index\``);
        console.log('✓ footer_settings.uuid → footer_settings.index');

        console.log('✅ UUID 系统已回滚到 Index 系统（不推荐）');
        console.log(`Migration ${version}: ${description} - DOWN completed`);
    } catch (error) {
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
   - 不需要运行此迁移
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
