import { sqliteTable, text, integer, primaryKey, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

// Core tables (no foreign key dependencies)

export const creator = sqliteTable('creator', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    uuid: text('uuid').notNull().unique(),
    name: text('name').notNull(),
    type: text('type', { enum: ['human', 'virtual'] }).notNull(),
});

export const work = sqliteTable('work', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    uuid: text('uuid').notNull().unique(),
    copyright_basis: text('copyright_basis', {
        enum: ['none', 'accept', 'license', 'onlymetadata', 'arr']
    }).notNull(),
});

export const tag = sqliteTable('tag', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    uuid: text('uuid').notNull().unique(),
    name: text('name').notNull().unique(),
});

export const category = sqliteTable('category', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    uuid: text('uuid').notNull().unique(),
    name: text('name').notNull().unique(),
    parent_id: integer('parent_id').references((): any => category.id, { onDelete: 'cascade' }),
});

export const footerSettings = sqliteTable('footer_settings', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    uuid: text('uuid').notNull().unique(),
    item_type: text('item_type', {
        enum: ['link', 'social', 'copyright']
    }).notNull(),
    text: text('text').notNull(),
    url: text('url'),
    icon_class: text('icon_class'),
});

export const externalSource = sqliteTable('external_source', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    uuid: text('uuid').notNull().unique(),
    type: text('type', { enum: ['raw_url', 'ipfs'] }).notNull(),
    name: text('name').notNull(),
    endpoint: text('endpoint').notNull(),
});

export const siteConfig = sqliteTable('site_config', {
    key: text('key').primaryKey(),
    value: text('value').notNull(),
    description: text('description'),
});

export const wikiPlatform = sqliteTable('wiki_platform', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    uuid: text('uuid').notNull().unique(),
    platform_key: text('platform_key').notNull().unique(),
    platform_name: text('platform_name').notNull(),
    url_template: text('url_template').notNull(),
    icon_class: text('icon_class'),
});

// Dependent tables (with foreign key relationships)

export const creatorWiki = sqliteTable('creator_wiki', {
    creator_id: integer('creator_id').notNull().references(() => creator.id, {
        onDelete: 'cascade'
    }),
    platform: text('platform').notNull(),
    identifier: text('identifier').notNull(),
}, (table) => ({
    pk: primaryKey({ columns: [table.creator_id, table.platform] }),
}));

export const workTitle = sqliteTable('work_title', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    uuid: text('uuid').notNull().unique(),
    work_id: integer('work_id').notNull().references(() => work.id, {
        onDelete: 'cascade'
    }),
    is_official: integer('is_official', { mode: 'boolean' }).notNull(),
    is_for_search: integer('is_for_search', { mode: 'boolean' }).notNull().default(false),
    language: text('language').notNull(),
    title: text('title').notNull(),
});

export const workLicense = sqliteTable('work_license', {
    work_id: integer('work_id').primaryKey().references(() => work.id, {
        onDelete: 'cascade'
    }),
    license_type: text('license_type').notNull(),
});

export const mediaSource = sqliteTable('media_source', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    uuid: text('uuid').notNull().unique(),
    work_id: integer('work_id').notNull().references(() => work.id, {
        onDelete: 'cascade'
    }),
    is_music: integer('is_music', { mode: 'boolean' }).notNull(),
    file_name: text('file_name').notNull(),
    url: text('url'), // Made nullable - now redundant with external_object
    mime_type: text('mime_type').notNull(),
    info: text('info').notNull(),
});

