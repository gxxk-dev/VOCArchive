/**
 * 添加Wiki平台管理功能
 *
 * 此迁移添加wiki_platform表和默认平台配置：
 * 1. 创建wiki_platform表存储Wiki平台配置
 * 2. 添加URL模板支持，包含占位符功能
 * 3. 预设常见平台配置（Wikipedia、VocaDB、Bilibili等）
 * 4. 支持平台排序和启用/禁用状态
 */

import type { DrizzleDB } from '../app/db/client';
import type { MigrationParameters, MigrationParameterDefinition } from '../app/db/types/migration';
import { wikiPlatform } from '../app/db/schema';
import { eq } from 'drizzle-orm';

export const version = 2;
export const description = '添加Wiki平台管理功能';

// 此迁移不需要用户参数
export const parameters: MigrationParameterDefinition[] = [];

/**
 * 正向迁移：创建wiki_platform表并添加默认数据
 */
export const up = async (db: DrizzleDB, params?: MigrationParameters): Promise<void> => {
    console.log('开始Wiki平台管理功能迁移...');

    // 步骤1：创建wiki_platform表
    console.log('步骤1: 创建wiki_platform表');
    await db.run(`
        CREATE TABLE IF NOT EXISTS "wiki_platform" (
            "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
            "platform_key" text NOT NULL UNIQUE,
            "platform_name" text NOT NULL,
            "url_template" text NOT NULL,
            "icon_class" text
        )
    `);

    // 步骤2：插入默认Wiki平台配置
    console.log('步骤2: 插入默认Wiki平台配置');

    const defaultPlatforms = [
        // 百科类
        {
            platform_key: 'wikipedia_zh',
            platform_name: '维基百科(中文)',
            url_template: 'https://zh.wikipedia.org/wiki/{ENCODED_ID}',
            icon_class: 'fa-wikipedia-w'
        },
        {
            platform_key: 'wikipedia_ja',
            platform_name: 'Wikipedia(日本語)',
            url_template: 'https://ja.wikipedia.org/wiki/{ENCODED_ID}',
            icon_class: 'fa-wikipedia-w'
        },
        {
            platform_key: 'moegirlpedia',
            platform_name: '萌娘百科',
            url_template: 'https://zh.moegirl.org.cn/{ENCODED_ID}',
            icon_class: 'fa-book'
        },
        {
            platform_key: 'thwiki',
            platform_name: 'THBWiki',
            url_template: 'https://thwiki.cc/{ENCODED_ID}',
            icon_class: 'fa-book'
        },

        // 音乐数据库
        {
            platform_key: 'vocadb',
            platform_name: 'VocaDB',
            url_template: 'https://vocadb.net/S/{ID}',
            icon_class: 'fa-music'
        },
        {
            platform_key: 'utaitedb',
            platform_name: 'UtaiteDB',
            url_template: 'https://utaitedb.net/Ar/{ID}',
            icon_class: 'fa-microphone'
        },

        // 视频平台
        {
            platform_key: 'niconico',
            platform_name: 'ニコニコ動画',
            url_template: 'https://www.nicovideo.jp/watch/{ID}',
            icon_class: 'fa-play-circle'
        },
        {
            platform_key: 'bilibili',
            platform_name: '哔哩哔哩',
            url_template: 'https://www.bilibili.com/video/{ID}',
            icon_class: 'fa-play-circle'
        },
        {
            platform_key: 'youtube',
            platform_name: 'YouTube',
            url_template: 'https://www.youtube.com/watch?v={ID}',
            icon_class: 'fa-youtube'
        },

        // 社交媒体
        {
            platform_key: 'twitter',
            platform_name: 'Twitter/X',
            url_template: 'https://twitter.com/{ID}',
            icon_class: 'fa-twitter'
        },
        {
            platform_key: 'pixiv',
            platform_name: 'Pixiv',
            url_template: 'https://www.pixiv.net/users/{ID}',
            icon_class: 'fa-paint-brush'
        },

        // 百度百科
        {
            platform_key: 'baidu_baike',
            platform_name: '百度百科',
            url_template: 'https://baike.baidu.com/item/{ENCODED_ID}',
            icon_class: 'fa-book'
        }
    ];

    // 检查每个平台是否已存在，如果不存在则插入
    for (const platform of defaultPlatforms) {
        try {
            // 检查平台是否已存在
            const existing = await db.select()
                .from(wikiPlatform)
                .where(eq(wikiPlatform.platform_key, platform.platform_key))
                .limit(1);

            if (existing.length === 0) {
                await db.insert(wikiPlatform).values(platform);
                console.log(`插入平台配置: ${platform.platform_name}`);
            } else {
                console.log(`平台配置已存在，跳过: ${platform.platform_name}`);
            }
        } catch (error) {
            console.error(`插入平台配置失败: ${platform.platform_name}`, error);
            // 继续处理其他平台，不因单个失败而中断
        }
    }

    console.log(`Migration ${version}: ${description} - UP completed`);
    console.log('Wiki平台管理功能已成功添加');

    // 步骤3：迁移现有数据的platform字段值
    console.log('步骤3: 迁移现有数据的platform字段值');

    // 定义platform值的映射关系
    const platformMappings = {
        'moegirl': 'moegirlpedia',
        'baidu': 'baidu_baike',
        'thbwiki': 'thwiki'
    };

    // 更新work_wiki表中的platform字段
    for (const [oldPlatform, newPlatform] of Object.entries(platformMappings)) {
        try {
            const updateWorkWikiResult = await db.run(`
                UPDATE work_wiki
                SET platform = '${newPlatform}'
                WHERE platform = '${oldPlatform}'
            `);

            console.log(`更新work_wiki platform '${oldPlatform}' -> '${newPlatform}': ${updateWorkWikiResult.meta.changes} 条记录`);
        } catch (error) {
            console.error(`更新work_wiki platform字段失败: ${oldPlatform}`, error);
        }
    }

    // 更新creator_wiki表中的platform字段
    for (const [oldPlatform, newPlatform] of Object.entries(platformMappings)) {
        try {
            const updateCreatorWikiResult = await db.run(`
                UPDATE creator_wiki
                SET platform = '${newPlatform}'
                WHERE platform = '${oldPlatform}'
            `);

            console.log(`更新creator_wiki platform '${oldPlatform}' -> '${newPlatform}': ${updateCreatorWikiResult.meta.changes} 条记录`);
        } catch (error) {
            console.error(`更新creator_wiki platform字段失败: ${oldPlatform}`, error);
        }
    }

    console.log('现有wiki数据的platform字段迁移完成');
};

