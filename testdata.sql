PRAGMA defer_foreign_keys=TRUE;
CREATE TABLE creator ( uuid TEXT PRIMARY KEY, name TEXT NOT NULL, type TEXT CHECK(type IN ('human', 'virtual')) NOT NULL);
INSERT INTO "creator" VALUES('5af67a71-f138-4608-ad73-f5607631dd2b','FLAVOR FOLEY','human');
INSERT INTO "creator" VALUES('597ecbdb-d31f-4c48-8907-1ab1438ddee5','USAO','human');
INSERT INTO "creator" VALUES('3814a5ad-974b-457d-bd4c-7ee194f7eaae','Camellia','human');
INSERT INTO "creator" VALUES('4da58d31-9aa2-4969-8404-ae589240e691','重音テト','virtual');
INSERT INTO "creator" VALUES('89e3e350-2485-4959-be51-e4693bfdfbc5','初音ミク','virtual');
INSERT INTO "creator" VALUES('76086fab-05aa-45c0-bbb0-6a710d6da15d','よこしま','human');
INSERT INTO "creator" VALUES('67124873-3411-4771-bc85-e24b5b8cb71f','ZUN','human');
INSERT INTO "creator" VALUES('aabbd320-cbef-4dac-bf9b-cc7c8e79b634','LeaF','human');
INSERT INTO "creator" VALUES('dc45304b-cb07-4de4-bb7c-9648c381ed7a','Kobaryo','human');
INSERT INTO "creator" VALUES('41eb7722-f7ca-4dd1-9f91-0721b4e1cba3','REDALiCE','human');
CREATE TABLE creator_wiki ( creator_uuid TEXT NOT NULL REFERENCES creator(uuid) ON DELETE CASCADE, platform TEXT NOT NULL, identifier TEXT NOT NULL, PRIMARY KEY (creator_uuid, platform) );
INSERT INTO "creator_wiki" VALUES('597ecbdb-d31f-4c48-8907-1ab1438ddee5','moegirl','USAO');
INSERT INTO "creator_wiki" VALUES('3814a5ad-974b-457d-bd4c-7ee194f7eaae','moegirl','Camellia');
INSERT INTO "creator_wiki" VALUES('4da58d31-9aa2-4969-8404-ae589240e691','moegirl','重音Teto');
INSERT INTO "creator_wiki" VALUES('89e3e350-2485-4959-be51-e4693bfdfbc5','moegirl','初音未来');
CREATE TABLE work ( uuid TEXT PRIMARY KEY, copyright_basis TEXT NOT NULL CHECK(copyright_basis IN ('none', 'accept', 'license')) );
INSERT INTO "work" VALUES('21d591dd-0042-4cf0-a798-6ea3676a9d23','none');
INSERT INTO "work" VALUES('db381df9-2480-4e68-af2a-63be8ad1f85b','none');
INSERT INTO "work" VALUES('2ab4cee5-4305-49bc-9a25-f72415b49a79','none');
INSERT INTO "work" VALUES('ab23094a-f912-49f5-afa2-d007531b60f2','none');
INSERT INTO "work" VALUES('7e513b12-7454-4994-9919-9a80e39deaee','none');
INSERT INTO "work" VALUES('b7213789-847b-4c62-9630-dfd0f8e5868f','none');
INSERT INTO "work" VALUES('f287246f-ae76-42ee-bd4e-ac565fd94549','none');
CREATE TABLE work_license ( work_uuid TEXT PRIMARY KEY REFERENCES work(uuid) ON DELETE CASCADE, license_type TEXT NOT NULL );
CREATE TABLE asset_creator ( asset_uuid TEXT NOT NULL REFERENCES asset(uuid) ON DELETE CASCADE, creator_uuid TEXT NOT NULL REFERENCES creator(uuid), role TEXT NOT NULL, PRIMARY KEY (asset_uuid, creator_uuid) );
CREATE TABLE work_relation ( uuid TEXT PRIMARY KEY, from_work_uuid TEXT NOT NULL REFERENCES work(uuid) ON DELETE CASCADE, to_work_uuid TEXT NOT NULL REFERENCES work(uuid) ON DELETE CASCADE, relation_type TEXT NOT NULL CHECK(relation_type IN ( 'original', 'remix', 'cover', 'remake', 'picture', 'lyrics' )) );
INSERT INTO "work_relation" VALUES('3be054d7-647c-4ee8-a77e-bfe0fc59ce5f','f287246f-ae76-42ee-bd4e-ac565fd94549','ab23094a-f912-49f5-afa2-d007531b60f2','remix');
CREATE TABLE work_wiki ( work_uuid TEXT NOT NULL REFERENCES work(uuid) ON DELETE CASCADE, platform TEXT NOT NULL, identifier TEXT NOT NULL, PRIMARY KEY (work_uuid, platform) );
INSERT INTO "work_wiki" VALUES('2ab4cee5-4305-49bc-9a25-f72415b49a79','baidu','再见呐/64658112');
INSERT INTO "work_wiki" VALUES('f287246f-ae76-42ee-bd4e-ac565fd94549','thbwiki','灵知的太阳信仰_～_Nuclear_Fusion');
INSERT INTO "work_wiki" VALUES('db381df9-2480-4e68-af2a-63be8ad1f85b','moegirl','Mobius');
CREATE TABLE work_creator ( work_uuid TEXT NOT NULL REFERENCES work(uuid) ON DELETE CASCADE, creator_uuid TEXT NOT NULL REFERENCES creator(uuid) ON DELETE CASCADE, role TEXT NOT NULL, PRIMARY KEY (work_uuid, creator_uuid, role) );
INSERT INTO "work_creator" VALUES('2ab4cee5-4305-49bc-9a25-f72415b49a79','4da58d31-9aa2-4969-8404-ae589240e691','vocal');
INSERT INTO "work_creator" VALUES('2ab4cee5-4305-49bc-9a25-f72415b49a79','76086fab-05aa-45c0-bbb0-6a710d6da15d','producer');
INSERT INTO "work_creator" VALUES('2ab4cee5-4305-49bc-9a25-f72415b49a79','89e3e350-2485-4959-be51-e4693bfdfbc5','vocal');
INSERT INTO "work_creator" VALUES('ab23094a-f912-49f5-afa2-d007531b60f2','67124873-3411-4771-bc85-e24b5b8cb71f','original');
INSERT INTO "work_creator" VALUES('ab23094a-f912-49f5-afa2-d007531b60f2','aabbd320-cbef-4dac-bf9b-cc7c8e79b634','producer');
INSERT INTO "work_creator" VALUES('f287246f-ae76-42ee-bd4e-ac565fd94549','67124873-3411-4771-bc85-e24b5b8cb71f','original');
INSERT INTO "work_creator" VALUES('b7213789-847b-4c62-9630-dfd0f8e5868f','41eb7722-f7ca-4dd1-9f91-0721b4e1cba3','remixer');
INSERT INTO "work_creator" VALUES('b7213789-847b-4c62-9630-dfd0f8e5868f','67124873-3411-4771-bc85-e24b5b8cb71f','original');
INSERT INTO "work_creator" VALUES('7e513b12-7454-4994-9919-9a80e39deaee','597ecbdb-d31f-4c48-8907-1ab1438ddee5','remixer');
INSERT INTO "work_creator" VALUES('7e513b12-7454-4994-9919-9a80e39deaee','dc45304b-cb07-4de4-bb7c-9648c381ed7a','remixer');
INSERT INTO "work_creator" VALUES('db381df9-2480-4e68-af2a-63be8ad1f85b','3814a5ad-974b-457d-bd4c-7ee194f7eaae','composer');
INSERT INTO "work_creator" VALUES('db381df9-2480-4e68-af2a-63be8ad1f85b','597ecbdb-d31f-4c48-8907-1ab1438ddee5','composer');
INSERT INTO "work_creator" VALUES('21d591dd-0042-4cf0-a798-6ea3676a9d23','5af67a71-f138-4608-ad73-f5607631dd2b','producer');
CREATE TABLE footer_settings ( uuid TEXT PRIMARY KEY, item_type TEXT NOT NULL CHECK(item_type IN ('link', 'social', 'copyright')), text TEXT NOT NULL, url TEXT, icon_class TEXT );
INSERT INTO "footer_settings" VALUES('a1b2c3d4-e5f6-7890-1234-567890abcdef','link','后台管理','/admin','fas fa-comment');
INSERT INTO "footer_settings" VALUES('b2c3d4e5-f6a1-b2c3-d4e5-f6a1b2c3d4e5','link','联系我们','mailto:contact@vocarchive.com',NULL);
INSERT INTO "footer_settings" VALUES('c3d4e5f6-a1b2-c3d4-e5f6-a1b2c3d4e5f6','link','意见反馈','mailto:feedback@vocarchive.com',NULL);
INSERT INTO "footer_settings" VALUES('d4e5f6a1-b2c3-d4e5-f6a1-b2c3d4e5f6a1','link','侵权投诉','mailto:copyright@vocarchive.com',NULL);
INSERT INTO "footer_settings" VALUES('e5f6a1b2-c3d4-e5f6-a1b2-c3d4e5f6a1b2','social','GitHub','https://github.com/gxxk-dev/VOCArchive','fab fa-github');
INSERT INTO "footer_settings" VALUES('f6a1b2c3-d4e5-f6a1-b2c3-d4e5f6a1b2c3','copyright','VOCArchive-Demo. AGPL v3 (or later).',NULL,NULL);
INSERT INTO "footer_settings" VALUES('be6d3df9-5d61-4e44-8e09-f38ac469b870','social','Telegram','https://t.me/VOCArch1ve_ChatHub','fab fa-telegram');
CREATE TABLE tag ( uuid TEXT PRIMARY KEY, name TEXT NOT NULL UNIQUE );
INSERT INTO "tag" VALUES('e7e764bd-4bcc-4bcb-bfe0-1399e8b0e7e9','东方Project');
INSERT INTO "tag" VALUES('ee8fb206-c602-480b-92aa-b97cecda66d1','WACCA');
INSERT INTO "tag" VALUES('77d0ab01-ea62-45eb-bd44-7990c24c14c8','术力口');
CREATE TABLE category ( uuid TEXT PRIMARY KEY, name TEXT NOT NULL UNIQUE, parent_uuid TEXT REFERENCES category(uuid) ON DELETE CASCADE );
INSERT INTO "category" VALUES('b5a1524a-c9c1-417c-85d7-bec621f1cc25','HARDCORE TANO*C',NULL);
CREATE TABLE work_tag ( work_uuid TEXT NOT NULL REFERENCES work(uuid) ON DELETE CASCADE, tag_uuid TEXT NOT NULL REFERENCES tag(uuid) ON DELETE CASCADE, PRIMARY KEY (work_uuid, tag_uuid) );
INSERT INTO "work_tag" VALUES('ab23094a-f912-49f5-afa2-d007531b60f2','e7e764bd-4bcc-4bcb-bfe0-1399e8b0e7e9');
INSERT INTO "work_tag" VALUES('f287246f-ae76-42ee-bd4e-ac565fd94549','e7e764bd-4bcc-4bcb-bfe0-1399e8b0e7e9');
INSERT INTO "work_tag" VALUES('b7213789-847b-4c62-9630-dfd0f8e5868f','e7e764bd-4bcc-4bcb-bfe0-1399e8b0e7e9');
CREATE TABLE work_category ( work_uuid TEXT NOT NULL REFERENCES work(uuid) ON DELETE CASCADE, category_uuid TEXT NOT NULL REFERENCES category(uuid) ON DELETE CASCADE, PRIMARY KEY (work_uuid, category_uuid) );
INSERT INTO "work_category" VALUES('b7213789-847b-4c62-9630-dfd0f8e5868f','b5a1524a-c9c1-417c-85d7-bec621f1cc25');
INSERT INTO "work_category" VALUES('7e513b12-7454-4994-9919-9a80e39deaee','b5a1524a-c9c1-417c-85d7-bec621f1cc25');
INSERT INTO "work_category" VALUES('db381df9-2480-4e68-af2a-63be8ad1f85b','b5a1524a-c9c1-417c-85d7-bec621f1cc25');
CREATE TABLE IF NOT EXISTS "work_title" (
	`uuid` text PRIMARY KEY NOT NULL,
	`work_uuid` text NOT NULL,
	`is_official` integer NOT NULL,
	`is_for_search` integer DEFAULT false NOT NULL,
	`language` text NOT NULL,
	`title` text NOT NULL,
	FOREIGN KEY (`work_uuid`) REFERENCES `work`(`uuid`) ON UPDATE no action ON DELETE cascade
);
INSERT INTO "work_title" VALUES('a235d7f7-3a65-460c-b771-cc497c3a4f5d','2ab4cee5-4305-49bc-9a25-f72415b49a79',1,0,'ja','じゃあな');
INSERT INTO "work_title" VALUES('281cd0c6-6484-4626-a132-90d0b5534176','2ab4cee5-4305-49bc-9a25-f72415b49a79',0,0,'zh-cn','再见呐');
INSERT INTO "work_title" VALUES('dd550f82-cc67-429d-97d9-30582610f0cd','ab23094a-f912-49f5-afa2-d007531b60f2',1,0,'en','Armageddon');
INSERT INTO "work_title" VALUES('43b10898-6a9a-4556-95ac-423f2b9c5478','f287246f-ae76-42ee-bd4e-ac565fd94549',1,0,'ja','霊知の太陽信仰 ～ Nuclear Fusion');
INSERT INTO "work_title" VALUES('6ba137cf-6ed9-4d1a-96c5-83e972055cd2','f287246f-ae76-42ee-bd4e-ac565fd94549',0,0,'zh-cn','灵知的太阳信仰 ～ Nuclear Fusion');
INSERT INTO "work_title" VALUES('fa99cc31-f8e8-4930-916c-1143caae014f','b7213789-847b-4c62-9630-dfd0f8e5868f',1,0,'en','Bad Apple!! (REDALiCE Remix)');
INSERT INTO "work_title" VALUES('aff4cd1c-c3a6-4b66-913a-ab9a3f989412','7e513b12-7454-4994-9919-9a80e39deaee',1,0,'en','WACCA ULTRA DREAM MEGAMIX');
INSERT INTO "work_title" VALUES('76b7c91a-a18e-4892-b25b-b069eea15fca','db381df9-2480-4e68-af2a-63be8ad1f85b',1,0,'en','Möbius');
INSERT INTO "work_title" VALUES('0f862b28-c39d-40b6-bfb4-b9949a87d695','db381df9-2480-4e68-af2a-63be8ad1f85b',0,1,'en','Mobius');
INSERT INTO "work_title" VALUES('a1606e26-3047-48db-bdf2-7b9cf3ac9cb7','21d591dd-0042-4cf0-a798-6ea3676a9d23',1,0,'en','BUTCHER VANITY');
INSERT INTO "work_title" VALUES('9f429db8-88ba-40d2-b8c8-c454f2009cc6','21d591dd-0042-4cf0-a798-6ea3676a9d23',0,0,'zh-cn','虚荣屠夫');
CREATE TABLE external_source (
            uuid TEXT PRIMARY KEY,
            type TEXT NOT NULL CHECK(type IN ('raw_url', 'private_b2')),
            name TEXT NOT NULL,
            endpoint TEXT NOT NULL
        );
