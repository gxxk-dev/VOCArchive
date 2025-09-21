-- 删除所有表的SQL脚本
-- 注意：此脚本将删除数据库中的所有数据，请谨慎使用！

-- 禁用外键约束以避免删除顺序问题
PRAGMA foreign_keys = OFF;

-- 删除所有表（按依赖关系排序）

-- 删除关联表/中间表
DROP TABLE IF EXISTS asset_external_object;
DROP TABLE IF EXISTS media_source_external_object;
DROP TABLE IF EXISTS work_tag;
DROP TABLE IF EXISTS work_category;
DROP TABLE IF EXISTS work_creator;
DROP TABLE IF EXISTS asset_creator;
DROP TABLE IF EXISTS work_relation;

-- 删除依赖表
DROP TABLE IF EXISTS work_license;
DROP TABLE IF EXISTS work_title;
DROP TABLE IF EXISTS work_wiki;
DROP TABLE IF EXISTS creator_wiki;
DROP TABLE IF EXISTS external_object;

-- 删除主要内容表
DROP TABLE IF EXISTS asset;
DROP TABLE IF EXISTS media_source;

-- 删除分类相关表
DROP TABLE IF EXISTS tag;
DROP TABLE IF EXISTS category;

-- 删除核心表
DROP TABLE IF EXISTS work;
DROP TABLE IF EXISTS creator;
DROP TABLE IF EXISTS external_source;

-- 删除配置表
DROP TABLE IF EXISTS footer_settings;
DROP TABLE IF EXISTS site_config;

-- 重新启用外键约束
PRAGMA foreign_keys = ON;

-- 验证所有表已删除
SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';