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
import type { MigrationParameters, MigrationParameterDefinition } from '../app/db/types';
import { upsertSiteConfig, deleteSiteConfig } from '../app/db/operations/config';
import { siteConfig } from '../app/db/schema';
import { eq } from 'drizzle-orm';

// 版本号 - 必须与文件名序号一致
export const version = 999; // 修改为实际版本号

// 迁移描述 - 简洁描述这个迁移的作用
export const description = '示例迁移 - 修改为实际描述';

// 参数定义 - 可选，定义此迁移需要的用户输入参数
export const parameters: MigrationParameterDefinition[] = [
    {
        name: 'asset_url',
        type: 'url',
        description: '资源基础URL，用于配置文件访问地址',
        required: true,
        validation: {
            pattern: '^https?://.+',
        }
    },
    {
        name: 'batch_size',
        type: 'number',
        description: '批处理大小，控制一次处理的记录数',
        required: false,
        defaultValue: 50,
        validation: {
            min: 1,
            max: 1000
        }
    },
    {
        name: 'enable_feature',
        type: 'boolean',
        description: '是否启用新功能',
        required: false,
        defaultValue: false
    },
    {
        name: 'service_name',
        type: 'string',
        description: '服务名称',
        required: true,
        validation: {
            min: 3,
            max: 50,
            enum: ['production', 'staging', 'development']
        }
    }
];

/**
 * 正向迁移函数
 *
 * 在这里实现数据库更改操作
 * 建议使用现有的操作函数而不是直接编写SQL
 *
 * @param db 数据库客户端
 * @param params 用户提供的参数（如果有参数定义）
 */
export const up = async (db: DrizzleDB, params?: MigrationParameters): Promise<void> => {
    // 如果有参数，可以通过 params 访问
    if (params) {
        const assetUrl = params.asset_url as string;
        const batchSize = params.batch_size as number;
        const enableFeature = params.enable_feature as boolean;
        const serviceName = params.service_name as string;

        console.log(`Migration parameters:`, {
            assetUrl,
            batchSize,
            enableFeature,
            serviceName
        });

        // 示例：使用参数进行配置
        await upsertSiteConfig(
            db,
            'asset_url',
            assetUrl,
            '资源基础URL配置'
        );

        await upsertSiteConfig(
            db,
            'batch_size',
            String(batchSize),
            '批处理大小配置'
        );

        await upsertSiteConfig(
            db,
            'feature_enabled',
            String(enableFeature),
            '功能启用状态'
        );

        await upsertSiteConfig(
            db,
            'service_name',
            serviceName,
            '服务名称配置'
        );
    } else {
        // 如果没有参数，执行默认操作
        await upsertSiteConfig(
            db,
            'default_config',
            'default_value',
            '默认配置项'
        );
    }

    console.log(`Migration ${version}: ${description} - UP completed`);
};

/**
 * 回滚函数
 *
 * 必须能够完全撤销 up 函数的操作
 * 确保数据可以安全回滚到之前的状态
 *
 * @param db 数据库客户端
 * @param params 用户提供的参数（如果有参数定义）
 */
export const down = async (db: DrizzleDB, params?: MigrationParameters): Promise<void> => {
    // 撤销 up 函数中的操作
    if (params) {
        // 删除添加的配置项
        await deleteSiteConfig(db, 'asset_url');
        await deleteSiteConfig(db, 'batch_size');
        await deleteSiteConfig(db, 'feature_enabled');
        await deleteSiteConfig(db, 'service_name');
    } else {
        await deleteSiteConfig(db, 'default_config');
    }

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

2. 参数定义（可选）：
   - parameters 导出可选的参数定义数组
   - 支持类型：string, number, boolean, url
   - 可定义验证规则：min/max、pattern、enum等
   - 设置 required 和 defaultValue

3. 函数要求：
   - up 和 down 都必须是 async 函数
   - 都必须接收 DrizzleDB 和可选的 MigrationParameters 参数
   - 都必须返回 Promise<void>
   - 参数通过第二个参数传递，类型为 MigrationParameters | undefined

4. 参数使用：
   - 在函数内检查 params 是否存在
   - 使用类型断言获取具体参数值：params.paramName as ExpectedType
   - 确保 up 和 down 函数都正确处理参数

5. API调用示例：
   - 获取参数需求：GET /api/migration/parameter-requirements?targetVersion=10
   - 执行迁移：POST /api/migration/execute
     Body: {
       "parameters": {
         "5": {
           "asset_url": "https://assets.example.com",
           "batch_size": 100,
           "enable_feature": true,
           "service_name": "production"
         }
       }
     }

6. 错误处理：
   - 让函数抛出异常，迁移系统会处理
   - 不要捕获和隐藏错误，除非你知道如何恰当处理

7. 数据安全：
   - 谨慎删除数据，考虑先备份
   - 测试 up 和 down 操作的完整性
   - 使用现有的操作函数确保类型安全

8. 性能考虑：
   - 对于大量数据，考虑分批处理
   - 使用参数控制批次大小
   - 必要时添加进度日志

9. 测试建议：
   - 在开发环境中测试迁移
   - 验证参数验证逻辑
   - 确保回滚操作正确工作
   - 测试不同的参数组合
*/