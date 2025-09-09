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
    copyrightBasis: text('copyright_basis', { 
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
    parentUuid: text('parent_uuid'),
});

export const footerSettings = sqliteTable('footer_settings', {
    uuid: text('uuid').primaryKey(),
    itemType: text('item_type', { 
        enum: ['link', 'social', 'copyright'] 
    }).notNull(),
    text: text('text').notNull(),
    url: text('url'),
    iconClass: text('icon_class'),
});

// Dependent tables (with foreign key relationships)

export const creatorWiki = sqliteTable('creator_wiki', {
    creatorUuid: text('creator_uuid').notNull().references(() => creator.uuid, { 
        onDelete: 'cascade' 
    }),
    platform: text('platform').notNull(),
    identifier: text('identifier').notNull(),
}, (table) => ({
    pk: primaryKey({ columns: [table.creatorUuid, table.platform] }),
}));

export const workTitle = sqliteTable('work_title', {
    uuid: text('uuid').primaryKey(),
    workUuid: text('work_uuid').notNull().references(() => work.uuid, { 
        onDelete: 'cascade' 
    }),
    isOfficial: integer('is_official', { mode: 'boolean' }).notNull(),
    language: text('language').notNull(),
    title: text('title').notNull(),
});

export const workLicense = sqliteTable('work_license', {
    workUuid: text('work_uuid').primaryKey().references(() => work.uuid, { 
        onDelete: 'cascade' 
    }),
    licenseType: text('license_type').notNull(),
});

export const mediaSource = sqliteTable('media_source', {
    uuid: text('uuid').primaryKey(),
    workUuid: text('work_uuid').notNull().references(() => work.uuid, { 
        onDelete: 'cascade' 
    }),
    isMusic: integer('is_music', { mode: 'boolean' }).notNull(),
    fileName: text('file_name').notNull(),
    url: text('url').notNull(),
    mimeType: text('mime_type').notNull(),
    info: text('info').notNull(),
});

export const asset = sqliteTable('asset', {
    uuid: text('uuid').primaryKey(),
    fileId: text('file_id').notNull(),
    workUuid: text('work_uuid').notNull().references(() => work.uuid, { 
        onDelete: 'cascade' 
    }),
    assetType: text('asset_type', { 
        enum: ['lyrics', 'picture'] 
    }).notNull(),
    fileName: text('file_name').notNull(),
    isPreviewpic: integer('is_previewpic', { mode: 'boolean' }),
    language: text('language'),
});

export const workCreator = sqliteTable('work_creator', {
    workUuid: text('work_uuid').notNull().references(() => work.uuid, { 
        onDelete: 'cascade' 
    }),
    creatorUuid: text('creator_uuid').notNull().references(() => creator.uuid, { 
        onDelete: 'cascade' 
    }),
    role: text('role').notNull(),
}, (table) => ({
    pk: primaryKey({ columns: [table.workUuid, table.creatorUuid, table.role] }),
}));

export const assetCreator = sqliteTable('asset_creator', {
    assetUuid: text('asset_uuid').notNull().references(() => asset.uuid, { 
        onDelete: 'cascade' 
    }),
    creatorUuid: text('creator_uuid').notNull().references(() => creator.uuid),
    role: text('role').notNull(),
}, (table) => ({
    pk: primaryKey({ columns: [table.assetUuid, table.creatorUuid] }),
}));

export const workRelation = sqliteTable('work_relation', {
    uuid: text('uuid').primaryKey(),
    fromWorkUuid: text('from_work_uuid').notNull().references(() => work.uuid, { 
        onDelete: 'cascade' 
    }),
    toWorkUuid: text('to_work_uuid').notNull().references(() => work.uuid, { 
        onDelete: 'cascade' 
    }),
    relationType: text('relation_type', { 
        enum: ['original', 'remix', 'cover', 'remake', 'picture', 'lyrics'] 
    }).notNull(),
});

export const workWiki = sqliteTable('work_wiki', {
    workUuid: text('work_uuid').notNull().references(() => work.uuid, { 
        onDelete: 'cascade' 
    }),
    platform: text('platform').notNull(),
    identifier: text('identifier').notNull(),
}, (table) => ({
    pk: primaryKey({ columns: [table.workUuid, table.platform] }),
}));