/**
 * 回滚函数：删除wiki_platform表和相关数据
 */
export const down = async (db: DrizzleDB, params?: MigrationParameters): Promise<void> => {
    console.log('开始回滚Wiki平台管理功能...');

    // 步骤1：还原platform字段值到原始状态
    console.log('步骤1: 还原platform字段值到原始状态');

    // 定义回滚时的映射关系（与up相反）
    const rollbackPlatformMappings = {
        'moegirlpedia': 'moegirl',
        'baidu_baike': 'baidu',
        'thwiki': 'thbwiki'
    };

    // 还原work_wiki表中的platform字段
    for (const [newPlatform, oldPlatform] of Object.entries(rollbackPlatformMappings)) {
        try {
            const rollbackWorkWikiResult = await db.run(`
                UPDATE work_wiki
                SET platform = '${oldPlatform}'
                WHERE platform = '${newPlatform}'
            `);

            console.log(`还原work_wiki platform '${newPlatform}' -> '${oldPlatform}': ${rollbackWorkWikiResult.meta.changes} 条记录`);
        } catch (error) {
            console.error(`还原work_wiki platform字段失败: ${newPlatform}`, error);
        }
    }

    // 还原creator_wiki表中的platform字段
    for (const [newPlatform, oldPlatform] of Object.entries(rollbackPlatformMappings)) {
        try {
            const rollbackCreatorWikiResult = await db.run(`
                UPDATE creator_wiki
                SET platform = '${oldPlatform}'
                WHERE platform = '${newPlatform}'
            `);

            console.log(`还原creator_wiki platform '${newPlatform}' -> '${oldPlatform}': ${rollbackCreatorWikiResult.meta.changes} 条记录`);
        } catch (error) {
            console.error(`还原creator_wiki platform字段失败: ${newPlatform}`, error);
        }
    }

    console.log('platform字段值已还原到迁移前状态');

    // 步骤2：删除wiki_platform表
    console.log('步骤2: 删除wiki_platform表');
    await db.run(`DROP TABLE IF EXISTS "wiki_platform"`);

    console.log(`Migration ${version}: ${description} - DOWN completed`);
    console.log('Wiki平台管理功能已成功回滚');
};

/*
迁移说明：

1. 功能概述：
   - 创建wiki_platform表存储平台配置
   - 支持URL模板与占位符功能
   - 预设11个常见平台配置
   - 支持排序和状态管理

2. 表结构：
   - id: 自增主键
   - uuid: 外部访问标识符
   - platform_key: 平台唯一键
   - platform_name: 显示名称
   - url_template: URL模板（支持占位符）
   - icon_class: 图标样式类名
   - is_active: 启用状态
   - sort_order: 排序顺序

3. URL模板占位符：
   - {ID}: 直接替换为identifier
   - {ENCODED_ID}: URL编码后的identifier
   - {LANG}: 语言代码
   - {TYPE}: 条目类型

4. 预设平台包括：
   - 百科类：维基百科、萌娘百科、THBWiki
   - 音乐数据库：VocaDB、UtaiteDB
   - 视频平台：ニコニコ、哔哩哔哩、YouTube
   - 社交媒体：Twitter/X、Pixiv

5. 兼容性：
   - 幂等操作：重复执行不会产生错误
   - 优雅降级：单个平台插入失败不影响其他平台
   - 完整回滚：down函数可以完全撤销所有更改

6. 使用方式：
   - 自动执行：迁移系统会自动处理
   - 手动执行：通过管理界面的迁移功能
   - API调用：POST /api/migration/execute

7. 依赖关系：
   - 依赖schema.ts中的wikiPlatform定义
   - 与work_wiki、creator_wiki表配合使用
   - 需要wiki-platforms操作函数支持
*/