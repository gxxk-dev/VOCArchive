# 数据库迁移文件说明

此目录包含VOCArchive项目的数据库版本迁移脚本。

## 迁移文件命名规范

迁移文件必须按照以下格式命名：

```
<序号>_<描述>.ts
```

### 示例
- `001_add_new_config.ts` - 添加新配置项
- `002_update_schema.ts` - 更新数据库结构
- `003_migrate_data.ts` - 数据迁移

## 迁移文件结构

每个迁移文件必须导出以下内容：

```typescript
import type { DrizzleDB } from '../app/db/client';
import { upsertSiteConfig, deleteSiteConfig } from '../app/db/operations/config';

export const version = 1; // 版本号，必须与文件名序号一致
export const description = '描述这个迁移的作用'; // 可读的描述

// 正向迁移函数
export const up = async (db: DrizzleDB) => {
  // 执行数据库更改
  await upsertSiteConfig(db, 'new_config_key', 'default_value', '新配置项');
};

// 回滚函数
export const down = async (db: DrizzleDB) => {
  // 撤销数据库更改
  await deleteSiteConfig(db, 'new_config_key');
};
```

## 迁移编写规范

1. **版本号管理**:
   - version字段必须与文件名的序号一致
   - 序号从001开始，按顺序递增

2. **函数签名**:
   - `up`和`down`函数都必须是async函数
   - 都必须接收`DrizzleDB`类型的参数
   - 都必须返回Promise<void>

3. **事务安全**:
   - 尽量使用现有的数据库操作函数 (src/app/db/operations/)
   - 避免直接编写SQL语句
   - 确保迁移是原子性的

4. **可回滚性**:
   - down函数必须能够完全撤销up函数的操作
   - 测试迁移的正向和反向操作

5. **数据安全**:
   - 在删除数据前先备份
   - 使用事务确保数据一致性
   - 添加适当的错误处理

## 常用操作示例

### 配置管理
```typescript
// 添加配置
await upsertSiteConfig(db, 'key', 'value', 'description');

// 删除配置
await deleteSiteConfig(db, 'key');
```

### 数据表操作
```typescript
// 使用现有schema和operations
import { siteConfig } from '../app/db/schema';
import { eq } from 'drizzle-orm';

// 查询
const config = await db.select().from(siteConfig).where(eq(siteConfig.key, 'some_key'));

// 插入
await db.insert(siteConfig).values({ key: 'new_key', value: 'new_value' });

// 更新
await db.update(siteConfig).set({ value: 'updated_value' }).where(eq(siteConfig.key, 'some_key'));

// 删除
await db.delete(siteConfig).where(eq(siteConfig.key, 'some_key'));
```

## 执行流程

1. 迁移系统扫描migrations目录中的所有.ts文件
2. 根据文件名排序，确定执行顺序
3. 检查当前数据库版本 (siteConfig.db_version)
4. 执行所有大于当前版本的迁移
5. 更新数据库版本到最新版本

## 注意事项

- **不要修改已部署的迁移文件** - 如果需要修改，创建新的迁移文件
- **测试迁移** - 在开发环境中充分测试up和down操作
- **版本控制** - 确保迁移文件与代码一起提交
- **部署顺序** - 在部署新代码前执行迁移
- **备份** - 在生产环境执行迁移前备份数据库