export const workTag = sqliteTable('work_tag', {
    workUuid: text('work_uuid').notNull().references(() => work.uuid, { 
        onDelete: 'cascade' 
    }),
    tagUuid: text('tag_uuid').notNull().references(() => tag.uuid, { 
        onDelete: 'cascade' 
    }),
}, (table) => ({
    pk: primaryKey({ columns: [table.workUuid, table.tagUuid] }),
}));

export const workCategory = sqliteTable('work_category', {
    workUuid: text('work_uuid').notNull().references(() => work.uuid, { 
        onDelete: 'cascade' 
    }),
    categoryUuid: text('category_uuid').notNull().references(() => category.uuid, { 
        onDelete: 'cascade' 
    }),
}, (table) => ({
    pk: primaryKey({ columns: [table.workUuid, table.categoryUuid] }),
}));

// Relations

export const creatorRelations = relations(creator, ({ many }) => ({
    wikis: many(creatorWiki),
    workCreators: many(workCreator),
    assetCreators: many(assetCreator),
}));

export const creatorWikiRelations = relations(creatorWiki, ({ one }) => ({
    creator: one(creator, {
        fields: [creatorWiki.creatorUuid],
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
        fields: [workTitle.workUuid],
        references: [work.uuid],
    }),
}));

export const workLicenseRelations = relations(workLicense, ({ one }) => ({
    work: one(work, {
        fields: [workLicense.workUuid],
        references: [work.uuid],
    }),
}));

export const mediaSourceRelations = relations(mediaSource, ({ one }) => ({
    work: one(work, {
        fields: [mediaSource.workUuid],
        references: [work.uuid],
    }),
}));

export const assetRelations = relations(asset, ({ one, many }) => ({
    work: one(work, {
        fields: [asset.workUuid],
        references: [work.uuid],
    }),
    assetCreators: many(assetCreator),
}));

export const workCreatorRelations = relations(workCreator, ({ one }) => ({
    work: one(work, {
        fields: [workCreator.workUuid],
        references: [work.uuid],
    }),
    creator: one(creator, {
        fields: [workCreator.creatorUuid],
        references: [creator.uuid],
    }),
}));

export const assetCreatorRelations = relations(assetCreator, ({ one }) => ({
    asset: one(asset, {
        fields: [assetCreator.assetUuid],
        references: [asset.uuid],
    }),
    creator: one(creator, {
        fields: [assetCreator.creatorUuid],
        references: [creator.uuid],
    }),
}));

export const workRelationRelations = relations(workRelation, ({ one }) => ({
    fromWork: one(work, {
        fields: [workRelation.fromWorkUuid],
        references: [work.uuid],
        relationName: 'fromWork',
    }),
    toWork: one(work, {
        fields: [workRelation.toWorkUuid],
        references: [work.uuid],
        relationName: 'toWork',
    }),
}));

export const workWikiRelations = relations(workWiki, ({ one }) => ({
    work: one(work, {
        fields: [workWiki.workUuid],
        references: [work.uuid],
    }),
}));

export const tagRelations = relations(tag, ({ many }) => ({
    workTags: many(workTag),
}));

export const workTagRelations = relations(workTag, ({ one }) => ({
    work: one(work, {
        fields: [workTag.workUuid],
        references: [work.uuid],
    }),
    tag: one(tag, {
        fields: [workTag.tagUuid],
        references: [tag.uuid],
    }),
}));

export const categoryRelations = relations(category, ({ one, many }) => ({
    parent: one(category, {
        fields: [category.parentUuid],
        references: [category.uuid],
        relationName: 'parentCategory',
    }),
    children: many(category, { relationName: 'parentCategory' }),
    workCategories: many(workCategory),
}));

export const workCategoryRelations = relations(workCategory, ({ one }) => ({
    work: one(work, {
        fields: [workCategory.workUuid],
        references: [work.uuid],
    }),
    category: one(category, {
        fields: [workCategory.categoryUuid],
        references: [category.uuid],
    }),
}));