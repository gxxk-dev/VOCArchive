/**
 * 迁移脚本模板
 *
 * 复制此文件并重命名为 001_your_description.ts 来创建新的迁移
 * 确保版本号与文件名序号一致
 *
 * 命名规范：
 * - 001_add_new_config.ts
 * - 002_update_schema.ts
 * - 003_migrate_data.ts
 */

import type { DrizzleDB } from '../app/db/client';
import { upsertSiteConfig, deleteSiteConfig } from '../app/db/operations/config';
import { siteConfig } from '../app/db/schema';
import { eq } from 'drizzle-orm';

// 版本号 - 必须与文件名序号一致
export const version = 999; // 修改为实际版本号

// 迁移描述 - 简洁描述这个迁移的作用
export const description = '示例迁移 - 修改为实际描述';

/**
 * 正向迁移函数
 *
 * 在这里实现数据库更改操作
 * 建议使用现有的操作函数而不是直接编写SQL
 */
export const up = async (db: DrizzleDB): Promise<void> => {
    // 示例：添加新的配置项
    await upsertSiteConfig(
        db,
        'new_config_key',
        'default_value',
        '新配置项的描述'
    );

    // 示例：直接数据库操作（如果需要）
    // await db.insert(siteConfig).values({
    //     key: 'another_config',
    //     value: 'another_value',
    //     description: '另一个配置项'
    // });

    // 示例：更新现有配置
    // await db.update(siteConfig)
    //     .set({ value: 'updated_value' })
    //     .where(eq(siteConfig.key, 'existing_key'));

    console.log(`Migration ${version}: ${description} - UP completed`);
};

/**
 * 回滚函数
 *
 * 必须能够完全撤销 up 函数的操作
 * 确保数据可以安全回滚到之前的状态
 */
export const down = async (db: DrizzleDB): Promise<void> => {
    // 撤销 up 函数中的操作
    await deleteSiteConfig(db, 'new_config_key');

    // 示例：删除添加的配置
    // await deleteSiteConfig(db, 'another_config');

    // 示例：恢复更新的配置
    // await db.update(siteConfig)
    //     .set({ value: 'original_value' })
    //     .where(eq(siteConfig.key, 'existing_key'));

    console.log(`Migration ${version}: ${description} - DOWN completed`);
};

// ====== 常用操作示例 ======

/**
 * 配置管理示例
 */
async function configExamples(db: DrizzleDB) {
    // 添加配置
    await upsertSiteConfig(db, 'key', 'value', 'description');

    // 批量添加配置
    const configs = [
        { key: 'key1', value: 'value1', description: 'desc1' },
        { key: 'key2', value: 'value2', description: 'desc2' }
    ];
    for (const config of configs) {
        await upsertSiteConfig(db, config.key, config.value, config.description);
    }

    // 删除配置
    await deleteSiteConfig(db, 'key');
}

/**
 * 数据表操作示例
 */
async function tableExamples(db: DrizzleDB) {
    // 插入数据
    await db.insert(siteConfig).values({
        key: 'new_key',
        value: 'new_value',
        description: '新配置'
    });

    // 批量插入
    await db.insert(siteConfig).values([
        { key: 'key1', value: 'value1', description: 'desc1' },
        { key: 'key2', value: 'value2', description: 'desc2' }
    ]);

    // 更新数据
    await db.update(siteConfig)
        .set({
            value: 'updated_value',
            description: '更新的描述'
        })
        .where(eq(siteConfig.key, 'some_key'));

    // 删除数据
    await db.delete(siteConfig)
        .where(eq(siteConfig.key, 'some_key'));

    // 条件查询
    const configs = await db.select()
        .from(siteConfig)
        .where(eq(siteConfig.key, 'some_key'));
}

/**
 * 事务操作示例
 */
async function transactionExample(db: DrizzleDB) {
    // 注意：Cloudflare D1 的事务支持有限
    // 建议将相关操作放在同一个函数中，让数据库层处理一致性

    try {
        // 执行多个相关操作
        await upsertSiteConfig(db, 'key1', 'value1', 'desc1');
        await upsertSiteConfig(db, 'key2', 'value2', 'desc2');

        // 如果有错误，会抛出异常
        console.log('操作成功完成');
    } catch (error) {
        console.error('操作失败:', error);
        throw error; // 重新抛出错误让迁移系统处理
    }
}

// ====== 迁移编写指南 ======

/*
1. 版本号管理：
   - version 字段必须与文件名序号一致
   - 从 001 开始按顺序递增

2. 函数要求：
   - up 和 down 都必须是 async 函数
   - 都必须接收 DrizzleDB 参数
   - 都必须返回 Promise<void>

3. 错误处理：
   - 让函数抛出异常，迁移系统会处理
   - 不要捕获和隐藏错误，除非你知道如何恰当处理

4. 数据安全：
   - 谨慎删除数据，考虑先备份
   - 测试 up 和 down 操作的完整性
   - 使用现有的操作函数确保类型安全

5. 性能考虑：
   - 对于大量数据，考虑分批处理
   - 避免复杂的连接查询
   - 必要时添加进度日志

6. 测试建议：
   - 在开发环境中测试迁移
   - 验证数据完整性
   - 确保回滚操作正确工作
*/