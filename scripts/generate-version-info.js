// 构建时生成版本信息的脚本

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function getGitInfo() {
    try {
        const gitCommit = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
        const gitBranch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
        const commitMessage = execSync('git log -1 --pretty=%s', { encoding: 'utf8' }).trim();
        return { gitCommit, gitBranch, commitMessage };
    } catch (error) {
        console.warn('Warning: Could not get Git information:', error.message);
        return { gitCommit: undefined, gitBranch: undefined, commitMessage: undefined };
    }
}

function hasUncommittedChanges() {
    try {
        const status = execSync('git status --porcelain', { encoding: 'utf8' }).trim();
        return status.length > 0;
    } catch (error) {
        console.warn('Warning: Could not check git status:', error.message);
        return true; // 如果无法检查，假设有未提交的更改
    }
}

function getCurrentGitTag() {
    try {
        const tag = execSync('git describe --exact-match --tags HEAD', { encoding: 'utf8' }).trim();
        return tag;
    } catch (error) {
        // 当前 commit 没有 tag
        return null;
    }
}

function parseGitTag(tag) {
    // 解析格式: vX.Y.Z-tag.N
    // 例如: v1.5.0-rc.1
    const match = tag.match(/^v[\d.]+-(alpha|beta|rc|stable)\.(\d+)$/);
    if (match) {
        return {
            versionTag: match[1],
            tagNum: parseInt(match[2], 10)
        };
    }
    // 如果格式不匹配，返回 null
    return null;
}

function getPackageVersion() {
    try {
        const packagePath = path.join(__dirname, '../package.json');
        const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
        return packageJson.version;
    } catch (error) {
        console.warn('Warning: Could not read package.json:', error.message);
        return '0.0.0';
    }
}

function generateFullVersion() {
    const { gitCommit } = getGitInfo();
    const baseVersion = getPackageVersion(); // 例如: 1.5.0

    if (!gitCommit) {
        console.warn('Warning: No git commit found, using base version');
        return baseVersion;
    }

    const commitHash = gitCommit.substring(0, 8);
    const hasChanges = hasUncommittedChanges();
    const gitTag = getCurrentGitTag();

    let versionTag = 'alpha';
    let tagNum = 0;

    // 如果没有未提交的更改且有 tag，解析 tag
    if (!hasChanges && gitTag) {
        const parsed = parseGitTag(gitTag);
        if (parsed) {
            versionTag = parsed.versionTag;
            tagNum = parsed.tagNum;
        } else {
            console.warn(`Warning: Could not parse git tag "${gitTag}", using alpha.0`);
        }
    } else {
        if (hasChanges) {
            console.log('Uncommitted changes detected, using alpha.0');
        } else {
            console.log('No git tag found, using alpha.0');
        }
    }

    // 拼接: vMAJOR.MINOR.PATCH-versiontag.num-commithash
    return `v${baseVersion}-${versionTag}.${tagNum}-${commitHash}`;
}

function generateVersionInfo() {
    const { gitCommit, gitBranch, commitMessage } = getGitInfo();
    const fullVersion = generateFullVersion();
    const buildTime = new Date().toISOString();
    const buildEnv = process.env.NODE_ENV || 'development';

    const versionInfo = {
        version: fullVersion,
        gitCommit,
        gitBranch,
        commitMessage,
        buildTime,
        buildEnv
    };

    console.log('Generated version info:', versionInfo);

    const versionContent = `// 版本信息管理器
// 用于获取应用版本、Git信息等
// 此文件由构建脚本自动生成，请勿手动修改

export interface VersionInfo {
    version: string;
    gitCommit?: string;
    gitBranch?: string;
    commitMessage?: string;
    buildTime?: string;
    buildEnv?: string;
}

// 构建时生成的版本信息
const VERSION_INFO: VersionInfo = ${JSON.stringify(versionInfo, null, 4)};

/**
 * 获取应用版本信息
 */
export function getVersionInfo(): VersionInfo {
    return VERSION_INFO;
}

/**
 * 获取版本字符串
 * 返回完整的版本号，格式: vMAJOR.MINOR.PATCH-versiontag.num-commithash
 */
export function getVersionString(): string {
    return getVersionInfo().version;
}

/**
 * 获取完整的版本描述
 */
export function getFullVersionString(): string {
    const info = getVersionInfo();
    let parts = [info.version];

    if (info.commitMessage) {
        parts.push(info.commitMessage);
    }

    if (info.gitBranch) {
        parts.push(\`branch \${info.gitBranch}\`);
    }

    if (info.buildTime) {
        const buildDate = new Date(info.buildTime);
        parts.push(\`built \${buildDate.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}\`);
    }

    return parts.join(' • ');
}

/**
 * 检查是否为开发环境
 */
export function isDevelopment(): boolean {
    return getVersionInfo().buildEnv === 'development';
}

/**
 * 检查是否为生产环境
 */
export function isProduction(): boolean {
    return getVersionInfo().buildEnv === 'production';
}
`;

    const outputPath = path.join(__dirname, '../src/app/utils/version-info.ts');
    fs.writeFileSync(outputPath, versionContent);
    console.log('Version info file generated:', outputPath);
}

if (require.main === module) {
    generateVersionInfo();
}

module.exports = { generateVersionInfo };