INSERT INTO "external_source" VALUES('c9b29b2e-4de6-4bc9-8066-c49ac5fcdc2a','raw_url','Default Asset Storage','https://assets.vocarchive.com/{id}');
CREATE TABLE external_object (
            uuid TEXT PRIMARY KEY,
            external_source_uuid TEXT NOT NULL REFERENCES external_source(uuid) ON DELETE CASCADE,
            mime_type TEXT NOT NULL,
            file_id TEXT NOT NULL
        );
INSERT INTO "external_object" VALUES('130bf2d1-82ae-4a4e-a063-2a0a743e4375','c9b29b2e-4de6-4bc9-8066-c49ac5fcdc2a','application/octet-stream','280px-Butcher_Vanity.webp');
INSERT INTO "external_object" VALUES('228165fc-c03a-46c6-8ba7-02f325828450','c9b29b2e-4de6-4bc9-8066-c49ac5fcdc2a','application/octet-stream','mobius.webp');
INSERT INTO "external_object" VALUES('136d86bf-dbf6-4c62-8486-5b723edbdbc3','c9b29b2e-4de6-4bc9-8066-c49ac5fcdc2a','application/octet-stream','じゃあな.webp');
INSERT INTO "external_object" VALUES('fc8745a6-d0cb-4c30-b3b1-5f000ef4dfe7','c9b29b2e-4de6-4bc9-8066-c49ac5fcdc2a','application/octet-stream','Armageddon.webp');
INSERT INTO "external_object" VALUES('5d36168e-ec1f-4402-880f-5f2379b1aca1','c9b29b2e-4de6-4bc9-8066-c49ac5fcdc2a','application/octet-stream','WACCA_ULTRA_DREAM_MEGAMIX_1x1.webp');
INSERT INTO "external_object" VALUES('8b8eb767-6afd-48be-8959-e52f49112c68','c9b29b2e-4de6-4bc9-8066-c49ac5fcdc2a','application/octet-stream','BadApple_REDALiCEremix.webp');
INSERT INTO "external_object" VALUES('ae73688c-3702-4298-b8d2-c7ec0178485a','c9b29b2e-4de6-4bc9-8066-c49ac5fcdc2a','application/octet-stream','nuclear_fusion.webp');
INSERT INTO "external_object" VALUES('7b04b04e-1cbf-4eaa-a08d-739105908dd4','c9b29b2e-4de6-4bc9-8066-c49ac5fcdc2a','audio/x-flac','BUTCHER+VANITY+ft.+Yi+Xi.flac');
INSERT INTO "external_object" VALUES('93a3cedf-a6da-466d-b015-cf7fb2b003be','c9b29b2e-4de6-4bc9-8066-c49ac5fcdc2a','video/mp4','mobius.mp4');
INSERT INTO "external_object" VALUES('7f99c756-770f-4d0d-822b-75c6aca39d26','c9b29b2e-4de6-4bc9-8066-c49ac5fcdc2a','audio/x-flac','mobius.flac');
INSERT INTO "external_object" VALUES('80c80e42-f68b-43a2-a21b-e50c10ba0f43','c9b29b2e-4de6-4bc9-8066-c49ac5fcdc2a','video/mp4','じゃあな.mp4');
INSERT INTO "external_object" VALUES('058f0da1-2f9e-445c-97c6-e44a1b38ee62','c9b29b2e-4de6-4bc9-8066-c49ac5fcdc2a','video/mp4','Armageddon.mp4');
INSERT INTO "external_object" VALUES('dbb00ab7-656d-40be-a2b7-a5c1c02eb20b','c9b29b2e-4de6-4bc9-8066-c49ac5fcdc2a','audio/x-flac','Armageddon.flac');
INSERT INTO "external_object" VALUES('a56e293d-8288-4ff6-84b0-bed2fb3f735b','c9b29b2e-4de6-4bc9-8066-c49ac5fcdc2a','audio/x-flac','WACCA_ULTRA_DREAM_MEGAMIX.flac');
INSERT INTO "external_object" VALUES('8c700c78-9fe9-4c2a-ad7e-ba1c2412d9c7','c9b29b2e-4de6-4bc9-8066-c49ac5fcdc2a','audio/x-flac','Bad Apple!! (REDALiCE Remix).flac');
INSERT INTO "external_object" VALUES('e5be99b4-b914-43d2-ae70-7f3b5710b47b','c9b29b2e-4de6-4bc9-8066-c49ac5fcdc2a','audio/x-flac','nuclear_fusion.flac');
CREATE TABLE asset_external_object (
            asset_uuid TEXT NOT NULL REFERENCES asset(uuid) ON DELETE CASCADE,
            external_object_uuid TEXT NOT NULL REFERENCES external_object(uuid) ON DELETE CASCADE,
            PRIMARY KEY (asset_uuid, external_object_uuid)
        );
