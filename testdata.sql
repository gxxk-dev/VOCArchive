PRAGMA defer_foreign_keys=TRUE;
CREATE TABLE creator ( uuid TEXT PRIMARY KEY, name TEXT NOT NULL, type TEXT CHECK(type IN ('human', 'virtual')) NOT NULL);
INSERT INTO creator VALUES('5af67a71-f138-4608-ad73-f5607631dd2b','FLAVOR FOLEY','human');
INSERT INTO creator VALUES('597ecbdb-d31f-4c48-8907-1ab1438ddee5','USAO','human');
INSERT INTO creator VALUES('3814a5ad-974b-457d-bd4c-7ee194f7eaae','Camellia','human');
INSERT INTO creator VALUES('4da58d31-9aa2-4969-8404-ae589240e691','重音テト','virtual');
INSERT INTO creator VALUES('89e3e350-2485-4959-be51-e4693bfdfbc5','初音ミク','virtual');
INSERT INTO creator VALUES('76086fab-05aa-45c0-bbb0-6a710d6da15d','よこしま','human');
INSERT INTO creator VALUES('67124873-3411-4771-bc85-e24b5b8cb71f','ZUN','human');
INSERT INTO creator VALUES('aabbd320-cbef-4dac-bf9b-cc7c8e79b634','LeaF','human');
INSERT INTO creator VALUES('dc45304b-cb07-4de4-bb7c-9648c381ed7a','Kobaryo','human');
INSERT INTO creator VALUES('41eb7722-f7ca-4dd1-9f91-0721b4e1cba3','REDALiCE','human');
CREATE TABLE creator_wiki ( creator_uuid TEXT NOT NULL REFERENCES creator(uuid) ON DELETE CASCADE, platform TEXT NOT NULL, identifier TEXT NOT NULL, PRIMARY KEY (creator_uuid, platform) );
INSERT INTO creator_wiki VALUES('597ecbdb-d31f-4c48-8907-1ab1438ddee5','moegirl','USAO');
INSERT INTO creator_wiki VALUES('3814a5ad-974b-457d-bd4c-7ee194f7eaae','moegirl','Camellia');
INSERT INTO creator_wiki VALUES('4da58d31-9aa2-4969-8404-ae589240e691','moegirl','重音Teto');
INSERT INTO creator_wiki VALUES('89e3e350-2485-4959-be51-e4693bfdfbc5','moegirl','初音未来');
CREATE TABLE work ( uuid TEXT PRIMARY KEY, copyright_basis TEXT NOT NULL CHECK(copyright_basis IN ('none', 'accept', 'license', 'arr', 'onlymetadata')) );
INSERT INTO work VALUES('21d591dd-0042-4cf0-a798-6ea3676a9d23','none');
INSERT INTO work VALUES('db381df9-2480-4e68-af2a-63be8ad1f85b','none');
INSERT INTO work VALUES('2ab4cee5-4305-49bc-9a25-f72415b49a79','none');
INSERT INTO work VALUES('ab23094a-f912-49f5-afa2-d007531b60f2','none');
INSERT INTO work VALUES('7e513b12-7454-4994-9919-9a80e39deaee','none');
INSERT INTO work VALUES('b7213789-847b-4c62-9630-dfd0f8e5868f','none');
INSERT INTO work VALUES('f287246f-ae76-42ee-bd4e-ac565fd94549','none');
CREATE TABLE work_license ( work_uuid TEXT PRIMARY KEY REFERENCES work(uuid) ON DELETE CASCADE, license_type TEXT NOT NULL );
CREATE TABLE media_source ( uuid TEXT PRIMARY KEY, work_uuid TEXT NOT NULL REFERENCES work(uuid) ON DELETE CASCADE, is_music BOOLEAN NOT NULL, file_name TEXT NOT NULL, url TEXT NOT NULL, mime_type TEXT NOT NULL, info TEXT NOT NULL );
INSERT INTO media_source VALUES('6ca99d39-48b7-40b7-8f81-8d6be60b2cf0','21d591dd-0042-4cf0-a798-6ea3676a9d23',1,'BUTCHER VANITY ft. Yi Xi.flac','https://assets.vocarchive.com/BUTCHER+VANITY+ft.+Yi+Xi.flac','audio/x-flac','flac, 44100 Hz, stereo, s32 (24 bit), Lavf58.76.100');
INSERT INTO media_source VALUES('cda3a12d-9003-4cc4-8f29-9df3985b5596','db381df9-2480-4e68-af2a-63be8ad1f85b',0,'mobius.mp4','https://assets.vocarchive.com/mobius.mp4','video/mp4','h264, yuv420p, 1920x1080, 3680 kb/s, 30 fps');
INSERT INTO media_source VALUES('8953b548-26c9-4652-a5d6-f08c5ae72845','db381df9-2480-4e68-af2a-63be8ad1f85b',1,'mobius.flac','https://assets.vocarchive.com/mobius.flac','audio/x-flac','flac, 44100 Hz, stereo, s32 (24 bit), 128 kb/s ');
INSERT INTO media_source VALUES('eeb3da7a-eb2e-414f-b1e7-d5261bb2dd44','2ab4cee5-4305-49bc-9a25-f72415b49a79',0,'じゃあな.mp4','https://assets.vocarchive.com/じゃあな.mp4','video/mp4','h264, 852x480, 777 kb/s, 29.97 fps');
INSERT INTO media_source VALUES('79718cf8-2be0-4516-af29-3a87c167c04b','ab23094a-f912-49f5-afa2-d007531b60f2',0,'Armageddon.mp4','https://assets.vocarchive.com/Armageddon.mp4','video/mp4','av1, yuv420p, 3840x2160, 14519 kb/s, 30 fps');
INSERT INTO media_source VALUES('86c29bcb-f17b-494e-a374-508ba01c3061','ab23094a-f912-49f5-afa2-d007531b60f2',1,'Armageddon.flac','https://assets.vocarchive.com/Armageddon.flac','audio/x-flac','Lavc62.8.100, flac, 48000 Hz, stereo, s32 (24 bit), 128 kb/s');
INSERT INTO media_source VALUES('d569877e-ff05-4b4b-9250-2d823da4d61d','7e513b12-7454-4994-9919-9a80e39deaee',1,'WACCA_ULTRA_DREAM_MEGAMIX.flac','https://assets.vocarchive.com/WACCA_ULTRA_DREAM_MEGAMIX.flac','audio/x-flac','Lavf62.1.103, flac, 44100 Hz, stereo, s16');
INSERT INTO media_source VALUES('b1e3fd28-572c-42ea-8698-aff52a9bee34','b7213789-847b-4c62-9630-dfd0f8e5868f',1,'Bad Apple!! (REDALiCE Remix).flac','https://assets.vocarchive.com/Bad Apple!! (REDALiCE Remix).flac','audio/x-flac','Lavf58.76.100, flac, 44100 Hz, stereo, s32 (24 bit), 1743 kb/s');
INSERT INTO media_source VALUES('652a8e18-79be-49a7-9c4a-d891d7acf7ab','f287246f-ae76-42ee-bd4e-ac565fd94549',1,'nuclear_fusion.flac','https://assets.vocarchive.com/nuclear_fusion.flac','audio/x-flac','flac, 44100 Hz, stereo, s16');
CREATE TABLE asset ( uuid TEXT PRIMARY KEY, file_id TEXT NOT NULL, work_uuid TEXT NOT NULL REFERENCES work(uuid) ON DELETE CASCADE, asset_type TEXT CHECK(asset_type IN ('lyrics', 'picture')) NOT NULL, file_name TEXT NOT NULL, is_previewpic BOOLEAN, language TEXT );
INSERT INTO asset VALUES('be151f76-26bc-4cad-9cac-383fc91caa26','280px-Butcher_Vanity.webp','21d591dd-0042-4cf0-a798-6ea3676a9d23','picture','280px-Butcher_Vanity.webp',1,NULL);
INSERT INTO asset VALUES('25d5ab53-aab8-4dda-926e-1b26ab46c52d','mobius.webp','db381df9-2480-4e68-af2a-63be8ad1f85b','picture','mobius.webp',1,NULL);
INSERT INTO asset VALUES('62419365-0846-4b90-b474-9eeda7c20eaf','じゃあな.webp','2ab4cee5-4305-49bc-9a25-f72415b49a79','picture','じゃあな.webp',1,NULL);
INSERT INTO asset VALUES('a50ae0e1-7a12-4e2c-a215-a216510bd18c','Armageddon.webp','ab23094a-f912-49f5-afa2-d007531b60f2','picture','Armageddon.webp',1,NULL);
INSERT INTO asset VALUES('17f113e6-dd6a-42d0-ae28-599b03a9109a','WACCA_ULTRA_DREAM_MEGAMIX_1x1.webp','7e513b12-7454-4994-9919-9a80e39deaee','picture','WACCA_ULTRA_DREAM_MEGAMIX_1x1.webp',1,NULL);
INSERT INTO asset VALUES('27ee864b-cb6e-41eb-a8dd-c047f5242329','BadApple_REDALiCEremix.webp','b7213789-847b-4c62-9630-dfd0f8e5868f','picture','BadApple_REDALiCEremix.webp',1,NULL);
INSERT INTO asset VALUES('b96848f1-d029-4ac6-87cb-9d7aa596c9ad','nuclear_fusion.webp','f287246f-ae76-42ee-bd4e-ac565fd94549','picture','nuclear_fusion.webp',1,NULL);
CREATE TABLE asset_creator ( asset_uuid TEXT NOT NULL REFERENCES asset(uuid) ON DELETE CASCADE, creator_uuid TEXT NOT NULL REFERENCES creator(uuid), role TEXT NOT NULL, PRIMARY KEY (asset_uuid, creator_uuid) );
INSERT INTO asset_creator VALUES('b96848f1-d029-4ac6-87cb-9d7aa596c9ad','67124873-3411-4771-bc85-e24b5b8cb71f','original');
CREATE TABLE work_relation ( uuid TEXT PRIMARY KEY, from_work_uuid TEXT NOT NULL REFERENCES work(uuid) ON DELETE CASCADE, to_work_uuid TEXT NOT NULL REFERENCES work(uuid) ON DELETE CASCADE, relation_type TEXT NOT NULL CHECK(relation_type IN ( 'original', 'remix', 'cover', 'remake', 'picture', 'lyrics' )) );
INSERT INTO work_relation VALUES('3be054d7-647c-4ee8-a77e-bfe0fc59ce5f','f287246f-ae76-42ee-bd4e-ac565fd94549','ab23094a-f912-49f5-afa2-d007531b60f2','remix');
CREATE TABLE work_wiki ( work_uuid TEXT NOT NULL REFERENCES work(uuid) ON DELETE CASCADE, platform TEXT NOT NULL, identifier TEXT NOT NULL, PRIMARY KEY (work_uuid, platform) );
INSERT INTO work_wiki VALUES('2ab4cee5-4305-49bc-9a25-f72415b49a79','baidu','再见呐/64658112');
INSERT INTO work_wiki VALUES('f287246f-ae76-42ee-bd4e-ac565fd94549','thbwiki','灵知的太阳信仰_～_Nuclear_Fusion');
INSERT INTO work_wiki VALUES('db381df9-2480-4e68-af2a-63be8ad1f85b','moegirl','Mobius');
CREATE TABLE work_creator ( work_uuid TEXT NOT NULL REFERENCES work(uuid) ON DELETE CASCADE, creator_uuid TEXT NOT NULL REFERENCES creator(uuid) ON DELETE CASCADE, role TEXT NOT NULL, PRIMARY KEY (work_uuid, creator_uuid, role) );
INSERT INTO work_creator VALUES('21d591dd-0042-4cf0-a798-6ea3676a9d23','5af67a71-f138-4608-ad73-f5607631dd2b','producer');
INSERT INTO work_creator VALUES('2ab4cee5-4305-49bc-9a25-f72415b49a79','4da58d31-9aa2-4969-8404-ae589240e691','vocal');
INSERT INTO work_creator VALUES('2ab4cee5-4305-49bc-9a25-f72415b49a79','76086fab-05aa-45c0-bbb0-6a710d6da15d','producer');
INSERT INTO work_creator VALUES('2ab4cee5-4305-49bc-9a25-f72415b49a79','89e3e350-2485-4959-be51-e4693bfdfbc5','vocal');
INSERT INTO work_creator VALUES('ab23094a-f912-49f5-afa2-d007531b60f2','67124873-3411-4771-bc85-e24b5b8cb71f','original');
INSERT INTO work_creator VALUES('ab23094a-f912-49f5-afa2-d007531b60f2','aabbd320-cbef-4dac-bf9b-cc7c8e79b634','producer');
INSERT INTO work_creator VALUES('f287246f-ae76-42ee-bd4e-ac565fd94549','67124873-3411-4771-bc85-e24b5b8cb71f','original');
INSERT INTO work_creator VALUES('b7213789-847b-4c62-9630-dfd0f8e5868f','41eb7722-f7ca-4dd1-9f91-0721b4e1cba3','remixer');
INSERT INTO work_creator VALUES('b7213789-847b-4c62-9630-dfd0f8e5868f','67124873-3411-4771-bc85-e24b5b8cb71f','original');
INSERT INTO work_creator VALUES('7e513b12-7454-4994-9919-9a80e39deaee','597ecbdb-d31f-4c48-8907-1ab1438ddee5','remixer');
INSERT INTO work_creator VALUES('7e513b12-7454-4994-9919-9a80e39deaee','dc45304b-cb07-4de4-bb7c-9648c381ed7a','remixer');
INSERT INTO work_creator VALUES('db381df9-2480-4e68-af2a-63be8ad1f85b','3814a5ad-974b-457d-bd4c-7ee194f7eaae','composer');
INSERT INTO work_creator VALUES('db381df9-2480-4e68-af2a-63be8ad1f85b','597ecbdb-d31f-4c48-8907-1ab1438ddee5','composer');
CREATE TABLE footer_settings ( uuid TEXT PRIMARY KEY, item_type TEXT NOT NULL CHECK(item_type IN ('link', 'social', 'copyright')), text TEXT NOT NULL, url TEXT, icon_class TEXT );
INSERT INTO footer_settings VALUES('a1b2c3d4-e5f6-7890-1234-567890abcdef','link','后台管理','/admin','fas fa-comment');
INSERT INTO footer_settings VALUES('b2c3d4e5-f6a1-b2c3-d4e5-f6a1b2c3d4e5','link','联系我们','mailto:contact@vocarchive.com',NULL);
INSERT INTO footer_settings VALUES('c3d4e5f6-a1b2-c3d4-e5f6-a1b2c3d4e5f6','link','意见反馈','mailto:feedback@vocarchive.com',NULL);
INSERT INTO footer_settings VALUES('d4e5f6a1-b2c3-d4e5-f6a1-b2c3d4e5f6a1','link','侵权投诉','mailto:copyright@vocarchive.com',NULL);
INSERT INTO footer_settings VALUES('e5f6a1b2-c3d4-e5f6-a1b2-c3d4e5f6a1b2','social','GitHub','https://github.com/gxxk-dev/VOCArchive','fab fa-github');
INSERT INTO footer_settings VALUES('f6a1b2c3-d4e5-f6a1-b2c3-d4e5f6a1b2c3','copyright','VOCArchive-Demo. AGPL v3 (or later).',NULL,NULL);
INSERT INTO footer_settings VALUES('be6d3df9-5d61-4e44-8e09-f38ac469b870','social','Telegram','https://t.me/VOCArch1ve_ChatHub','fab fa-telegram');
CREATE TABLE tag ( uuid TEXT PRIMARY KEY, name TEXT NOT NULL UNIQUE );
INSERT INTO tag VALUES('e7e764bd-4bcc-4bcb-bfe0-1399e8b0e7e9','东方Project');
INSERT INTO tag VALUES('ee8fb206-c602-480b-92aa-b97cecda66d1','WACCA');
INSERT INTO tag VALUES('77d0ab01-ea62-45eb-bd44-7990c24c14c8','术力口');
CREATE TABLE category ( uuid TEXT PRIMARY KEY, name TEXT NOT NULL UNIQUE, parent_uuid TEXT REFERENCES category(uuid) ON DELETE CASCADE );
INSERT INTO category VALUES('b5a1524a-c9c1-417c-85d7-bec621f1cc25','HARDCORE TANO*C',NULL);
CREATE TABLE work_tag ( work_uuid TEXT NOT NULL REFERENCES work(uuid) ON DELETE CASCADE, tag_uuid TEXT NOT NULL REFERENCES tag(uuid) ON DELETE CASCADE, PRIMARY KEY (work_uuid, tag_uuid) );
INSERT INTO work_tag VALUES('ab23094a-f912-49f5-afa2-d007531b60f2','e7e764bd-4bcc-4bcb-bfe0-1399e8b0e7e9');
INSERT INTO work_tag VALUES('f287246f-ae76-42ee-bd4e-ac565fd94549','e7e764bd-4bcc-4bcb-bfe0-1399e8b0e7e9');
INSERT INTO work_tag VALUES('b7213789-847b-4c62-9630-dfd0f8e5868f','e7e764bd-4bcc-4bcb-bfe0-1399e8b0e7e9');
CREATE TABLE work_category ( work_uuid TEXT NOT NULL REFERENCES work(uuid) ON DELETE CASCADE, category_uuid TEXT NOT NULL REFERENCES category(uuid) ON DELETE CASCADE, PRIMARY KEY (work_uuid, category_uuid) );
INSERT INTO work_category VALUES('b7213789-847b-4c62-9630-dfd0f8e5868f','b5a1524a-c9c1-417c-85d7-bec621f1cc25');
INSERT INTO work_category VALUES('7e513b12-7454-4994-9919-9a80e39deaee','b5a1524a-c9c1-417c-85d7-bec621f1cc25');
INSERT INTO work_category VALUES('db381df9-2480-4e68-af2a-63be8ad1f85b','b5a1524a-c9c1-417c-85d7-bec621f1cc25');
CREATE TABLE IF NOT EXISTS "work_title" (
	`uuid` text PRIMARY KEY NOT NULL,
	`work_uuid` text NOT NULL,
	`is_official` integer NOT NULL,
	`is_for_search` integer DEFAULT false NOT NULL,
	`language` text NOT NULL,
	`title` text NOT NULL,
	FOREIGN KEY (`work_uuid`) REFERENCES `work`(`uuid`) ON UPDATE no action ON DELETE cascade
);
INSERT INTO work_title VALUES('dcbe0a31-385d-4f56-b500-3f85d713465c','21d591dd-0042-4cf0-a798-6ea3676a9d23',1,0,'en','BUTCHER VANITY');
INSERT INTO work_title VALUES('97f17f3f-9945-4f22-b398-373973af473d','21d591dd-0042-4cf0-a798-6ea3676a9d23',0,0,'zh-cn','虚荣屠夫');
INSERT INTO work_title VALUES('0259f2b4-86f7-41b1-b04a-389032a0987e','2ab4cee5-4305-49bc-9a25-f72415b49a79',1,0,'ja','じゃあな');
INSERT INTO work_title VALUES('ed37cbc3-d73b-4b32-b713-60c8bc891de6','2ab4cee5-4305-49bc-9a25-f72415b49a79',0,0,'zh-cn','再见呐');
INSERT INTO work_title VALUES('c477493f-c25b-4f15-8f41-66ea8e7a78ab','ab23094a-f912-49f5-afa2-d007531b60f2',1,0,'en','Armageddon');
INSERT INTO work_title VALUES('74d8a6e6-b26c-4a37-8e79-0c45fbc7625d','f287246f-ae76-42ee-bd4e-ac565fd94549',1,0,'ja','霊知の太陽信仰 ～ Nuclear Fusion');
INSERT INTO work_title VALUES('5a859938-c0e0-43ba-a25b-74a665858566','f287246f-ae76-42ee-bd4e-ac565fd94549',0,0,'zh-cn','灵知的太阳信仰 ～ Nuclear Fusion');
INSERT INTO work_title VALUES('1851c2e7-090d-42dd-a559-e06ab71cfb95','b7213789-847b-4c62-9630-dfd0f8e5868f',1,0,'en','Bad Apple!! (REDALiCE Remix)');
INSERT INTO work_title VALUES('5cf81a09-a2c0-4be6-a680-06a274b03818','7e513b12-7454-4994-9919-9a80e39deaee',1,0,'en','WACCA ULTRA DREAM MEGAMIX');
INSERT INTO work_title VALUES('097cd447-9def-4270-91c1-044a7b276869','db381df9-2480-4e68-af2a-63be8ad1f85b',1,0,'en','Möbius');
INSERT INTO work_title VALUES('1f73d056-6a61-43cf-820e-fc5322963a25','db381df9-2480-4e68-af2a-63be8ad1f85b',0,1,'test','Mobius');
CREATE TABLE external_source (
            uuid TEXT PRIMARY KEY,
            type TEXT NOT NULL CHECK(type IN ('raw_url', 'private_b2')),
            name TEXT NOT NULL,
            endpoint TEXT NOT NULL
        );