export const asset = sqliteTable('asset', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    uuid: text('uuid').notNull().unique(),
    file_id: text('file_id'), // Made nullable - now redundant with external_object
    work_id: integer('work_id').notNull().references(() => work.id, {
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
    work_id: integer('work_id').notNull().references(() => work.id, {
        onDelete: 'cascade'
    }),
    creator_id: integer('creator_id').notNull().references(() => creator.id, {
        onDelete: 'cascade'
    }),
    role: text('role').notNull(),
}, (table) => ({
    pk: primaryKey({ columns: [table.work_id, table.creator_id, table.role] }),
}));

export const assetCreator = sqliteTable('asset_creator', {
    asset_id: integer('asset_id').notNull().references(() => asset.id, {
        onDelete: 'cascade'
    }),
    creator_id: integer('creator_id').notNull().references(() => creator.id),
    role: text('role').notNull(),
}, (table) => ({
    pk: primaryKey({ columns: [table.asset_id, table.creator_id] }),
}));

export const workRelation = sqliteTable('work_relation', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    uuid: text('uuid').notNull().unique(),
    from_work_id: integer('from_work_id').notNull().references(() => work.id, {
        onDelete: 'cascade'
    }),
    to_work_id: integer('to_work_id').notNull().references(() => work.id, {
        onDelete: 'cascade'
    }),
    relation_type: text('relation_type', {
        enum: ['original', 'remix', 'cover', 'remake', 'picture', 'lyrics']
    }).notNull(),
});

export const workWiki = sqliteTable('work_wiki', {
    work_id: integer('work_id').notNull().references(() => work.id, {
        onDelete: 'cascade'
    }),
    platform: text('platform').notNull(),
    identifier: text('identifier').notNull(),
}, (table) => ({
    pk: primaryKey({ columns: [table.work_id, table.platform] }),
}));

export const workTag = sqliteTable('work_tag', {
    work_id: integer('work_id').notNull().references(() => work.id, {
        onDelete: 'cascade'
    }),
    tag_id: integer('tag_id').notNull().references(() => tag.id, {
        onDelete: 'cascade'
    }),
}, (table) => ({
    pk: primaryKey({ columns: [table.work_id, table.tag_id] }),
}));

export const workCategory = sqliteTable('work_category', {
    work_id: integer('work_id').notNull().references(() => work.id, {
        onDelete: 'cascade'
    }),
    category_id: integer('category_id').notNull().references(() => category.id, {
        onDelete: 'cascade'
    }),
}, (table) => ({
    pk: primaryKey({ columns: [table.work_id, table.category_id] }),
}));

export const externalObject = sqliteTable('external_object', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    uuid: text('uuid').notNull().unique(),
    external_source_id: integer('external_source_id').notNull().references(() => externalSource.id, {
        onDelete: 'cascade'
    }),
    mime_type: text('mime_type').notNull(),
    file_id: text('file_id').notNull(),
});

// Junction tables for many-to-many relationships

export const assetExternalObject = sqliteTable('asset_external_object', {
    asset_id: integer('asset_id').notNull().references(() => asset.id, {
        onDelete: 'cascade'
    }),
    external_object_id: integer('external_object_id').notNull().references(() => externalObject.id, {
        onDelete: 'cascade'
    }),
}, (table) => ({
    pk: primaryKey({ columns: [table.asset_id, table.external_object_id] }),
}));

export const mediaSourceExternalObject = sqliteTable('media_source_external_object', {
    media_source_id: integer('media_source_id').notNull().references(() => mediaSource.id, {
        onDelete: 'cascade'
    }),
    external_object_id: integer('external_object_id').notNull().references(() => externalObject.id, {
        onDelete: 'cascade'
    }),
}, (table) => ({
    pk: primaryKey({ columns: [table.media_source_id, table.external_object_id] }),
}));

// Relations

export const creatorRelations = relations(creator, ({ many }) => ({
    wikis: many(creatorWiki),
    workCreators: many(workCreator),
    assetCreators: many(assetCreator),
}));

export const creatorWikiRelations = relations(creatorWiki, ({ one }) => ({
    creator: one(creator, {
        fields: [creatorWiki.creator_id],
        references: [creator.id],
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
        fields: [workTitle.work_id],
        references: [work.id],
    }),
}));

export const workLicenseRelations = relations(workLicense, ({ one }) => ({
    work: one(work, {
        fields: [workLicense.work_id],
        references: [work.id],
    }),
}));

