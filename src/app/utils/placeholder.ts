import type { WorkTitle } from '../db/types';

export interface PlaceholderContext {
    workTitle?: string;
    categoryName?: string;
    tagName?: string;
    searchQuery?: string;
    pageNumber?: number;
    totalCount?: number;
    tabName?: string;
    tabId?: string;
}

/**
 * 从作品信息中提取显示标题
 * @param workInfo 作品信息
 * @param userLang 用户首选语言
 * @returns 显示标题
 */
export function getWorkDisplayTitle(workInfo: any, userLang: string = 'zh-cn'): string {
    let displayTitle = "";

    if (workInfo.titles && workInfo.titles.length > 0) {
        // Filter out ForSearch titles for display
        const displayTitles = workInfo.titles.filter((t: WorkTitle) => !t.is_for_search);
        
        if (displayTitles.length > 0) {
            const userLangTitle = displayTitles.find((t: WorkTitle) => t.language === userLang);
            if (userLangTitle) {
                displayTitle = userLangTitle.title;
            } else {
                const officialTitle = displayTitles.find((t: WorkTitle) => t.is_official);
                if (officialTitle) {
                    displayTitle = officialTitle.title;
                } else {
                    displayTitle = displayTitles[0].title;
                }
            }
        }
    }

    return displayTitle || 'Unknown Title';
}

/**
 * 替换字符串模板中的占位符
 * @param template 包含占位符的模板字符串
 * @param context 占位符上下文数据
 * @returns 替换后的字符串
 */
export function replacePlaceholders(template: string, context: PlaceholderContext): string {
    let result = template;
    
    // 基础占位符替换
    if (context.workTitle) {
        result = result.replace(/{WORK_TITLE}/g, escapeHtml(context.workTitle));
    }
    if (context.categoryName) {
        result = result.replace(/{CATEGORY_NAME}/g, escapeHtml(context.categoryName));
    }
    if (context.tagName) {
        result = result.replace(/{TAG_NAME}/g, escapeHtml(context.tagName));
    }
    if (context.searchQuery) {
        result = result.replace(/{SEARCH_QUERY}/g, escapeHtml(context.searchQuery));
    }
    if (context.pageNumber !== undefined) {
        result = result.replace(/{PAGE_NUMBER}/g, String(context.pageNumber));
    }
    if (context.totalCount !== undefined) {
        result = result.replace(/{TOTAL_COUNT}/g, String(context.totalCount));
    }
    if (context.tabName) {
        result = result.replace(/{TAB_NAME}/g, escapeHtml(context.tabName));
    }
    if (context.tabId) {
        result = result.replace(/{TAB_ID}/g, escapeHtml(context.tabId));
    }
    
    // 条件占位符处理 (如果值不存在则移除整个条件块)
    result = result.replace(/{([A-Z_]+)\?([^}]*)}/g, (match, placeholder, content) => {
        const key = placeholderToContextKey(placeholder);
        const value = context[key as keyof PlaceholderContext];
        if (value !== undefined && value !== null && value !== '') {
            // 在内容中替换占位符
            return content.replace(new RegExp(`{${placeholder}}`, 'g'), escapeHtml(String(value)));
        }
        return '';
    });
    
    // 清理剩余的未替换占位符（避免显示 {PLACEHOLDER} 这样的文本）
    result = result.replace(/{[A-Z_]+}/g, '');
    
    return result;
}

/**
 * 将占位符名称转换为上下文对象的键名
 */
function placeholderToContextKey(placeholder: string): string {
    const mapping: Record<string, string> = {
        'WORK_TITLE': 'workTitle',
        'CATEGORY_NAME': 'categoryName',
        'TAG_NAME': 'tagName',
        'SEARCH_QUERY': 'searchQuery',
        'PAGE_NUMBER': 'pageNumber',
        'TOTAL_COUNT': 'totalCount',
        'TAB_NAME': 'tabName',
        'TAB_ID': 'tabId'
    };
    return mapping[placeholder] || placeholder.toLowerCase().replace(/_/g, '');
}

/**
 * HTML 转义函数，防止 XSS 攻击
 */
function escapeHtml(text: string): string {
    // 服务器端方案
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}