INSERT INTO external_source VALUES('038b890d-ca0d-485b-9d15-76e287359914','raw_url','Default Asset Storage','https://assets.vocarchive.com/{ID}');
INSERT INTO external_source VALUES('954f1b0e-2480-4656-a6ef-35c924e332c2','raw_url','Direct URL Storage','{ID}');
CREATE TABLE external_object (
            uuid TEXT PRIMARY KEY,
            external_source_uuid TEXT NOT NULL REFERENCES external_source(uuid) ON DELETE CASCADE,
            mime_type TEXT NOT NULL,
            file_id TEXT NOT NULL
        );
INSERT INTO external_object VALUES('911358de-36a9-48ce-8a17-875caf7053d1','038b890d-ca0d-485b-9d15-76e287359914','application/octet-stream','280px-Butcher_Vanity.webp');
INSERT INTO external_object VALUES('63b56d17-9fae-4bbd-be35-9ad6ccc5da5a','038b890d-ca0d-485b-9d15-76e287359914','application/octet-stream','mobius.webp');
INSERT INTO external_object VALUES('3d5b785a-fbdf-4bda-acef-aee4d658a8ce','038b890d-ca0d-485b-9d15-76e287359914','application/octet-stream','じゃあな.webp');
INSERT INTO external_object VALUES('5e98bc9b-210a-4ce4-b468-26e29aee77de','038b890d-ca0d-485b-9d15-76e287359914','application/octet-stream','Armageddon.webp');
INSERT INTO external_object VALUES('0147adf4-c5ce-4d86-b1e3-6fc693f9d17d','038b890d-ca0d-485b-9d15-76e287359914','application/octet-stream','WACCA_ULTRA_DREAM_MEGAMIX_1x1.webp');
INSERT INTO external_object VALUES('9e815681-4f71-4c3c-aa5a-4c45789bd9ee','038b890d-ca0d-485b-9d15-76e287359914','application/octet-stream','BadApple_REDALiCEremix.webp');
INSERT INTO external_object VALUES('733a590a-a6b9-4c1e-a3ca-532d02be5725','038b890d-ca0d-485b-9d15-76e287359914','application/octet-stream','nuclear_fusion.webp');
INSERT INTO external_object VALUES('528d1c5d-8014-4094-ac30-3f5c057853fd','038b890d-ca0d-485b-9d15-76e287359914','audio/x-flac','BUTCHER+VANITY+ft.+Yi+Xi.flac');
INSERT INTO external_object VALUES('c1b2b541-d709-462f-bdb9-ba74d311e5bb','038b890d-ca0d-485b-9d15-76e287359914','video/mp4','mobius.mp4');
INSERT INTO external_object VALUES('5dd7a2ae-ab66-4340-a43a-dff7066c6a2f','038b890d-ca0d-485b-9d15-76e287359914','audio/x-flac','mobius.flac');
INSERT INTO external_object VALUES('4fcc1511-94bd-476a-8d0b-538f4ef8c331','038b890d-ca0d-485b-9d15-76e287359914','video/mp4','じゃあな.mp4');
INSERT INTO external_object VALUES('3c64cc01-094d-4534-a89d-5c2687d4d0e3','038b890d-ca0d-485b-9d15-76e287359914','video/mp4','Armageddon.mp4');
INSERT INTO external_object VALUES('888ea16b-b881-4db0-95e0-e056ef66a632','038b890d-ca0d-485b-9d15-76e287359914','audio/x-flac','Armageddon.flac');
INSERT INTO external_object VALUES('b73bf13d-6a91-4ae1-b573-70e2b622702b','038b890d-ca0d-485b-9d15-76e287359914','audio/x-flac','WACCA_ULTRA_DREAM_MEGAMIX.flac');
INSERT INTO external_object VALUES('a7e193fd-6b82-4d72-be3b-f5d5b6859804','038b890d-ca0d-485b-9d15-76e287359914','audio/x-flac','Bad Apple!! (REDALiCE Remix).flac');
INSERT INTO external_object VALUES('0af572c8-db53-420f-9a9f-3ec7c422a561','038b890d-ca0d-485b-9d15-76e287359914','audio/x-flac','nuclear_fusion.flac');
CREATE TABLE asset_external_object (
            asset_uuid TEXT NOT NULL REFERENCES asset(uuid) ON DELETE CASCADE,
            external_object_uuid TEXT NOT NULL REFERENCES external_object(uuid) ON DELETE CASCADE,
            PRIMARY KEY (asset_uuid, external_object_uuid)
        );
