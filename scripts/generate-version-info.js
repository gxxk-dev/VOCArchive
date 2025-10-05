// 构建时生成版本信息的脚本

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function getGitInfo() {
    try {
        const gitCommit = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
        const gitBranch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
        return { gitCommit, gitBranch };
    } catch (error) {
        console.warn('Warning: Could not get Git information:', error.message);
        return { gitCommit: undefined, gitBranch: undefined };
    }
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

function generateVersionInfo() {
    const { gitCommit, gitBranch } = getGitInfo();
    const version = getPackageVersion();
    const buildTime = new Date().toISOString();
    const buildEnv = process.env.NODE_ENV || 'development';

    const versionInfo = {
        version,
        gitCommit,
        gitBranch,
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
 */
export function getVersionString(): string {
    const info = getVersionInfo();
    let versionStr = \`v\${info.version}\`;

    if (info.gitCommit) {
        versionStr += \` (\${info.gitCommit.substring(0, 7)})\`;
    }

    return versionStr;
}

/**
 * 获取完整的版本描述
 */
export function getFullVersionString(): string {
    const info = getVersionInfo();
    let parts = [\`v\${info.version}\`];

    if (info.gitCommit) {
        parts.push(\`commit \${info.gitCommit}\`);
    }

    if (info.gitBranch) {
        parts.push(\`branch \${info.gitBranch}\`);
    }

    if (info.buildTime) {
        const buildDate = new Date(info.buildTime);
        parts.push(\`built \${buildDate.toLocaleString()}\`);
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