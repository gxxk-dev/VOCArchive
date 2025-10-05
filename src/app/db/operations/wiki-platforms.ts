import { eq, asc } from 'drizzle-orm';
import type { DrizzleDB } from '../client';
import { wikiPlatform } from '../schema';
import type { WikiPlatform, NewWikiPlatform, WikiPlatformApiInput } from '../types';

/**
 * 获取所有Wiki平台配置（按平台名称排序）
 */
export async function getAllWikiPlatforms(db: DrizzleDB): Promise<WikiPlatform[]> {
    return await db.select()
        .from(wikiPlatform)
        .orderBy(asc(wikiPlatform.platform_name));
}

/**
 * 获取激活的Wiki平台配置
 * 注意：由于删除了is_active字段，此函数与getAllWikiPlatforms相同
 */
export async function getActiveWikiPlatforms(db: DrizzleDB): Promise<WikiPlatform[]> {
    return await getAllWikiPlatforms(db);
}

/**
 * 根据平台键获取Wiki平台配置
 */
export async function getWikiPlatformByKey(db: DrizzleDB, platformKey: string): Promise<WikiPlatform | null> {
    const result = await db.select()
        .from(wikiPlatform)
        .where(eq(wikiPlatform.platform_key, platformKey))
        .limit(1);

    return result[0] || null;
}

/**
 * 根据ID获取Wiki平台配置
 */
export async function getWikiPlatform(db: DrizzleDB, id: number): Promise<WikiPlatform | null> {
    const result = await db.select()
        .from(wikiPlatform)
        .where(eq(wikiPlatform.id, id))
        .limit(1);

    return result[0] || null;
}

/**
 * 生成Wiki URL
 */
export function generateWikiUrl(
    platform: WikiPlatform,
    identifier: string,
    params?: Record<string, string>
): string {
    let url = platform.url_template;

    // 基础替换
    url = url.replace('{ID}', identifier);
    url = url.replace('{ENCODED_ID}', encodeURIComponent(identifier));

    // 额外参数替换
    if (params) {
        for (const [key, value] of Object.entries(params)) {
            url = url.replace(`{${key}}`, value);
        }
    }

    return url;
}

/**
 * 根据平台键生成Wiki URL（便捷方法）
 */
export async function generateWikiUrlByKey(
    db: DrizzleDB,
    platformKey: string,
    identifier: string,
    params?: Record<string, string>
): Promise<string | null> {
    const platform = await getWikiPlatformByKey(db, platformKey);
    if (!platform) {
        return null;
    }

    return generateWikiUrl(platform, identifier, params);
}

/**
 * 添加新的Wiki平台
 */
export async function insertWikiPlatform(
    db: DrizzleDB,
    platformData: WikiPlatformApiInput
): Promise<void> {
    await db.insert(wikiPlatform).values({
        platform_key: platformData.platform_key,
        platform_name: platformData.platform_name,
        url_template: platformData.url_template,
        icon_class: platformData.icon_class || null,
    });
}

/**
 * 更新Wiki平台
 */
export async function updateWikiPlatform(
    db: DrizzleDB,
    platformKey: string,
    platformData: Partial<WikiPlatformApiInput>
): Promise<boolean> {
    try {
        const updateData: Partial<NewWikiPlatform> = {};

        if (platformData.platform_key !== undefined) updateData.platform_key = platformData.platform_key;
        if (platformData.platform_name !== undefined) updateData.platform_name = platformData.platform_name;
        if (platformData.url_template !== undefined) updateData.url_template = platformData.url_template;
        if (platformData.icon_class !== undefined) updateData.icon_class = platformData.icon_class;

        const result = await db.update(wikiPlatform)
            .set(updateData)
            .where(eq(wikiPlatform.platform_key, platformKey));

        return true;
    } catch (error) {
        console.error('Error updating wiki platform:', error);
        return false;
    }
}

/**
 * 删除Wiki平台
 */
export async function deleteWikiPlatform(db: DrizzleDB, platformKey: string): Promise<boolean> {
    try {
        await db.delete(wikiPlatform).where(eq(wikiPlatform.platform_key, platformKey));
        return true;
    } catch (error) {
        console.error('Error deleting wiki platform:', error);
        return false;
    }
}

/**
 * 初始化默认Wiki平台配置
 */
export async function initializeDefaultWikiPlatforms(db: DrizzleDB): Promise<void> {
    const defaultPlatforms: WikiPlatformApiInput[] = [
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
            platform_name: 'ニコニコ动画',
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
        }
    ];

    // 检查每个平台是否已存在，如果不存在则插入
    for (const platform of defaultPlatforms) {
        try {
            const existing = await getWikiPlatformByKey(db, platform.platform_key);
            if (!existing) {
                await insertWikiPlatform(db, platform);
            }
        } catch (error) {
            console.warn(`Failed to initialize wiki platform ${platform.platform_key}:`, error);
        }
    }
}

/**
 * 获取Wiki引用的完整信息（包含URL）
 */
export interface WikiReferenceWithUrl {
    platform: string;
    platform_name: string;
    identifier: string;
    url: string;
    icon_class?: string;
}

/**
 * 为Wiki引用列表生成完整URL信息
 */
export async function enrichWikiReferences(
    db: DrizzleDB,
    wikis: Array<{ platform: string; identifier: string }>
): Promise<WikiReferenceWithUrl[]> {
    const enrichedWikis: WikiReferenceWithUrl[] = [];

    for (const wiki of wikis) {
        const platform = await getWikiPlatformByKey(db, wiki.platform);
        if (platform) {
            enrichedWikis.push({
                platform: wiki.platform,
                platform_name: platform.platform_name,
                identifier: wiki.identifier,
                url: generateWikiUrl(platform, wiki.identifier),
                icon_class: platform.icon_class || undefined
            });
        } else {
            // 如果找不到平台配置，返回基础信息
            enrichedWikis.push({
                platform: wiki.platform,
                platform_name: wiki.platform,
                identifier: wiki.identifier,
                url: wiki.identifier // 返回原始标识符作为fallback
            });
        }
    }

    return enrichedWikis;
}