INSERT INTO asset_external_object VALUES('be151f76-26bc-4cad-9cac-383fc91caa26','911358de-36a9-48ce-8a17-875caf7053d1');
INSERT INTO asset_external_object VALUES('25d5ab53-aab8-4dda-926e-1b26ab46c52d','63b56d17-9fae-4bbd-be35-9ad6ccc5da5a');
INSERT INTO asset_external_object VALUES('62419365-0846-4b90-b474-9eeda7c20eaf','3d5b785a-fbdf-4bda-acef-aee4d658a8ce');
INSERT INTO asset_external_object VALUES('a50ae0e1-7a12-4e2c-a215-a216510bd18c','5e98bc9b-210a-4ce4-b468-26e29aee77de');
INSERT INTO asset_external_object VALUES('17f113e6-dd6a-42d0-ae28-599b03a9109a','0147adf4-c5ce-4d86-b1e3-6fc693f9d17d');
INSERT INTO asset_external_object VALUES('27ee864b-cb6e-41eb-a8dd-c047f5242329','9e815681-4f71-4c3c-aa5a-4c45789bd9ee');
INSERT INTO asset_external_object VALUES('b96848f1-d029-4ac6-87cb-9d7aa596c9ad','733a590a-a6b9-4c1e-a3ca-532d02be5725');
CREATE TABLE media_source_external_object (
            media_source_uuid TEXT NOT NULL REFERENCES media_source(uuid) ON DELETE CASCADE,
            external_object_uuid TEXT NOT NULL REFERENCES external_object(uuid) ON DELETE CASCADE,
            PRIMARY KEY (media_source_uuid, external_object_uuid)
        );