export const mediaSourceRelations = relations(mediaSource, ({ one, many }) => ({
    work: one(work, {
        fields: [mediaSource.work_id],
        references: [work.id],
    }),
    mediaSourceExternalObjects: many(mediaSourceExternalObject),
}));

export const assetRelations = relations(asset, ({ one, many }) => ({
    work: one(work, {
        fields: [asset.work_id],
        references: [work.id],
    }),
    assetCreators: many(assetCreator),
    assetExternalObjects: many(assetExternalObject),
}));

export const workCreatorRelations = relations(workCreator, ({ one }) => ({
    work: one(work, {
        fields: [workCreator.work_id],
        references: [work.id],
    }),
    creator: one(creator, {
        fields: [workCreator.creator_id],
        references: [creator.id],
    }),
}));

export const assetCreatorRelations = relations(assetCreator, ({ one }) => ({
    asset: one(asset, {
        fields: [assetCreator.asset_id],
        references: [asset.id],
    }),
    creator: one(creator, {
        fields: [assetCreator.creator_id],
        references: [creator.id],
    }),
}));

export const workRelationRelations = relations(workRelation, ({ one }) => ({
    fromWork: one(work, {
        fields: [workRelation.from_work_id],
        references: [work.id],
        relationName: 'fromWork',
    }),
    toWork: one(work, {
        fields: [workRelation.to_work_id],
        references: [work.id],
        relationName: 'toWork',
    }),
}));

export const workWikiRelations = relations(workWiki, ({ one }) => ({
    work: one(work, {
        fields: [workWiki.work_id],
        references: [work.id],
    }),
}));

export const tagRelations = relations(tag, ({ many }) => ({
    workTags: many(workTag),
}));

export const workTagRelations = relations(workTag, ({ one }) => ({
    work: one(work, {
        fields: [workTag.work_id],
        references: [work.id],
    }),
    tag: one(tag, {
        fields: [workTag.tag_id],
        references: [tag.id],
    }),
}));

export const categoryRelations = relations(category, ({ one, many }) => ({
    parent: one(category, {
        fields: [category.parent_id],
        references: [category.id],
        relationName: 'parentCategory',
    }),
    children: many(category, { relationName: 'parentCategory' }),
    workCategories: many(workCategory),
}));

export const workCategoryRelations = relations(workCategory, ({ one }) => ({
    work: one(work, {
        fields: [workCategory.work_id],
        references: [work.id],
    }),
    category: one(category, {
        fields: [workCategory.category_id],
        references: [category.id],
    }),
}));

export const externalSourceRelations = relations(externalSource, ({ many }) => ({
    externalObjects: many(externalObject),
}));

export const externalObjectRelations = relations(externalObject, ({ one, many }) => ({
    externalSource: one(externalSource, {
        fields: [externalObject.external_source_id],
        references: [externalSource.id],
    }),
    assetExternalObjects: many(assetExternalObject),
    mediaSourceExternalObjects: many(mediaSourceExternalObject),
}));

export const assetExternalObjectRelations = relations(assetExternalObject, ({ one }) => ({
    asset: one(asset, {
        fields: [assetExternalObject.asset_id],
        references: [asset.id],
    }),
    externalObject: one(externalObject, {
        fields: [assetExternalObject.external_object_id],
        references: [externalObject.id],
    }),
}));

export const mediaSourceExternalObjectRelations = relations(mediaSourceExternalObject, ({ one }) => ({
    mediaSource: one(mediaSource, {
        fields: [mediaSourceExternalObject.media_source_id],
        references: [mediaSource.id],
    }),
    externalObject: one(externalObject, {
        fields: [mediaSourceExternalObject.external_object_id],
        references: [externalObject.id],
    }),
}));

export const wikiPlatformRelations = relations(wikiPlatform, ({ }) => ({
    // Currently no direct relations, but this establishes the relation structure
}));