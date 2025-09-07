import { jsx } from 'hono/jsx'

interface LanguageSelectorProps {
    currentLanguage: string
    availableLanguages: string[]
}

export const LanguageSelector = (props: LanguageSelectorProps) => {
    // 语言代码到显示名称的映射
    const languageNames: Record<string, string> = {
        'zh-cn': '中文 (简体)',
        'zh-tw': '中文 (繁體)', 
        'ja': '日本語',
        'en': 'English',
        'ko': '한국어',
        'es': 'Español',
        'fr': 'Français',
        'de': 'Deutsch',
        'it': 'Italiano',
        'pt': 'Português',
        'ru': 'Русский'
    };

    // 构建语言选项列表
    const languageOptions = [
        { code: 'auto', name: '自动选择' },
        ...props.availableLanguages.map(langCode => ({
            code: langCode,
            name: languageNames[langCode] || langCode.toUpperCase()
        }))
    ];

    return (
        <div class="language-selector">
            <button class="language-selector-btn" id="languageSelectorBtn">
                <i class="fas fa-language"></i>
                <span class="language-text">
                    {languageOptions.find(lang => lang.code === props.currentLanguage)?.name || '自动选择'}
                </span>
                <i class="fas fa-chevron-down"></i>
            </button>
            <div class="language-dropdown" id="languageDropdown">
                {languageOptions.map(lang => (
                    <div 
                        class={`language-option ${lang.code === props.currentLanguage ? 'active' : ''}`}
                        data-lang={lang.code}
                    >
                        {lang.name}
                    </div>
                ))}
            </div>
        </div>
    )
}