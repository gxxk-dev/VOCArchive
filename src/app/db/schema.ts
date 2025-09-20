import { sqliteTable, text, integer, primaryKey } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

// Core tables (no foreign key dependencies)

export const creator = sqliteTable('creator', {
    uuid: text('uuid').primaryKey(),
    name: text('name').notNull(),
    type: text('type', { enum: ['human', 'virtual'] }).notNull(),
});

export const work = sqliteTable('work', {
    uuid: text('uuid').primaryKey(),
    copyright_basis: text('copyright_basis', { 
        enum: ['none', 'accept', 'license'] 
    }).notNull(),
});

export const tag = sqliteTable('tag', {
    uuid: text('uuid').primaryKey(),
    name: text('name').notNull().unique(),
});

export const category = sqliteTable('category', {
    uuid: text('uuid').primaryKey(),
    name: text('name').notNull().unique(),
    parent_uuid: text('parent_uuid'),
});

export const footerSettings = sqliteTable('footer_settings', {
    uuid: text('uuid').primaryKey(),
    item_type: text('item_type', { 
        enum: ['link', 'social', 'copyright'] 
    }).notNull(),
    text: text('text').notNull(),
    url: text('url'),
    icon_class: text('icon_class'),
});

export const externalSource = sqliteTable('external_source', {
    uuid: text('uuid').primaryKey(),
    type: text('type', { enum: ['raw_url', 'ipfs'] }).notNull(),
    name: text('name').notNull(),
    endpoint: text('endpoint').notNull(),
});

export const siteConfig = sqliteTable('site_config', {
    key: text('key').primaryKey(),
    value: text('value').notNull(),
    description: text('description'),
});

// Dependent tables (with foreign key relationships)

export const creatorWiki = sqliteTable('creator_wiki', {
    creator_uuid: text('creator_uuid').notNull().references(() => creator.uuid, { 
        onDelete: 'cascade' 
    }),
    platform: text('platform').notNull(),
    identifier: text('identifier').notNull(),
}, (table) => ({
    pk: primaryKey({ columns: [table.creator_uuid, table.platform] }),
}));

export const workTitle = sqliteTable('work_title', {
    uuid: text('uuid').primaryKey(),
    work_uuid: text('work_uuid').notNull().references(() => work.uuid, { 
        onDelete: 'cascade' 
    }),
    is_official: integer('is_official', { mode: 'boolean' }).notNull(),
    is_for_search: integer('is_for_search', { mode: 'boolean' }).notNull().default(false),
    language: text('language').notNull(),
    title: text('title').notNull(),
});

export const workLicense = sqliteTable('work_license', {
    work_uuid: text('work_uuid').primaryKey().references(() => work.uuid, { 
        onDelete: 'cascade' 
    }),
    license_type: text('license_type').notNull(),
});

export const mediaSource = sqliteTable('media_source', {
    uuid: text('uuid').primaryKey(),
    work_uuid: text('work_uuid').notNull().references(() => work.uuid, { 
        onDelete: 'cascade' 
    }),
    is_music: integer('is_music', { mode: 'boolean' }).notNull(),
    file_name: text('file_name').notNull(),
    url: text('url'), // Made nullable - now redundant with external_object
    mime_type: text('mime_type').notNull(),
    info: text('info').notNull(),
});

export const asset = sqliteTable('asset', {
    uuid: text('uuid').primaryKey(),
    file_id: text('file_id'), // Made nullable - now redundant with external_object
    work_uuid: text('work_uuid').notNull().references(() => work.uuid, { 
        onDelete: 'cascade' 
    }),
    asset_type: text('asset_type', { 
        enum: ['lyrics', 'picture'] 
    }).notNull(),
    file_name: text('file_name').notNull(),
    is_previewpic: integer('is_previewpic', { mode: 'boolean' }),
    language: text('language'),
});

export const workCreator = sqliteTable('work_creator', {
    work_uuid: text('work_uuid').notNull().references(() => work.uuid, { 
        onDelete: 'cascade' 
    }),
    creator_uuid: text('creator_uuid').notNull().references(() => creator.uuid, { 
        onDelete: 'cascade' 
    }),
    role: text('role').notNull(),
}, (table) => ({
    pk: primaryKey({ columns: [table.work_uuid, table.creator_uuid, table.role] }),
}));

