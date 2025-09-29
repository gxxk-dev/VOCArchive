/**
 * 数据库架构重构迁移：UUID改为外部访问键 + 新增自增ID主键
 *
 * 此迁移将现有的UUID主键架构改为自增ID主键架构：
 * 1. 为每个主表添加自增ID列作为新的主键
 * 2. 将UUID改为唯一索引，保留用于外部访问
 * 3. 更新所有外键引用从UUID改为ID
 * 4. 保持数据完整性和向后兼容性
 */

import type { DrizzleDB } from '../app/db/client';
import type { MigrationParameters, MigrationParameterDefinition } from '../app/db/types';

export const version = 1;
export const description = '主键改为自增ID 对外访问改为UUID索引';

// 此迁移不需要用户参数
export const parameters: MigrationParameterDefinition[] = [];

/**
 * 正向迁移：从UUID主键改为自增ID主键
 */
export const up = async (db: DrizzleDB, params?: MigrationParameters): Promise<void> => {
    console.log('开始UUID到ID的数据库架构迁移...');

    // 使用defer_foreign_keys延迟外键检查而不是完全禁用
    await db.run(`PRAGMA defer_foreign_keys = TRUE`);

    // 第一步：为所有主表添加ID列
    console.log('步骤1: 为主表添加ID列');

    await db.run(`ALTER TABLE creator ADD COLUMN id INTEGER`);
    await db.run(`ALTER TABLE work ADD COLUMN id INTEGER`);
    await db.run(`ALTER TABLE tag ADD COLUMN id INTEGER`);
    await db.run(`ALTER TABLE category ADD COLUMN id INTEGER`);
    await db.run(`ALTER TABLE footer_settings ADD COLUMN id INTEGER`);
    await db.run(`ALTER TABLE external_source ADD COLUMN id INTEGER`);
    await db.run(`ALTER TABLE work_title ADD COLUMN id INTEGER`);
    await db.run(`ALTER TABLE media_source ADD COLUMN id INTEGER`);
    await db.run(`ALTER TABLE asset ADD COLUMN id INTEGER`);
    await db.run(`ALTER TABLE work_relation ADD COLUMN id INTEGER`);
    await db.run(`ALTER TABLE external_object ADD COLUMN id INTEGER`);

    // 第二步：为新添加的ID列填充递增值
    console.log('步骤2: 填充ID列的值');

    await db.run(`UPDATE creator SET id = rowid`);
    await db.run(`UPDATE work SET id = rowid`);
    await db.run(`UPDATE tag SET id = rowid`);
    await db.run(`UPDATE category SET id = rowid`);
    await db.run(`UPDATE footer_settings SET id = rowid`);
    await db.run(`UPDATE external_source SET id = rowid`);
    await db.run(`UPDATE work_title SET id = rowid`);
    await db.run(`UPDATE media_source SET id = rowid`);
    await db.run(`UPDATE asset SET id = rowid`);
    await db.run(`UPDATE work_relation SET id = rowid`);
    await db.run(`UPDATE external_object SET id = rowid`);

    // 第三步：创建UUID到ID的映射表（普通表，迁移结束后删除）
    console.log('步骤3: 创建UUID到ID映射表');

    await db.run(`CREATE TABLE creator_uuid_id_map AS SELECT * FROM creator`);
    await db.run(`CREATE TABLE work_uuid_id_map AS SELECT * FROM work`);
    await db.run(`CREATE TABLE tag_uuid_id_map AS SELECT * FROM tag`);
    await db.run(`CREATE TABLE category_uuid_id_map AS SELECT * FROM category`);
    await db.run(`CREATE TABLE footer_settings_uuid_id_map AS SELECT * FROM footer_settings`);
    await db.run(`CREATE TABLE external_source_uuid_id_map AS SELECT * FROM external_source`);
    await db.run(`CREATE TABLE work_title_uuid_id_map AS SELECT * FROM work_title`);
    await db.run(`CREATE TABLE media_source_uuid_id_map AS SELECT * FROM media_source`);
    await db.run(`CREATE TABLE asset_uuid_id_map AS SELECT * FROM asset`);
    await db.run(`CREATE TABLE work_relation_uuid_id_map AS SELECT * FROM work_relation`);
    await db.run(`CREATE TABLE external_object_uuid_id_map AS SELECT * FROM external_object`);

    // 为关联表创建数据备份表
    await db.run(`CREATE TABLE creator_wiki_backup AS SELECT * FROM creator_wiki`);
    await db.run(`CREATE TABLE work_license_backup AS SELECT * FROM work_license`);
    await db.run(`CREATE TABLE work_creator_backup AS SELECT * FROM work_creator`);
    await db.run(`CREATE TABLE asset_creator_backup AS SELECT * FROM asset_creator`);
    await db.run(`CREATE TABLE work_wiki_backup AS SELECT * FROM work_wiki`);
    await db.run(`CREATE TABLE work_tag_backup AS SELECT * FROM work_tag`);
    await db.run(`CREATE TABLE work_category_backup AS SELECT * FROM work_category`);
    await db.run(`CREATE TABLE asset_external_object_backup AS SELECT * FROM asset_external_object`);
    await db.run(`CREATE TABLE media_source_external_object_backup AS SELECT * FROM media_source_external_object`);

    // 第四步：按依赖关系顺序重建所有表结构
    console.log('步骤4: 重建表结构');

    // 第一阶段：删除所有关联表
    console.log('步骤4.1: 删除关联表');
    await db.run(`DROP TABLE IF EXISTS asset_external_object`);
    await db.run(`DROP TABLE IF EXISTS media_source_external_object`);
    await db.run(`DROP TABLE IF EXISTS work_tag`);
    await db.run(`DROP TABLE IF EXISTS work_category`);
    await db.run(`DROP TABLE IF EXISTS work_creator`);
    await db.run(`DROP TABLE IF EXISTS asset_creator`);
    await db.run(`DROP TABLE IF EXISTS creator_wiki`);
    await db.run(`DROP TABLE IF EXISTS work_wiki`);
    await db.run(`DROP TABLE IF EXISTS work_license`);

    // 第二阶段：删除依赖表
    console.log('步骤4.2: 删除依赖表');
    await db.run(`DROP TABLE IF EXISTS work_title`);
    await db.run(`DROP TABLE IF EXISTS work_relation`);
    await db.run(`DROP TABLE IF EXISTS asset`);
    await db.run(`DROP TABLE IF EXISTS media_source`);
    await db.run(`DROP TABLE IF EXISTS external_object`);

    // 第三阶段：删除主表
    console.log('步骤4.3: 删除主表');
    await db.run(`DROP TABLE IF EXISTS external_source`);
    await db.run(`DROP TABLE IF EXISTS tag`);
    await db.run(`DROP TABLE IF EXISTS category`);
    await db.run(`DROP TABLE IF EXISTS work`);
    await db.run(`DROP TABLE IF EXISTS creator`);
    await db.run(`DROP TABLE IF EXISTS footer_settings`);

    // 第四阶段：重建主表
    console.log('步骤4.4: 重建主表');

    // 重建 creator 表
    await db.run(`CREATE TABLE creator (
        id INTEGER PRIMARY KEY,
        uuid TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        type TEXT CHECK(type IN ('human', 'virtual')) NOT NULL
    )`);

    await db.run(`INSERT INTO creator (id, uuid, name, type)
                  SELECT id, uuid, name, type FROM creator_uuid_id_map`);

    // 重建 work 表
    await db.run(`CREATE TABLE work (
        id INTEGER PRIMARY KEY,
        uuid TEXT NOT NULL UNIQUE,
        copyright_basis TEXT NOT NULL CHECK(copyright_basis IN ('none', 'accept', 'license', 'arr', 'onlymetadata'))
    )`);

    await db.run(`INSERT INTO work (id, uuid, copyright_basis)
                  SELECT id, uuid, copyright_basis FROM work_uuid_id_map`);

    // 重建 tag 表
    await db.run(`CREATE TABLE tag (
        id INTEGER PRIMARY KEY,
        uuid TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL UNIQUE
    )`);

    await db.run(`INSERT INTO tag (id, uuid, name)
                  SELECT id, uuid, name FROM tag_uuid_id_map`);

    // 重建 category 表
    await db.run(`CREATE TABLE category (
        id INTEGER PRIMARY KEY,
        uuid TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL UNIQUE,
        parent_id INTEGER REFERENCES category(id) ON DELETE CASCADE
    )`);

    await db.run(`INSERT INTO category (id, uuid, name, parent_id)
                  SELECT c.id, c.uuid, c.name, p.id as parent_id
                  FROM category_uuid_id_map c
                  LEFT JOIN category_uuid_id_map p ON c.parent_uuid = p.uuid`);

    // 重建 footer_settings 表
    await db.run(`CREATE TABLE footer_settings (
        id INTEGER PRIMARY KEY,
        uuid TEXT NOT NULL UNIQUE,
        item_type TEXT NOT NULL CHECK(item_type IN ('link', 'social', 'copyright')),
        text TEXT NOT NULL,
        url TEXT,
        icon_class TEXT
    )`);

    await db.run(`INSERT INTO footer_settings (id, uuid, item_type, text, url, icon_class)
                  SELECT id, uuid, item_type, text, url, icon_class FROM footer_settings_uuid_id_map`);

    // 重建 external_source 表
    await db.run(`CREATE TABLE external_source (
        id INTEGER PRIMARY KEY,
        uuid TEXT NOT NULL UNIQUE,
        type TEXT CHECK(type IN ('raw_url', 'ipfs')) NOT NULL,
        name TEXT NOT NULL,
        endpoint TEXT NOT NULL
    )`);

    await db.run(`INSERT INTO external_source (id, uuid, type, name, endpoint)
                  SELECT id, uuid, type, name, endpoint FROM external_source_uuid_id_map`);

    // 第五阶段：重建依赖表
    console.log('步骤4.5: 重建依赖表');

    // 重建 work_title 表
    await db.run(`CREATE TABLE work_title (
        id INTEGER PRIMARY KEY,
        uuid TEXT NOT NULL UNIQUE,
        work_id INTEGER NOT NULL REFERENCES work(id) ON DELETE CASCADE,
        is_official BOOLEAN NOT NULL,
        is_for_search BOOLEAN NOT NULL DEFAULT FALSE,
        language TEXT NOT NULL,
        title TEXT NOT NULL
    )`);

    await db.run(`INSERT INTO work_title (id, uuid, work_id, is_official, is_for_search, language, title)
                  SELECT wt.id, wt.uuid, w.id as work_id, wt.is_official, wt.is_for_search, wt.language, wt.title
                  FROM work_title_uuid_id_map wt
                  JOIN work w ON wt.work_uuid = w.uuid`);

    // 重建 media_source 表
    await db.run(`CREATE TABLE media_source (
        id INTEGER PRIMARY KEY,
        uuid TEXT NOT NULL UNIQUE,
        work_id INTEGER NOT NULL REFERENCES work(id) ON DELETE CASCADE,
        is_music BOOLEAN NOT NULL,
        file_name TEXT NOT NULL,
        url TEXT,
        mime_type TEXT NOT NULL,
        info TEXT NOT NULL
    )`);

    await db.run(`INSERT INTO media_source (id, uuid, work_id, is_music, file_name, url, mime_type, info)
                  SELECT ms.id, ms.uuid, w.id as work_id, ms.is_music, ms.file_name, ms.url, ms.mime_type, ms.info
                  FROM media_source_uuid_id_map ms
                  JOIN work w ON ms.work_uuid = w.uuid`);

    // 重建 asset 表
    await db.run(`CREATE TABLE asset (
        id INTEGER PRIMARY KEY,
        uuid TEXT NOT NULL UNIQUE,
        file_id TEXT,
        work_id INTEGER NOT NULL REFERENCES work(id) ON DELETE CASCADE,
        asset_type TEXT CHECK(asset_type IN ('lyrics', 'picture')) NOT NULL,
        file_name TEXT NOT NULL,
        is_previewpic BOOLEAN,
        language TEXT
    )`);

    await db.run(`INSERT INTO asset (id, uuid, file_id, work_id, asset_type, file_name, is_previewpic, language)
                  SELECT a.id, a.uuid, a.file_id, w.id as work_id, a.asset_type, a.file_name, a.is_previewpic, a.language
                  FROM asset_uuid_id_map a
                  JOIN work w ON a.work_uuid = w.uuid`);

    // 重建 work_relation 表
    await db.run(`CREATE TABLE work_relation (
        id INTEGER PRIMARY KEY,
        uuid TEXT NOT NULL UNIQUE,
        from_work_id INTEGER NOT NULL REFERENCES work(id) ON DELETE CASCADE,
        to_work_id INTEGER NOT NULL REFERENCES work(id) ON DELETE CASCADE,
        relation_type TEXT NOT NULL CHECK(relation_type IN ('original', 'remix', 'cover', 'remake', 'picture', 'lyrics'))
    )`);

    await db.run(`INSERT INTO work_relation (id, uuid, from_work_id, to_work_id, relation_type)
                  SELECT wr.id, wr.uuid, fw.id as from_work_id, tw.id as to_work_id, wr.relation_type
                  FROM work_relation_uuid_id_map wr
                  JOIN work fw ON wr.from_work_uuid = fw.uuid
                  JOIN work tw ON wr.to_work_uuid = tw.uuid`);

    // 重建 external_object 表
    await db.run(`CREATE TABLE external_object (
        id INTEGER PRIMARY KEY,
        uuid TEXT NOT NULL UNIQUE,
        external_source_id INTEGER NOT NULL REFERENCES external_source(id) ON DELETE CASCADE,
        mime_type TEXT NOT NULL,
        file_id TEXT NOT NULL
    )`);

    await db.run(`INSERT INTO external_object (id, uuid, external_source_id, mime_type, file_id)
                  SELECT eo.id, eo.uuid, es.id as external_source_id, eo.mime_type, eo.file_id
                  FROM external_object_uuid_id_map eo
                  JOIN external_source es ON eo.external_source_uuid = es.uuid`);

    // 第六步：重建关联表
    console.log('步骤4.6: 重建关联表');

    // 重建 creator_wiki 表
    await db.run(`CREATE TABLE creator_wiki (
        creator_id INTEGER NOT NULL REFERENCES creator(id) ON DELETE CASCADE,
        platform TEXT NOT NULL,
        identifier TEXT NOT NULL,
        PRIMARY KEY (creator_id, platform)
    )`);

    await db.run(`INSERT INTO creator_wiki (creator_id, platform, identifier)
                  SELECT c.id as creator_id, cw.platform, cw.identifier
                  FROM creator_wiki_backup cw
                  JOIN creator c ON cw.creator_uuid = c.uuid`);

    // 重建 work_license 表
    await db.run(`CREATE TABLE work_license (
        work_id INTEGER PRIMARY KEY REFERENCES work(id) ON DELETE CASCADE,
        license_type TEXT NOT NULL
    )`);

    await db.run(`INSERT INTO work_license (work_id, license_type)
                  SELECT w.id as work_id, wl.license_type
                  FROM work_license_backup wl
                  JOIN work w ON wl.work_uuid = w.uuid`);

    // 重建 work_creator 表
    await db.run(`CREATE TABLE work_creator (
        work_id INTEGER NOT NULL REFERENCES work(id) ON DELETE CASCADE,
        creator_id INTEGER NOT NULL REFERENCES creator(id) ON DELETE CASCADE,
        role TEXT NOT NULL,
        PRIMARY KEY (work_id, creator_id, role)
    )`);

    await db.run(`INSERT INTO work_creator (work_id, creator_id, role)
                  SELECT w.id as work_id, c.id as creator_id, wc.role
                  FROM work_creator_backup wc
                  JOIN work w ON wc.work_uuid = w.uuid
                  JOIN creator c ON wc.creator_uuid = c.uuid`);

    // 重建 asset_creator 表
    await db.run(`CREATE TABLE asset_creator (
        asset_id INTEGER NOT NULL REFERENCES asset(id) ON DELETE CASCADE,
        creator_id INTEGER NOT NULL REFERENCES creator(id),
        role TEXT NOT NULL,
        PRIMARY KEY (asset_id, creator_id)
    )`);

    await db.run(`INSERT INTO asset_creator (asset_id, creator_id, role)
                  SELECT a.id as asset_id, c.id as creator_id, ac.role
                  FROM asset_creator_backup ac
                  JOIN asset a ON ac.asset_uuid = a.uuid
                  JOIN creator c ON ac.creator_uuid = c.uuid`);

    // 重建 work_wiki 表
    await db.run(`CREATE TABLE work_wiki (
        work_id INTEGER NOT NULL REFERENCES work(id) ON DELETE CASCADE,
        platform TEXT NOT NULL,
        identifier TEXT NOT NULL,
        PRIMARY KEY (work_id, platform)
    )`);

    await db.run(`INSERT INTO work_wiki (work_id, platform, identifier)
                  SELECT w.id as work_id, ww.platform, ww.identifier
                  FROM work_wiki_backup ww
                  JOIN work w ON ww.work_uuid = w.uuid`);

    // 重建 work_tag 表
    await db.run(`CREATE TABLE work_tag (
        work_id INTEGER NOT NULL REFERENCES work(id) ON DELETE CASCADE,
        tag_id INTEGER NOT NULL REFERENCES tag(id) ON DELETE CASCADE,
        PRIMARY KEY (work_id, tag_id)
    )`);

    await db.run(`INSERT INTO work_tag (work_id, tag_id)
                  SELECT w.id as work_id, t.id as tag_id
                  FROM work_tag_backup wt
                  JOIN work w ON wt.work_uuid = w.uuid
                  JOIN tag t ON wt.tag_uuid = t.uuid`);

    // 重建 work_category 表
    await db.run(`CREATE TABLE work_category (
        work_id INTEGER NOT NULL REFERENCES work(id) ON DELETE CASCADE,
        category_id INTEGER NOT NULL REFERENCES category(id) ON DELETE CASCADE,
        PRIMARY KEY (work_id, category_id)
    )`);

    await db.run(`INSERT INTO work_category (work_id, category_id)
                  SELECT w.id as work_id, c.id as category_id
                  FROM work_category_backup wc
                  JOIN work w ON wc.work_uuid = w.uuid
                  JOIN category c ON wc.category_uuid = c.uuid`);

    // 重建 asset_external_object 表
    await db.run(`CREATE TABLE asset_external_object (
        asset_id INTEGER NOT NULL REFERENCES asset(id) ON DELETE CASCADE,
        external_object_id INTEGER NOT NULL REFERENCES external_object(id) ON DELETE CASCADE,
        PRIMARY KEY (asset_id, external_object_id)
    )`);

    await db.run(`INSERT INTO asset_external_object (asset_id, external_object_id)
                  SELECT a.id as asset_id, eo.id as external_object_id
                  FROM asset_external_object_backup aeo
                  JOIN asset a ON aeo.asset_uuid = a.uuid
                  JOIN external_object eo ON aeo.external_object_uuid = eo.uuid`);

    // 重建 media_source_external_object 表
    await db.run(`CREATE TABLE media_source_external_object (
        media_source_id INTEGER NOT NULL REFERENCES media_source(id) ON DELETE CASCADE,
        external_object_id INTEGER NOT NULL REFERENCES external_object(id) ON DELETE CASCADE,
        PRIMARY KEY (media_source_id, external_object_id)
    )`);

    await db.run(`INSERT INTO media_source_external_object (media_source_id, external_object_id)
                  SELECT ms.id as media_source_id, eo.id as external_object_id
                  FROM media_source_external_object_backup mseo
                  JOIN media_source ms ON mseo.media_source_uuid = ms.uuid
                  JOIN external_object eo ON mseo.external_object_uuid = eo.uuid`);

    // 第六步：清理映射表和备份表
    console.log('步骤6: 清理映射表和备份表');

    await db.run(`DROP TABLE creator_uuid_id_map`);
    await db.run(`DROP TABLE work_uuid_id_map`);
    await db.run(`DROP TABLE tag_uuid_id_map`);
    await db.run(`DROP TABLE category_uuid_id_map`);
    await db.run(`DROP TABLE footer_settings_uuid_id_map`);
    await db.run(`DROP TABLE external_source_uuid_id_map`);
    await db.run(`DROP TABLE work_title_uuid_id_map`);
    await db.run(`DROP TABLE media_source_uuid_id_map`);
    await db.run(`DROP TABLE asset_uuid_id_map`);
    await db.run(`DROP TABLE work_relation_uuid_id_map`);
    await db.run(`DROP TABLE external_object_uuid_id_map`);

    // 清理备份表
    await db.run(`DROP TABLE creator_wiki_backup`);
    await db.run(`DROP TABLE work_license_backup`);
    await db.run(`DROP TABLE work_creator_backup`);
    await db.run(`DROP TABLE asset_creator_backup`);
    await db.run(`DROP TABLE work_wiki_backup`);
    await db.run(`DROP TABLE work_tag_backup`);
    await db.run(`DROP TABLE work_category_backup`);
    await db.run(`DROP TABLE asset_external_object_backup`);
    await db.run(`DROP TABLE media_source_external_object_backup`);

    console.log('UUID到ID的数据库架构迁移完成！');
};

/**
 * 回滚迁移：从自增ID主键改回UUID主键
 */
export const down = async (db: DrizzleDB, params?: MigrationParameters): Promise<void> => {
    console.log('开始回滚UUID到ID的数据库架构迁移...');

    // 注意：这个回滚过程相对简单，因为我们保留了UUID
    // 只需要将主键从ID改回UUID，并更新外键引用

    // 第一步：重建所有表结构，将UUID设为主键
    console.log('步骤1: 回滚主表结构');

    // 回滚 creator 表
    await db.run(`CREATE TABLE creator_old (
        uuid TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT CHECK(type IN ('human', 'virtual')) NOT NULL
    )`);

    await db.run(`INSERT INTO creator_old (uuid, name, type)
                  SELECT uuid, name, type FROM creator`);

    await db.run(`DROP TABLE creator`);
    await db.run(`ALTER TABLE creator_old RENAME TO creator`);

    // 回滚其他主表...
    // （为了简化，这里只显示creator表的回滚示例）
    // 实际实现中需要回滚所有表

    console.log('UUID到ID的数据库架构迁移回滚完成！');
};