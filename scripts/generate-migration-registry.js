#!/usr/bin/env node

/**
 * 迁移注册表生成脚本
 *
 * 扫描 src/migrations 目录，自动生成 migration-registry.ts 文件
 * 解决 Cloudflare Workers 环境中无法动态扫描目录的问题
 */

const fs = require('fs');
const path = require('path');

// 配置路径
const MIGRATIONS_DIR = path.join(__dirname, '../src/migrations');
const REGISTRY_FILE = path.join(__dirname, '../src/app/db/utils/migration-registry.ts');

/**
 * 验证迁移文件名格式
 */
function validateMigrationFileName(fileName) {
    const pattern = /^(\d{3})_(.+)\.ts$/;
    return pattern.test(fileName);
}

/**
 * 从文件名提取信息
 */
function parseMigrationFileName(fileName) {
    const pattern = /^(\d{3})_(.+)\.ts$/;
    const match = fileName.match(pattern);
    if (!match) return null;

    const [, versionStr, description] = match;
    return {
        version: parseInt(versionStr, 10),
        description: description.replace(/_/g, ' ')
    };
}

/**
 * 扫描迁移目录
 */
function scanMigrationFiles() {
    console.log('扫描迁移目录:', MIGRATIONS_DIR);

    // 检查目录是否存在
    if (!fs.existsSync(MIGRATIONS_DIR)) {
        console.log('迁移目录不存在，创建空的注册表');
        return [];
    }

    // 读取目录内容
    const files = fs.readdirSync(MIGRATIONS_DIR);
    const migrationFiles = [];

    for (const file of files) {
        // 只处理 .ts 文件
        if (!file.endsWith('.ts')) continue;

        // 跳过模板文件和非迁移文件
        if (file.startsWith('_') || file.startsWith('.')) continue;

        // 验证文件名格式
        if (!validateMigrationFileName(file)) {
            console.warn(`警告: 文件名格式无效: ${file}`);
            continue;
        }

        const parsed = parseMigrationFileName(file);
        if (!parsed) {
            console.warn(`警告: 无法解析文件名: ${file}`);
            continue;
        }

        migrationFiles.push({
            fileName: file,
            version: parsed.version,
            description: parsed.description
        });

        console.log(`发现迁移文件: ${file} (v${parsed.version})`);
    }

    // 按版本号排序
    migrationFiles.sort((a, b) => a.version - b.version);

    return migrationFiles;
}

/**
 * 生成 TypeScript 代码
 */
function generateRegistryCode(migrationFiles) {
    const currentTime = new Date().toISOString();

    // 生成导入语句
    const imports = migrationFiles.map(file => {
        const moduleName = file.fileName.replace('.ts', '').replace(/[^a-zA-Z0-9_]/g, '_');
        return `import * as migration_${moduleName} from '../../../migrations/${file.fileName.replace('.ts', '')}';`;
    }).join('\n');

    // 生成模块映射
    const moduleMap = migrationFiles.map(file => {
        const moduleName = file.fileName.replace('.ts', '').replace(/[^a-zA-Z0-9_]/g, '_');
        return `    '${file.fileName}': migration_${moduleName},`;
    }).join('\n');

    // 生成文件列表
    const fileList = migrationFiles.map(file => {
        return `        '${file.fileName}',`;
    }).join('\n');

    // 生成文件信息
    const fileInfo = migrationFiles.map(file => {
        return `    { fileName: '${file.fileName}', version: ${file.version}, description: '${file.description}' },`;
    }).join('\n');

    return `/**
 * 自动生成的迁移文件注册表
 *
 * 此文件由 scripts/generate-migration-registry.js 自动生成
 * 请勿手动编辑
 */

// 静态导入所有迁移模块
${imports || '// 当前没有可用的迁移文件'}

/**
 * 迁移模块映射表
 *
 * 使用静态导入来避免 Cloudflare Workers 中动态导入的路径问题
 */
const MIGRATION_MODULES: Record<string, any> = {
${moduleMap || '    // 当前没有注册的迁移模块'}
};

/**
 * 获取已注册的迁移文件列表
 */
export function getRegisteredMigrationFiles(): string[] {
    return [
${fileList || '        // 当前没有注册的迁移文件'}
    ];
}

/**
 * 根据文件名获取迁移模块
 */
export function getMigrationModule(fileName: string): any | null {
    return MIGRATION_MODULES[fileName] || null;
}

/**
 * 迁移文件信息
 */
export const MIGRATION_FILE_INFO: Array<{ fileName: string; version: number; description: string }> = [
${fileInfo || '    // 当前没有注册的迁移文件'}
];

/**
 * 最后更新时间
 */
export const REGISTRY_GENERATED_AT = '${currentTime}';

/**
 * 注册的迁移文件数量
 */
export const REGISTERED_FILES_COUNT = ${migrationFiles.length};
`;
}

/**
 * 主执行函数
 */
function main() {
    console.log('开始生成迁移注册表...');

    try {
        // 扫描迁移文件
        const migrationFiles = scanMigrationFiles();

        // 生成代码
        const code = generateRegistryCode(migrationFiles);

        // 确保输出目录存在
        const outputDir = path.dirname(REGISTRY_FILE);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        // 写入文件
        fs.writeFileSync(REGISTRY_FILE, code, 'utf8');

        console.log(`✅ 生成完成: ${REGISTRY_FILE}`);
        console.log(`📁 注册了 ${migrationFiles.length} 个迁移文件`);

        if (migrationFiles.length > 0) {
            console.log('注册的迁移文件:');
            migrationFiles.forEach(file => {
                console.log(`  - ${file.fileName} (v${file.version}): ${file.description}`);
            });
        }

    } catch (error) {
        console.error('❌ 生成失败:', error.message);
        process.exit(1);
    }
}

// 运行脚本
if (require.main === module) {
    main();
}

module.exports = { main, scanMigrationFiles, generateRegistryCode };