export const assetCreator = sqliteTable('asset_creator', {
    asset_uuid: text('asset_uuid').notNull().references(() => asset.uuid, { 
        onDelete: 'cascade' 
    }),
    creator_uuid: text('creator_uuid').notNull().references(() => creator.uuid),
    role: text('role').notNull(),
}, (table) => ({
    pk: primaryKey({ columns: [table.asset_uuid, table.creator_uuid] }),
}));

export const workRelation = sqliteTable('work_relation', {
    uuid: text('uuid').primaryKey(),
    from_work_uuid: text('from_work_uuid').notNull().references(() => work.uuid, { 
        onDelete: 'cascade' 
    }),
    to_work_uuid: text('to_work_uuid').notNull().references(() => work.uuid, { 
        onDelete: 'cascade' 
    }),
    relation_type: text('relation_type', { 
        enum: ['original', 'remix', 'cover', 'remake', 'picture', 'lyrics'] 
    }).notNull(),
});

export const workWiki = sqliteTable('work_wiki', {
    work_uuid: text('work_uuid').notNull().references(() => work.uuid, { 
        onDelete: 'cascade' 
    }),
    platform: text('platform').notNull(),
    identifier: text('identifier').notNull(),
}, (table) => ({
    pk: primaryKey({ columns: [table.work_uuid, table.platform] }),
}));

export const workTag = sqliteTable('work_tag', {
    work_uuid: text('work_uuid').notNull().references(() => work.uuid, { 
        onDelete: 'cascade' 
    }),
    tag_uuid: text('tag_uuid').notNull().references(() => tag.uuid, { 
        onDelete: 'cascade' 
    }),
}, (table) => ({
    pk: primaryKey({ columns: [table.work_uuid, table.tag_uuid] }),
}));

export const workCategory = sqliteTable('work_category', {
    work_uuid: text('work_uuid').notNull().references(() => work.uuid, { 
        onDelete: 'cascade' 
    }),
    category_uuid: text('category_uuid').notNull().references(() => category.uuid, { 
        onDelete: 'cascade' 
    }),
}, (table) => ({
    pk: primaryKey({ columns: [table.work_uuid, table.category_uuid] }),
}));

export const externalObject = sqliteTable('external_object', {
    uuid: text('uuid').primaryKey(),
    external_source_uuid: text('external_source_uuid').notNull().references(() => externalSource.uuid, { 
        onDelete: 'cascade' 
    }),
    mime_type: text('mime_type').notNull(),
    file_id: text('file_id').notNull(),
});

// Junction tables for many-to-many relationships

export const assetExternalObject = sqliteTable('asset_external_object', {
    asset_uuid: text('asset_uuid').notNull().references(() => asset.uuid, { 
        onDelete: 'cascade' 
    }),
    external_object_uuid: text('external_object_uuid').notNull().references(() => externalObject.uuid, { 
        onDelete: 'cascade' 
    }),
}, (table) => ({
    pk: primaryKey({ columns: [table.asset_uuid, table.external_object_uuid] }),
}));

export const mediaSourceExternalObject = sqliteTable('media_source_external_object', {
    media_source_uuid: text('media_source_uuid').notNull().references(() => mediaSource.uuid, { 
        onDelete: 'cascade' 
    }),
    external_object_uuid: text('external_object_uuid').notNull().references(() => externalObject.uuid, { 
        onDelete: 'cascade' 
    }),
}, (table) => ({
    pk: primaryKey({ columns: [table.media_source_uuid, table.external_object_uuid] }),
}));

// Relations

export const creatorRelations = relations(creator, ({ many }) => ({
    wikis: many(creatorWiki),
    workCreators: many(workCreator),
    assetCreators: many(assetCreator),
}));

export const creatorWikiRelations = relations(creatorWiki, ({ one }) => ({
    creator: one(creator, {
        fields: [creatorWiki.creator_uuid],
        references: [creator.uuid],
    }),
}));

export const workRelations = relations(work, ({ many }) => ({
    titles: many(workTitle),
    license: many(workLicense),
    mediaSources: many(mediaSource),
    assets: many(asset),
    workCreators: many(workCreator),
    fromRelations: many(workRelation, { relationName: 'fromWork' }),
    toRelations: many(workRelation, { relationName: 'toWork' }),
    wikis: many(workWiki),
    workTags: many(workTag),
    workCategories: many(workCategory),
}));