INSERT INTO "asset_external_object" VALUES('be151f76-26bc-4cad-9cac-383fc91caa26','130bf2d1-82ae-4a4e-a063-2a0a743e4375');
INSERT INTO "asset_external_object" VALUES('25d5ab53-aab8-4dda-926e-1b26ab46c52d','228165fc-c03a-46c6-8ba7-02f325828450');
INSERT INTO "asset_external_object" VALUES('62419365-0846-4b90-b474-9eeda7c20eaf','136d86bf-dbf6-4c62-8486-5b723edbdbc3');
INSERT INTO "asset_external_object" VALUES('a50ae0e1-7a12-4e2c-a215-a216510bd18c','fc8745a6-d0cb-4c30-b3b1-5f000ef4dfe7');
INSERT INTO "asset_external_object" VALUES('17f113e6-dd6a-42d0-ae28-599b03a9109a','5d36168e-ec1f-4402-880f-5f2379b1aca1');
INSERT INTO "asset_external_object" VALUES('27ee864b-cb6e-41eb-a8dd-c047f5242329','8b8eb767-6afd-48be-8959-e52f49112c68');
INSERT INTO "asset_external_object" VALUES('b96848f1-d029-4ac6-87cb-9d7aa596c9ad','ae73688c-3702-4298-b8d2-c7ec0178485a');
CREATE TABLE media_source_external_object (
            media_source_uuid TEXT NOT NULL REFERENCES media_source(uuid) ON DELETE CASCADE,
            external_object_uuid TEXT NOT NULL REFERENCES external_object(uuid) ON DELETE CASCADE,
            PRIMARY KEY (media_source_uuid, external_object_uuid)
        );
