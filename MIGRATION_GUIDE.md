# 迁移系统使用指南

## 概述

本项目现在支持**构建时自动生成迁移注册表**的解决方案，完美解决了 Cloudflare Workers 环境中无法动态扫描目录的限制。

## 🚀 核心特性

- ✅ **自动发现**：构建时自动扫描 `src/migrations/` 目录
- ✅ **静态导入**：生成静态导入语句，避免运行时动态导入问题
- ✅ **类型安全**：完整的 TypeScript 支持
- ✅ **零配置**：无需手动维护迁移文件列表

## 📁 目录结构

```
src/
├── migrations/                          # 迁移文件目录
│   ├── _template.ts                     # 迁移文件模板
│   └── 001_add_site_config_options.ts   # 示例迁移文件
└── app/db/utils/
    ├── migration-registry.ts            # 自动生成的注册表 (请勿手动编辑)
    ├── migration-scanner.ts             # 迁移扫描器
    └── migration-engine.ts              # 迁移执行引擎

scripts/
└── generate-migration-registry.js       # 注册表生成脚本
```

## 🔧 使用方法

### 1. 创建新的迁移文件

```bash
# 文件名格式：{版本号}_{描述}.ts
# 示例：001_add_user_settings.ts, 002_update_schema.ts
```

复制 `src/migrations/_template.ts` 并重命名为你的迁移文件。

### 2. 编写迁移代码

```typescript
export const version = 1;
export const description = 'Add new configuration options';

export const up = async (db: DrizzleDB, params?: MigrationParameters) => {
    // 向上迁移逻辑
};

export const down = async (db: DrizzleDB, params?: MigrationParameters) => {
    // 回滚逻辑
};
```

### 3. 生成注册表

```bash
# 手动生成
npm run build:migrations

# 自动生成 (在部署前自动执行)
npm run deploy
```

### 4. 验证编译

```bash
npx tsc --noEmit
```

## 🛠️ 构建脚本集成

`package.json` 中的脚本：

```json
{
  "scripts": {
    "build:migrations": "node scripts/generate-migration-registry.js",
    "prebuild": "npm run build:migrations",
    "deploy": "wrangler deploy --minify --keep-vars"
  }
}
```

- `prebuild` 钩子确保部署前自动生成最新的注册表
- `build:migrations` 可以手动运行重新生成注册表

## 🔍 工作原理

### 问题：为什么不能直接从目录扫描？

1. **Cloudflare Workers 限制**：
   - 无文件系统访问 (`fs` 模块不可用)
   - 运行在 V8 沙盒环境中
   - 不支持动态目录扫描

2. **传统方案的问题**：
   ```typescript
   // ❌ 在 Cloudflare Workers 中不可行
   import fs from 'fs';
   const files = fs.readdirSync('./migrations');
   ```

### 解决方案：构建时预生成

1. **构建时扫描**：使用 Node.js 脚本在构建时扫描迁移目录
2. **静态导入生成**：生成包含所有迁移文件静态导入的注册表
3. **运行时访问**：通过注册表在运行时访问迁移模块

### 生成的注册表示例

```typescript
// 自动生成的 migration-registry.ts
import * as migration_001_add_site_config_options from '../../../migrations/001_add_site_config_options';

const MIGRATION_MODULES: Record<string, any> = {
    '001_add_site_config_options.ts': migration_001_add_site_config_options,
};

export function getRegisteredMigrationFiles(): string[] {
    return ['001_add_site_config_options.ts'];
}

export function getMigrationModule(fileName: string): any | null {
    return MIGRATION_MODULES[fileName] || null;
}
```

## 📝 迁移文件规范

### 文件命名

- 格式：`{三位数版本号}_{英文描述}.ts`
- 示例：`001_add_user_settings.ts`

### 必需导出

```typescript
export const version: number;      // 版本号，必须与文件名一致
export const description: string;  // 迁移描述
export const up: Function;         // 向上迁移函数
export const down: Function;       // 回滚函数
```

### 可选导出

```typescript
export const parameters: MigrationParameterDefinition[]; // 参数定义
```

## 🚀 优势

1. **开发体验**：无需手动维护迁移文件列表
2. **类型安全**：完整的 TypeScript 支持和编译时检查
3. **环境兼容**：完美适配 Cloudflare Workers 限制
4. **自动化**：集成到构建流程，减少人为错误
5. **可扩展**：支持参数化迁移和复杂的迁移逻辑

## 🎯 与传统方案对比

| 特性 | 传统动态扫描 | 本方案 |
|------|------------|--------|
| Cloudflare Workers 兼容性 | ❌ 不支持 | ✅ 完全支持 |
| 运行时性能 | ⚠️ 需要文件系统调用 | ✅ 静态导入，零开销 |
| 类型安全 | ⚠️ 动态导入，类型推断有限 | ✅ 完整类型支持 |
| 构建时验证 | ❌ 运行时才发现错误 | ✅ 构建时即可发现问题 |
| 维护成本 | ⚠️ 需要复杂的动态导入逻辑 | ✅ 自动化，无需手动维护 |

这个解决方案在保持开发便利性的同时，完美解决了 Cloudflare Workers 环境的技术限制！