export const workTitleRelations = relations(workTitle, ({ one }) => ({
    work: one(work, {
        fields: [workTitle.work_uuid],
        references: [work.uuid],
    }),
}));

export const workLicenseRelations = relations(workLicense, ({ one }) => ({
    work: one(work, {
        fields: [workLicense.work_uuid],
        references: [work.uuid],
    }),
}));

export const mediaSourceRelations = relations(mediaSource, ({ one, many }) => ({
    work: one(work, {
        fields: [mediaSource.work_uuid],
        references: [work.uuid],
    }),
    mediaSourceExternalObjects: many(mediaSourceExternalObject),
}));

export const assetRelations = relations(asset, ({ one, many }) => ({
    work: one(work, {
        fields: [asset.work_uuid],
        references: [work.uuid],
    }),
    assetCreators: many(assetCreator),
    assetExternalObjects: many(assetExternalObject),
}));

export const workCreatorRelations = relations(workCreator, ({ one }) => ({
    work: one(work, {
        fields: [workCreator.work_uuid],
        references: [work.uuid],
    }),
    creator: one(creator, {
        fields: [workCreator.creator_uuid],
        references: [creator.uuid],
    }),
}));

export const assetCreatorRelations = relations(assetCreator, ({ one }) => ({
    asset: one(asset, {
        fields: [assetCreator.asset_uuid],
        references: [asset.uuid],
    }),
    creator: one(creator, {
        fields: [assetCreator.creator_uuid],
        references: [creator.uuid],
    }),
}));

export const workRelationRelations = relations(workRelation, ({ one }) => ({
    fromWork: one(work, {
        fields: [workRelation.from_work_uuid],
        references: [work.uuid],
        relationName: 'fromWork',
    }),
    toWork: one(work, {
        fields: [workRelation.to_work_uuid],
        references: [work.uuid],
        relationName: 'toWork',
    }),
}));

export const workWikiRelations = relations(workWiki, ({ one }) => ({
    work: one(work, {
        fields: [workWiki.work_uuid],
        references: [work.uuid],
    }),
}));

export const tagRelations = relations(tag, ({ many }) => ({
    workTags: many(workTag),
}));

export const workTagRelations = relations(workTag, ({ one }) => ({
    work: one(work, {
        fields: [workTag.work_uuid],
        references: [work.uuid],
    }),
    tag: one(tag, {
        fields: [workTag.tag_uuid],
        references: [tag.uuid],
    }),
}));

export const categoryRelations = relations(category, ({ one, many }) => ({
    parent: one(category, {
        fields: [category.parent_uuid],
        references: [category.uuid],
        relationName: 'parentCategory',
    }),
    children: many(category, { relationName: 'parentCategory' }),
    workCategories: many(workCategory),
}));

export const workCategoryRelations = relations(workCategory, ({ one }) => ({
    work: one(work, {
        fields: [workCategory.work_uuid],
        references: [work.uuid],
    }),
    category: one(category, {
        fields: [workCategory.category_uuid],
        references: [category.uuid],
    }),
}));

export const externalSourceRelations = relations(externalSource, ({ many }) => ({
    externalObjects: many(externalObject),
}));

export const externalObjectRelations = relations(externalObject, ({ one, many }) => ({
    externalSource: one(externalSource, {
        fields: [externalObject.external_source_uuid],
        references: [externalSource.uuid],
    }),
    assetExternalObjects: many(assetExternalObject),
    mediaSourceExternalObjects: many(mediaSourceExternalObject),
}));

export const assetExternalObjectRelations = relations(assetExternalObject, ({ one }) => ({
    asset: one(asset, {
        fields: [assetExternalObject.asset_uuid],
        references: [asset.uuid],
    }),
    externalObject: one(externalObject, {
        fields: [assetExternalObject.external_object_uuid],
        references: [externalObject.uuid],
    }),
}));

export const mediaSourceExternalObjectRelations = relations(mediaSourceExternalObject, ({ one }) => ({
    mediaSource: one(mediaSource, {
        fields: [mediaSourceExternalObject.media_source_uuid],
        references: [mediaSource.uuid],
    }),
    externalObject: one(externalObject, {
        fields: [mediaSourceExternalObject.external_object_uuid],
        references: [externalObject.uuid],
    }),
}));