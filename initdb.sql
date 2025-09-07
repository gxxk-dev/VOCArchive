PRAGMA defer_foreign_keys=TRUE;
CREATE TABLE creator ( uuid TEXT PRIMARY KEY, name TEXT NOT NULL, type TEXT CHECK(type IN ('human', 'virtual')) NOT NULL );
CREATE TABLE creator_wiki ( creator_uuid TEXT NOT NULL REFERENCES creator(uuid) ON DELETE CASCADE, platform TEXT NOT NULL, identifier TEXT NOT NULL, PRIMARY KEY (creator_uuid, platform) );
CREATE TABLE work ( uuid TEXT PRIMARY KEY, copyright_basis TEXT NOT NULL CHECK(copyright_basis IN ('none', 'accept', 'license')) );
CREATE TABLE work_title ( work_uuid TEXT NOT NULL REFERENCES work(uuid) ON DELETE CASCADE, is_official BOOLEAN NOT NULL, language TEXT NOT NULL, title TEXT NOT NULL, PRIMARY KEY (work_uuid, language) );
CREATE TABLE work_license ( work_uuid TEXT PRIMARY KEY REFERENCES work(uuid) ON DELETE CASCADE, license_type TEXT NOT NULL );
CREATE TABLE media_source ( uuid TEXT PRIMARY KEY, work_uuid TEXT NOT NULL REFERENCES work(uuid) ON DELETE CASCADE, is_music BOOLEAN NOT NULL, file_name TEXT NOT NULL, url TEXT NOT NULL, mime_type TEXT NOT NULL, info TEXT NOT NULL );;
CREATE TABLE asset ( uuid TEXT PRIMARY KEY, file_id TEXT NOT NULL, work_uuid TEXT NOT NULL REFERENCES work(uuid) ON DELETE CASCADE, asset_type TEXT CHECK(asset_type IN ('lyrics', 'picture')) NOT NULL, file_name TEXT NOT NULL, is_previewpic BOOLEAN, language TEXT );
CREATE TABLE asset_creator ( asset_uuid TEXT NOT NULL REFERENCES asset(uuid) ON DELETE CASCADE, creator_uuid TEXT NOT NULL REFERENCES creator(uuid), role TEXT NOT NULL, PRIMARY KEY (asset_uuid, creator_uuid) );
CREATE TABLE work_relation ( uuid TEXT PRIMARY KEY, from_work_uuid TEXT NOT NULL REFERENCES work(uuid) ON DELETE CASCADE, to_work_uuid TEXT NOT NULL REFERENCES work(uuid) ON DELETE CASCADE, relation_type TEXT NOT NULL CHECK(relation_type IN ( 'original', 'remix', 'cover', 'remake', 'picture', 'lyrics' )) );
CREATE TABLE work_wiki ( work_uuid TEXT NOT NULL REFERENCES work(uuid) ON DELETE CASCADE, platform TEXT NOT NULL, identifier TEXT NOT NULL, PRIMARY KEY (work_uuid, platform) );
CREATE TABLE work_creator ( work_uuid TEXT NOT NULL REFERENCES work(uuid) ON DELETE CASCADE, creator_uuid TEXT NOT NULL REFERENCES creator(uuid) ON DELETE CASCADE, role TEXT NOT NULL, PRIMARY KEY (work_uuid, creator_uuid, role) );

CREATE TABLE tag ( uuid TEXT PRIMARY KEY, name TEXT NOT NULL UNIQUE );
CREATE TABLE category ( uuid TEXT PRIMARY KEY, name TEXT NOT NULL UNIQUE, parent_uuid TEXT REFERENCES category(uuid) ON DELETE CASCADE );
CREATE TABLE work_tag ( work_uuid TEXT NOT NULL REFERENCES work(uuid) ON DELETE CASCADE, tag_uuid TEXT NOT NULL REFERENCES tag(uuid) ON DELETE CASCADE, PRIMARY KEY (work_uuid, tag_uuid) );
CREATE TABLE work_category ( work_uuid TEXT NOT NULL REFERENCES work(uuid) ON DELETE CASCADE, category_uuid TEXT NOT NULL REFERENCES category(uuid) ON DELETE CASCADE, PRIMARY KEY (work_uuid, category_uuid) );

CREATE TABLE footer_settings ( uuid TEXT PRIMARY KEY, item_type TEXT NOT NULL CHECK(item_type IN ('link', 'social', 'copyright')), text TEXT NOT NULL, url TEXT, icon_class TEXT );