INSERT INTO "media_source_external_object" VALUES('cda3a12d-9003-4cc4-8f29-9df3985b5596','93a3cedf-a6da-466d-b015-cf7fb2b003be');
INSERT INTO "media_source_external_object" VALUES('8953b548-26c9-4652-a5d6-f08c5ae72845','7f99c756-770f-4d0d-822b-75c6aca39d26');
INSERT INTO "media_source_external_object" VALUES('eeb3da7a-eb2e-414f-b1e7-d5261bb2dd44','80c80e42-f68b-43a2-a21b-e50c10ba0f43');
INSERT INTO "media_source_external_object" VALUES('79718cf8-2be0-4516-af29-3a87c167c04b','058f0da1-2f9e-445c-97c6-e44a1b38ee62');
INSERT INTO "media_source_external_object" VALUES('86c29bcb-f17b-494e-a374-508ba01c3061','dbb00ab7-656d-40be-a2b7-a5c1c02eb20b');
INSERT INTO "media_source_external_object" VALUES('d569877e-ff05-4b4b-9250-2d823da4d61d','a56e293d-8288-4ff6-84b0-bed2fb3f735b');
INSERT INTO "media_source_external_object" VALUES('b1e3fd28-572c-42ea-8698-aff52a9bee34','8c700c78-9fe9-4c2a-ad7e-ba1c2412d9c7');
INSERT INTO "media_source_external_object" VALUES('652a8e18-79be-49a7-9c4a-d891d7acf7ab','e5be99b4-b914-43d2-ae70-7f3b5710b47b');
INSERT INTO "media_source_external_object" VALUES('6ca99d39-48b7-40b7-8f81-8d6be60b2cf0','7b04b04e-1cbf-4eaa-a08d-739105908dd4');
CREATE TABLE IF NOT EXISTS "asset" (
    uuid text PRIMARY KEY NOT NULL,
    file_id text,
    work_uuid text NOT NULL,
    asset_type text NOT NULL,
    file_name text NOT NULL,
    is_previewpic integer,
    language text,
    FOREIGN KEY (work_uuid) REFERENCES work(uuid) ON UPDATE no action ON DELETE cascade
);
INSERT INTO "asset" VALUES('be151f76-26bc-4cad-9cac-383fc91caa26',NULL,'21d591dd-0042-4cf0-a798-6ea3676a9d23','picture','280px-Butcher_Vanity.webp',1,NULL);
INSERT INTO "asset" VALUES('25d5ab53-aab8-4dda-926e-1b26ab46c52d',NULL,'db381df9-2480-4e68-af2a-63be8ad1f85b','picture','mobius.webp',1,NULL);
INSERT INTO "asset" VALUES('62419365-0846-4b90-b474-9eeda7c20eaf',NULL,'2ab4cee5-4305-49bc-9a25-f72415b49a79','picture','じゃあな.webp',1,NULL);
INSERT INTO "asset" VALUES('a50ae0e1-7a12-4e2c-a215-a216510bd18c',NULL,'ab23094a-f912-49f5-afa2-d007531b60f2','picture','Armageddon.webp',1,NULL);
INSERT INTO "asset" VALUES('17f113e6-dd6a-42d0-ae28-599b03a9109a',NULL,'7e513b12-7454-4994-9919-9a80e39deaee','picture','WACCA_ULTRA_DREAM_MEGAMIX_1x1.webp',1,NULL);
INSERT INTO "asset" VALUES('27ee864b-cb6e-41eb-a8dd-c047f5242329',NULL,'b7213789-847b-4c62-9630-dfd0f8e5868f','picture','BadApple_REDALiCEremix.webp',1,NULL);
INSERT INTO "asset" VALUES('b96848f1-d029-4ac6-87cb-9d7aa596c9ad',NULL,'f287246f-ae76-42ee-bd4e-ac565fd94549','picture','nuclear_fusion.webp',1,NULL);
CREATE TABLE IF NOT EXISTS "media_source" (
    uuid text PRIMARY KEY NOT NULL,
    work_uuid text NOT NULL,
    is_music integer NOT NULL,
    file_name text NOT NULL,
    url text,
    mime_type text NOT NULL,
    info text NOT NULL,
    FOREIGN KEY (work_uuid) REFERENCES work(uuid) ON UPDATE no action ON DELETE cascade
);
INSERT INTO "media_source" VALUES('6ca99d39-48b7-40b7-8f81-8d6be60b2cf0','21d591dd-0042-4cf0-a798-6ea3676a9d23',1,'BUTCHER VANITY ft. Yi Xi.flac',NULL,'audio/x-flac','flac, 44100 Hz, stereo, s32 (24 bit), Lavf58.76.100');
INSERT INTO "media_source" VALUES('cda3a12d-9003-4cc4-8f29-9df3985b5596','db381df9-2480-4e68-af2a-63be8ad1f85b',0,'mobius.mp4',NULL,'video/mp4','h264, yuv420p, 1920x1080, 3680 kb/s, 30 fps');
INSERT INTO "media_source" VALUES('8953b548-26c9-4652-a5d6-f08c5ae72845','db381df9-2480-4e68-af2a-63be8ad1f85b',1,'mobius.flac',NULL,'audio/x-flac','flac, 44100 Hz, stereo, s32 (24 bit), 128 kb/s ');
INSERT INTO "media_source" VALUES('eeb3da7a-eb2e-414f-b1e7-d5261bb2dd44','2ab4cee5-4305-49bc-9a25-f72415b49a79',0,'じゃあな.mp4',NULL,'video/mp4','h264, 852x480, 777 kb/s, 29.97 fps');
INSERT INTO "media_source" VALUES('79718cf8-2be0-4516-af29-3a87c167c04b','ab23094a-f912-49f5-afa2-d007531b60f2',0,'Armageddon.mp4',NULL,'video/mp4','av1, yuv420p, 3840x2160, 14519 kb/s, 30 fps');
INSERT INTO "media_source" VALUES('86c29bcb-f17b-494e-a374-508ba01c3061','ab23094a-f912-49f5-afa2-d007531b60f2',1,'Armageddon.flac',NULL,'audio/x-flac','Lavc62.8.100, flac, 48000 Hz, stereo, s32 (24 bit), 128 kb/s');
INSERT INTO "media_source" VALUES('d569877e-ff05-4b4b-9250-2d823da4d61d','7e513b12-7454-4994-9919-9a80e39deaee',1,'WACCA_ULTRA_DREAM_MEGAMIX.flac',NULL,'audio/x-flac','Lavf62.1.103, flac, 44100 Hz, stereo, s16');
INSERT INTO "media_source" VALUES('b1e3fd28-572c-42ea-8698-aff52a9bee34','b7213789-847b-4c62-9630-dfd0f8e5868f',1,'Bad Apple!! (REDALiCE Remix).flac',NULL,'audio/x-flac','Lavf58.76.100, flac, 44100 Hz, stereo, s32 (24 bit), 1743 kb/s');
INSERT INTO "media_source" VALUES('652a8e18-79be-49a7-9c4a-d891d7acf7ab','f287246f-ae76-42ee-bd4e-ac565fd94549',1,'nuclear_fusion.flac',NULL,'audio/x-flac','flac, 44100 Hz, stereo, s16');