INSERT INTO media_source_external_object VALUES('6ca99d39-48b7-40b7-8f81-8d6be60b2cf0','528d1c5d-8014-4094-ac30-3f5c057853fd');
INSERT INTO media_source_external_object VALUES('cda3a12d-9003-4cc4-8f29-9df3985b5596','c1b2b541-d709-462f-bdb9-ba74d311e5bb');
INSERT INTO media_source_external_object VALUES('8953b548-26c9-4652-a5d6-f08c5ae72845','5dd7a2ae-ab66-4340-a43a-dff7066c6a2f');
INSERT INTO media_source_external_object VALUES('eeb3da7a-eb2e-414f-b1e7-d5261bb2dd44','4fcc1511-94bd-476a-8d0b-538f4ef8c331');
INSERT INTO media_source_external_object VALUES('79718cf8-2be0-4516-af29-3a87c167c04b','3c64cc01-094d-4534-a89d-5c2687d4d0e3');
INSERT INTO media_source_external_object VALUES('86c29bcb-f17b-494e-a374-508ba01c3061','888ea16b-b881-4db0-95e0-e056ef66a632');
INSERT INTO media_source_external_object VALUES('d569877e-ff05-4b4b-9250-2d823da4d61d','b73bf13d-6a91-4ae1-b573-70e2b622702b');
INSERT INTO media_source_external_object VALUES('b1e3fd28-572c-42ea-8698-aff52a9bee34','a7e193fd-6b82-4d72-be3b-f5d5b6859804');
INSERT INTO media_source_external_object VALUES('652a8e18-79be-49a7-9c4a-d891d7acf7ab','0af572c8-db53-420f-9a9f-3ec7c422a561');
CREATE TABLE site_config (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL,
                description TEXT
            );
INSERT INTO site_config VALUES('site_title','Index | VAZone','网站标题（浏览器标签页显示）');
INSERT INTO site_config VALUES('home_title','VOCArchive Zone','主页标题');
INSERT INTO site_config VALUES('player_title','{WORK_TITLE} / Work | VAZone','播放器页标题');
INSERT INTO site_config VALUES('admin_title','{TAB_NAME} / Manager | VAZone','管理后台标题');
INSERT INTO site_config VALUES('totp_secret','SFRBPEJHTBAAX3OTAMODCDCRQ5QOTATT','TOTP 认证密钥');
INSERT INTO site_config VALUES('jwt_secret','7NJ2UF3TKD4C3CA7HXKNIBXRYPWX5E2Z','JWT 签名密钥');
