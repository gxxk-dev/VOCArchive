function RemoveComments_SQLStmts(stmtGroup:string):string[] {
    return stmtGroup.split(';')
        .map(block => {
            // 将语句块按行拆分
            const lines = block.split(/\r?\n/);
            // 逐行处理：移除行内注释并清理
            const processedLines = lines.map(line => {
                const commentIndex = line.indexOf('--');
                if (commentIndex === -1) return line.trim();
                if (commentIndex === 0) return '';
                return line.substring(0, commentIndex).trim();
            });
            // 合并处理后的行并清理整个语句块
            return processedLines.join(' ')
                .replace(/\s+/g, ' ')  // 压缩连续空格
                .trim();
        })
        .filter(block => block.length > 0)
}

// 数据库初始化
const DB_INIT_SQL:string[]=RemoveComments_SQLStmts(`
-- 创作者表 (包含真实创作者/虚拟歌姬)
CREATE TABLE creator (
    uuid TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT CHECK(type IN ('human', 'virtual')) NOT NULL,
    voicelib TEXT  -- 仅虚拟歌姬需要 (e.g. "Teto SV")
);

-- 创作者百科表 (多源存储)
CREATE TABLE creator_wiki (
    creator_uuid TEXT NOT NULL REFERENCES creator(uuid) ON DELETE CASCADE,
    platform TEXT NOT NULL,  -- e.g. "moegirl", "wikipedia"
    identifier TEXT NOT NULL,  -- 百科唯一标识符
    PRIMARY KEY (creator_uuid, platform)
);

-- 作品核心表
CREATE TABLE work (
    uuid TEXT PRIMARY KEY,
    copyright_basis TEXT NOT NULL CHECK(copyright_basis IN ('none', 'accept', 'license'))
);

-- [多语言支持]作品标题表
CREATE TABLE work_title (
    work_uuid TEXT NOT NULL REFERENCES work(uuid) ON DELETE CASCADE,
    is_official BOOLEAN NOT NULL,  -- 是否为官方标题
    language TEXT NOT NULL,  -- 语言代码 (e.g. "ja", "zh-CN")
    title TEXT NOT NULL,
    PRIMARY KEY (work_uuid, language)
);

-- 作品授权表 (仅当copyright_basis='license'时需要)
CREATE TABLE work_license (
    work_uuid TEXT PRIMARY KEY REFERENCES work(uuid) ON DELETE CASCADE,
    license_type TEXT NOT NULL  -- e.g. CC BY-NC-SA 3.0
);

-- 媒体源表 (多平台来源)
CREATE TABLE media_source (
    uuid TEXT PRIMARY KEY,
    work_uuid TEXT NOT NULL REFERENCES work(uuid) ON DELETE CASCADE,
    is_music BOOLEAN NOT NULL,  -- 是否为音乐文件
    file_name TEXT NOT NULL,  -- 原始文件名
    url TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    info TEXT NOT NULL -- e.g. "FLAC(level8) 128kbps"
);

-- 资产表 (歌词/曲绘等)
CREATE TABLE asset (
    uuid TEXT PRIMARY KEY,
    file_id TEXT NOT NULL,
    work_uuid TEXT NOT NULL REFERENCES work(uuid) ON DELETE CASCADE,
    asset_type TEXT CHECK(asset_type IN ('lyrics', 'picture')) NOT NULL,
    file_name TEXT NOT NULL,
    is_previewpic BOOLEAN,  -- 是否为预览图 仅pic需要
    language TEXT  -- 仅歌词需要 (e.g. "ja", "zh-CN")
);

-- 资产创作者关联表 (标注歌词/曲绘作者)
CREATE TABLE asset_creator (
    asset_uuid TEXT NOT NULL REFERENCES asset(uuid) ON DELETE CASCADE,
    creator_uuid TEXT NOT NULL REFERENCES creator(uuid),
    role TEXT NOT NULL,  -- e.g. "lyricist", "illustrator"
    PRIMARY KEY (asset_uuid, creator_uuid)
);

-- 作品关系表 (二创/衍生作品)
CREATE TABLE work_relation (
    uuid TEXT PRIMARY KEY,
    from_work_uuid TEXT NOT NULL REFERENCES work(uuid) ON DELETE CASCADE,
    to_work_uuid TEXT NOT NULL REFERENCES work(uuid) ON DELETE CASCADE,
    relation_type TEXT NOT NULL CHECK(relation_type IN (
        'original', 'remix', 'cover', 'remake', 
        'picture', 'lyrics'

    ))
);

-- 作品百科表 (多源存储)
CREATE TABLE work_wiki (
    work_uuid TEXT NOT NULL REFERENCES work(uuid) ON DELETE CASCADE,
    platform TEXT NOT NULL,  -- e.g. "vocadb", "niconico"
    identifier TEXT NOT NULL,  -- 平台唯一ID
    PRIMARY KEY (work_uuid, platform)
);

CREATE TABLE IF NOT EXISTS work_creator (
    work_uuid TEXT NOT NULL REFERENCES work(uuid) ON DELETE CASCADE,
    creator_uuid TEXT NOT NULL REFERENCES creator(uuid) ON DELETE CASCADE,
    role TEXT NOT NULL,
    PRIMARY KEY (work_uuid, creator_uuid, role)
);

-- Config表 (键值对存储)
CREATE TABLE config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);
`);


// 用户表
const USER_TABLES = [
    'work_title', 'work_license', 'media_source', 'asset',
    'asset_creator', 'work_relation', 'work_wiki', 'work_creator',
    'work', 'creator_wiki', 'creator', 'config'
];

const UUID_PATTERNS = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export async function UUIDCheck(uuid:string):Promise<boolean> {
    return UUID_PATTERNS.test(uuid);
}

export async function DropUserTables(DB:D1Database) {
    try {
        // 1. 禁用外键约束（确保删除顺序不影响）
        await DB.exec('PRAGMA foreign_keys = OFF')
       
        // 3. 逐个删除表
        for (const table of USER_TABLES) {
            try {
                // 安全处理表名（防止SQL注入）
                await DB.exec(`DROP TABLE "${table}"`);
                console.log(`已删除表: ${table}`);
            } catch (dropError) {
                console.error(`删除表 ${table} 失败:`, dropError);
            }
        }
        
        // 4. 重新启用外键约束
        await DB.exec('PRAGMA foreign_keys = ON');
        return true;
    } catch (error) {
        console.error('删除表过程中出错:', error);
        // 确保即使出错也重新启用外键
        await DB.exec('PRAGMA foreign_keys = ON').catch(() => {});
        return false;
    }
}

export async function ExportAllTables(db: D1Database): Promise<Record<string, any[]>> {
    const result: Record<string, any[]> = {};
    for (const tableName of USER_TABLES) {
        try {
            const data = await db.prepare(`SELECT * FROM ${tableName}`).all();
            result[tableName] = data.results || [];
        } catch (error) {
            result[tableName] = [];
        }
    }
    return result;
}


// 初始化数据库
export async function InitDatabase(DB:D1Database):Promise<void> {
    for (const stmt of DB_INIT_SQL) {
        await DB.exec(stmt).then(() => console.log(stmt));
    }
}

interface WorkInfo {
    work: Work;
    titles: WorkTitle[];
    license?: string;
    media_sources: MediaSource[];
    assets: AssetWithCreators[];
    creators: CreatorWithRole[];
    relations: WorkRelation[];
    wikis: WikiRef[];
}

interface Work {
    uuid: string;
    copyright_basis: 'none' | 'accept' | 'license';
}

interface MediaSource {
    uuid: string;
    work_uuid: string;
    is_music: boolean;
    file_name: string;
    url: string;
    mime_type: string;
    info: string;
}

interface Asset {
    uuid: string;
    file_id: string;
    work_uuid: string;
    asset_type: 'lyrics' | 'picture';
    file_name: string;
    is_previewpic?: boolean;
    language?: string;
}

interface AssetWithCreators extends Asset {
    creators: CreatorWithRole[];
}

interface Creator {
    uuid: string;
    name: string;
    type: 'human' | 'virtual';
    voicelib?: string;
}

interface CreatorWithRole {
    creator_uuid: string;
    creator_name?: string;
    creator_type: 'human' | 'virtual';
    role: string;
}

interface WorkRelation {
    uuid: string;
    from_work_uuid: string;
    to_work_uuid: string;
    relation_type: 'original' | 'remix' | 'cover' | 'remake' | 'picture' | 'lyrics';
    related_work_titles?: {
        from_work_titles: Array<{ 
            language: string;
            title: string;
        }>;
        to_work_titles: Array<{ 
            language: string;
            title: string;
        }>;
    };
}



interface WikiRef {
    platform: string;
    identifier: string;
}

interface WorkTitle {
    is_official: boolean;
    language: string;
    title: string;
}

// 在 WorkListItem 接口中添加 creators 字段
interface WorkListItem {
    work_uuid: string;
    titles: WorkTitle[];
    preview_asset?: Asset;
    non_preview_asset?: Asset;
    creators: CreatorWithRole[];  // 添加作者信息
}


async function getWorkTitles(DB: D1Database, workUUID: string): Promise<D1Result<WorkTitle>> {
    const titleStmt = DB.prepare(`
        SELECT is_official, language, title 
        FROM work_title
        WHERE work_uuid = ?
    `).bind(workUUID);

    return await titleStmt.all<WorkTitle>();
}


// 修改 GetWorkListWithPagination 函数
export async function GetWorkListWithPagination(DB: D1Database, page: number, pageSize: number): Promise<WorkListItem[]> {
    // 1. 验证分页参数
    if (page < 1 || pageSize < 1) {
        return [];
    }
    
    // 2. 计算偏移量
    const offset = (page - 1) * pageSize;
    
    // 3. 获取分页的作品UUID列表
    const workListStmt = DB.prepare(`
        SELECT uuid 
        FROM work 
        ORDER BY uuid 
        LIMIT ? OFFSET ?
    `).bind(pageSize, offset);
    
    const workListResult = await workListStmt.all<{ uuid: string }>();
    const workUUIDs = workListResult.results || [];
    
    if (workUUIDs.length === 0) {
        return [];
    }
    
    // 4. 获取所有作品的创作者信息（单次查询）
    const creatorStmt = DB.prepare(`
        SELECT 
            wc.work_uuid,
            c.uuid as creator_uuid,
            c.name as creator_name,
            c.type as creator_type,
            wc.role
        FROM work_creator wc
        JOIN creator c ON wc.creator_uuid = c.uuid
        WHERE wc.work_uuid IN (${workUUIDs.map(() => '?').join(',')})
    `).bind(...workUUIDs.map(w => w.uuid));
    
    const creatorResult = await creatorStmt.all();
    const creatorMap = new Map<string, CreatorWithRole[]>();
    
    // 创建作品UUID到创作者的映射
    creatorResult.results?.forEach((row: any) => {
        if (!creatorMap.has(row.work_uuid)) {
            creatorMap.set(row.work_uuid, []);
        }
        creatorMap.get(row.work_uuid)!.push({
            creator_uuid: row.creator_uuid,
            creator_name: row.creator_name,
            creator_type: row.creator_type,
            role: row.role
        });
    });
    
    // 5. 为每个作品获取其他信息
    const workListPromises = workUUIDs.map(async ({ uuid }) => {
        // 获取标题
        const titlesResult = await getWorkTitles(DB, uuid);
        const titles = titlesResult.results || [];
        
        // 获取封面资产
        const [previewResult, nonPreviewResult] = await Promise.all([
            DB.prepare(`
                SELECT uuid, file_id, work_uuid, asset_type, file_name, is_previewpic, language
                FROM asset 
                WHERE work_uuid = ? AND asset_type = 'picture' AND is_previewpic = 1
                ORDER BY uuid 
                LIMIT 1
            `).bind(uuid).first<Asset>(),
            DB.prepare(`
                SELECT uuid, file_id, work_uuid, asset_type, file_name, is_previewpic, language
                FROM asset 
                WHERE work_uuid = ? AND asset_type = 'picture' AND (is_previewpic = 0 OR is_previewpic IS NULL)
                ORDER BY uuid 
                LIMIT 1
            `).bind(uuid).first<Asset>()
        ]);
        
        return {
            work_uuid: uuid,
            titles,
            preview_asset: previewResult || undefined,
            non_preview_asset: nonPreviewResult || undefined,
            creators: creatorMap.get(uuid) || []
        };
    });
    
    return await Promise.all(workListPromises);
}


export async function GetWorkByUUID(DB: D1Database, workUUID: string): Promise<WorkInfo | null> {
    // 1. 验证UUID格式
    if (!(await UUIDCheck(workUUID))) {
    //    return null;
    }

    // 2. 获取作品基本信息
    const workStmt = DB.prepare(`
        SELECT uuid, copyright_basis 
        FROM work 
        WHERE uuid = ?
    `).bind(workUUID);
    
    const workResult = await workStmt.first<Work>();
    if (!workResult) {
        return null;
    }
    // 3. 获取作品标题信息
    const titlesResult = await getWorkTitles(DB, workUUID);
    const titles = titlesResult.results || [];
    // 4. 获取授权信息（仅当copyright_basis为'license'时）
    let license: string | undefined;
    if (workResult.copyright_basis === 'license') {
        const licenseStmt = DB.prepare(`
            SELECT license_type 
            FROM work_license 
            WHERE work_uuid = ?
        `).bind(workUUID);
        
        const licenseResult = await licenseStmt.first<{ license_type: string }>();
        license = licenseResult?.license_type;
    }
    // 5. 获取媒体源信息
    const mediaStmt = DB.prepare(`
        SELECT uuid, work_uuid, is_music, file_name, url, mime_type, info
        FROM media_source 
        WHERE work_uuid = ?
    `).bind(workUUID);
    
    const mediaResult = await mediaStmt.all<MediaSource>();
    const media_sources = mediaResult.results || [];
    // 6. 获取资产信息及其创作者
    const assetStmt = DB.prepare(`
        SELECT a.uuid, a.file_id, a.work_uuid, a.asset_type, a.file_name, 
               a.is_previewpic, a.language,
               c.uuid as creator_uuid, c.name as creator_name, 
               ac.role as creator_role
        FROM asset a
        LEFT JOIN asset_creator ac ON a.uuid = ac.asset_uuid
        LEFT JOIN creator c ON ac.creator_uuid = c.uuid
        WHERE a.work_uuid = ?
    `).bind(workUUID);
    
    const assetResult = await assetStmt.all();
    const assetMap = new Map<string, AssetWithCreators>();
    
    assetResult.results?.forEach((row: any) => {
        if (!assetMap.has(row.uuid)) {
            assetMap.set(row.uuid, {
                uuid: row.uuid,
                file_id: row.file_id,
                work_uuid: row.work_uuid,
                asset_type: row.asset_type,
                file_name: row.file_name,
                is_previewpic: row.is_previewpic,
                language: row.language,
                creators: []
            });
        }
        
        if (row.creator_uuid) {
            assetMap.get(row.uuid)!.creators.push({
                creator_uuid: row.creator_uuid,
                creator_name: row.creator_name,
                creator_type: row.creator_type,
                role: row.creator_role
            });
        }
    });
    
    const assets = Array.from(assetMap.values());
    // 7. 获取作品创作者信息
    const creatorStmt = DB.prepare(`
        SELECT c.uuid as creator_uuid, c.name as creator_name, wc.role
        FROM work_creator wc
        JOIN creator c ON wc.creator_uuid = c.uuid
        WHERE wc.work_uuid = ?
    `).bind(workUUID);
    
    const creatorResult = await creatorStmt.all();
    const creators: CreatorWithRole[] = (creatorResult.results || []).map((row: any) => ({
        creator_uuid: row.creator_uuid,
        creator_name: row.creator_name,
        creator_type: row.creator_type,
        role: row.role
    }));

    // 8. 获取作品关系信息（包含关联作品多语言标题）
    const relationStmt = DB.prepare(`
        SELECT 
            wr.uuid, 
            wr.from_work_uuid, 
            wr.to_work_uuid, 
            wr.relation_type,
            json_object(
                'from_work_titles', (
                    SELECT json_group_array(json_object('language', language, 'title', title))
                    FROM (
                        SELECT DISTINCT language, title 
                        FROM work_title 
                        WHERE work_uuid = wr.from_work_uuid
                    )
                ),
                'to_work_titles', (
                    SELECT json_group_array(json_object('language', language, 'title', title))
                    FROM (
                        SELECT DISTINCT language, title 
                        FROM work_title 
                        WHERE work_uuid = wr.to_work_uuid
                    )
                )
            ) as related_work_titles
        FROM work_relation wr
        WHERE wr.from_work_uuid = ? OR wr.to_work_uuid = ?
    `).bind(workUUID, workUUID);


    const relationResult = await relationStmt.all<WorkRelation>();
    const relations = relationResult.results?.map(relation => ({
        ...relation,
        related_work_titles: relation.related_work_titles 
            ? JSON.parse(relation.related_work_titles as unknown as string)
            : undefined
    })) || [];


    // 9. 获取百科信息
    const wikiStmt = DB.prepare(`
        SELECT platform, identifier
        FROM work_wiki 
        WHERE work_uuid = ?
    `).bind(workUUID);
    
    const wikiResult = await wikiStmt.all<WikiRef>();
    const wikis = wikiResult.results || [];
    // 10. 组装完整信息
    return {
        work: workResult,
        titles,
        license,
        media_sources,
        assets,
        creators,
        relations,
        wikis
    };

}

export async function GetCreatorByUUID(DB: D1Database, creatorUUID: string): Promise<{ creator: Creator, wikis: WikiRef[] } | null> {
    if (!(await UUIDCheck(creatorUUID))) {
        return null;
    }

    const creator = await DB.prepare(`SELECT * FROM creator WHERE uuid = ?`).bind(creatorUUID).first<Creator>();
    if (!creator) {
        return null;
    }

    const wikisResult = await DB.prepare(`SELECT platform, identifier FROM creator_wiki WHERE creator_uuid = ?`).bind(creatorUUID).all<WikiRef>();
    const wikis = wikisResult.results || [];

    return { creator, wikis };
}

export async function GetMediaByUUID(DB: D1Database, mediaUUID: string): Promise<MediaSource | null> {
    if (!(await UUIDCheck(mediaUUID))) {
        return null;
    }
    return await DB.prepare(`SELECT * FROM media_source WHERE uuid = ?`).bind(mediaUUID).first<MediaSource>();
}

export async function GetAssetByUUID(DB: D1Database, assetUUID: string): Promise<{ asset: Asset, creators: CreatorWithRole[] } | null> {
    if (!(await UUIDCheck(assetUUID))) {
        return null;
    }

    const asset = await DB.prepare(`SELECT * FROM asset WHERE uuid = ?`).bind(assetUUID).first<Asset>();
    if (!asset) {
        return null;
    }

    const creatorResult = await DB.prepare(`
        SELECT c.uuid as creator_uuid, c.name as creator_name, ac.role
        FROM asset_creator ac
        JOIN creator c ON ac.creator_uuid = c.uuid
        WHERE ac.asset_uuid = ?
    `).bind(assetUUID).all();

    const creators: CreatorWithRole[] = (creatorResult.results || []).map((row: any) => ({
        creator_uuid: row.creator_uuid,
        creator_name: row.creator_name,
        creator_type: row.creator_type,
        role: row.role
    }));

    return { asset, creators };
}

export async function GetRelationByUUID(DB: D1Database, relationUUID: string): Promise<WorkRelation | null> {
    if (!(await UUIDCheck(relationUUID))) {
        return null;
    }
    return await DB.prepare(`SELECT uuid, from_work_uuid, to_work_uuid, relation_type FROM work_relation WHERE uuid = ?`).bind(relationUUID).first<WorkRelation>();
}

// InputCreator - 插入创作者及百科信息
export async function InputCreator(DB: D1Database, creator: Creator, wikis?: WikiRef[]) {
    // 插入主创作者表
    await DB.prepare(`
        INSERT INTO creator (uuid, name, type, voicelib) 
        VALUES (?, ?, ?, ?)
    `).bind(
        creator.uuid, 
        creator.name, 
        creator.type, 
        creator.voicelib
    ).run();
    
    // 插入百科信息（如果存在）
    if (wikis && wikis.length > 0) {
        const insertWikis = wikis.map(wiki => 
            DB.prepare(`
                INSERT INTO creator_wiki (creator_uuid, platform, identifier)
                VALUES (?, ?, ?)
            `).bind(creator.uuid, wiki.platform, wiki.identifier)
        );
        await DB.batch(insertWikis);
    }
}

// InputWork - 插入作品核心及相关信息
export async function InputWork(DB: D1Database, work: Work, titles: WorkTitle[], 
                               license: string | null, creators: CreatorWithRole[],
                               wikis?: WikiRef[]) {
    // 使用事务确保操作原子性
    await DB.batch([
        // 插入作品核心
        DB.prepare(`
            INSERT INTO work (uuid, copyright_basis)
            VALUES (?, ?)
        `).bind(work.uuid, work.copyright_basis),
        
        // 插入多语言标题
        ...titles.map(title => 
            DB.prepare(`
                INSERT INTO work_title (work_uuid, is_official, language, title)
                VALUES (?, ?, ?, ?)
            `).bind(work.uuid, title.is_official ? 1 : 0, title.language, title.title)
        ),
        
        // 插入授权信息（如果需要）
        ...(license && work.copyright_basis === 'license' ? [
            DB.prepare(`
                INSERT INTO work_license (work_uuid, license_type)
                VALUES (?, ?)
            `).bind(work.uuid, license)
        ] : []),
        
        // 插入创作者关联
        ...creators.map(c => 
            DB.prepare(`
                INSERT INTO work_creator (work_uuid, creator_uuid, role)
                VALUES (?, ?, ?)
            `).bind(work.uuid, c.creator_uuid, c.role)
        ),
        
        // 插入百科信息
        ...(wikis ? wikis.map(wiki => 
            DB.prepare(`
                INSERT INTO work_wiki (work_uuid, platform, identifier)
                VALUES (?, ?, ?)
            `).bind(work.uuid, wiki.platform, wiki.identifier)
        ) : [])
    ]);
}

// InputAsset - 插入资产及相关创作者
export async function InputAsset(DB: D1Database, asset: Asset, creators?: CreatorWithRole[]) {
    // 使用事务批量操作
    const statements: D1PreparedStatement[] = [
        // 插入资产主体
        DB.prepare(`
            INSERT INTO asset (uuid, file_id, work_uuid, asset_type, 
                              file_name, is_previewpic, language)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).bind(
            asset.uuid,
            asset.file_id,
            asset.work_uuid,
            asset.asset_type,
            asset.file_name,
            asset.is_previewpic === undefined ? null : (asset.is_previewpic ? 1 : 0),
            asset.language || null
        )
    ];
    
    // 添加资产创作者
    if (creators) {
        creators.forEach(c => {
            statements.push(
                DB.prepare(`
                    INSERT INTO asset_creator (asset_uuid, creator_uuid, role)
                    VALUES (?, ?, ?)
                `).bind(asset.uuid, c.creator_uuid, c.role)
            );
        });
    }
    
    await DB.batch(statements);
}

// InputRelation - 插入作品关系
export async function InputRelation(DB: D1Database, relation: WorkRelation) {
    // 单一插入操作
    await DB.prepare(`
        INSERT INTO work_relation (uuid, from_work_uuid, to_work_uuid, relation_type)
        VALUES (?, ?, ?, ?)
    `).bind(
        relation.uuid,
        relation.from_work_uuid,
        relation.to_work_uuid,
        relation.relation_type
    ).run();
}

// InputMedia - 插入媒体源文件
export async function InputMedia(DB: D1Database, media: MediaSource) {
    // 单一插入操作
    await DB.prepare(`
        INSERT INTO media_source (uuid, work_uuid, is_music, 
                                 file_name, url, mime_type, info)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
        media.uuid,
        media.work_uuid,
        media.is_music ? 1 : 0,
        media.file_name,
        media.url,
        media.mime_type,
        media.info
    ).run();
}


// 用于 POST /inputwork 的请求体
export interface InputWorkRequestBody {
    work: Work;
    titles: WorkTitle[];
    license?: string | null;
    creators: CreatorWithRole[];
    wikis?: WikiRef[];
}

// 用于 POST /inputcreator 的请求体
export interface InputCreatorRequestBody {
    creator: Creator;
    wikis?: WikiRef[];
}

// 用于 POST /inputasset 的请求体
export interface InputAssetRequestBody {
    asset: Asset;
    creators?: CreatorWithRole[];
}

// 用于 POST /inputrelation 的请求体
export interface InputRelationRequestBody {
    uuid: string;
    from_work_uuid: string;
    to_work_uuid: string;
    relation_type: WorkRelation['relation_type'];
}

// 用于 POST /inputmedia 的请求体
export interface InputMediaRequestBody {
    uuid: string;
    work_uuid: string;
    is_music: boolean;
    file_name: string;
    url: string;
    mime_type: string;
    info: string;
}

// 用于删除操作的请求体
export interface DeleteCreatorRequestBody {
    creator_uuid: string;
}

export interface DeleteWorkRequestBody {
    work_uuid: string;
}

export interface DeleteMediaRequestBody {
    media_uuid: string;
}

export interface DeleteAssetRequestBody {
    asset_uuid: string;
}

export interface DeleteRelationRequestBody {
    relation_uuid: string;
}
// DeleteCreator - 删除创作者及其所有相关信息
export async function DeleteCreator(DB: D1Database, creatorUUID: string): Promise<boolean> {
    // 1. 验证UUID格式
    if (!(await UUIDCheck(creatorUUID))) {
        return false;
    }
    
    // 2. 检查创作者是否存在
    const existsResult = await DB.prepare(`
        SELECT uuid FROM creator WHERE uuid = ?
    `).bind(creatorUUID).first();
    
    if (!existsResult) {
        return false;
    }
    
    // 3. 删除创作者（级联删除会自动处理相关表）
    // 级联删除范围：creator_wiki, work_creator, asset_creator
    const result = await DB.prepare(`
        DELETE FROM creator WHERE uuid = ?
    `).bind(creatorUUID).run();
    
    return result.success;
}
// DeleteWork - 递归删除作品及其所有相关信息
export async function DeleteWork(DB: D1Database, workUUID: string): Promise<boolean> {
    // 1. 验证UUID格式
    if (!(await UUIDCheck(workUUID))) {
        return false;
    }
    
    // 2. 检查作品是否存在
    const existsResult = await DB.prepare(`
        SELECT uuid FROM work WHERE uuid = ?
    `).bind(workUUID).first();
    
    if (!existsResult) {
        return false;
    }
    
    // 3. 删除作品（级联删除会自动处理所有相关表）
    // 级联删除范围：work_title, work_license, work_wiki, work_creator,
    //              media_source, asset, asset_creator, work_relation
    const result = await DB.prepare(`
        DELETE FROM work WHERE uuid = ?
    `).bind(workUUID).run();
    
    return result.success;
}
// DeleteMedia - 删除指定媒体源
export async function DeleteMedia(DB: D1Database, mediaUUID: string): Promise<boolean> {
    // 1. 验证UUID格式
    if (!(await UUIDCheck(mediaUUID))) {
        return false;
    }
    
    // 2. 删除媒体源
    const result = await DB.prepare(`
        DELETE FROM media_source WHERE uuid = ?
    `).bind(mediaUUID).run();
    
    return result.success && (result.meta.changes as number) > 0;
}

// DeleteAsset - 删除资产及其创作者关联
export async function DeleteAsset(DB: D1Database, assetUUID: string): Promise<boolean> {
    // 1. 验证UUID格式
    if (!(await UUIDCheck(assetUUID))) {
        return false;
    }
    
    // 2. 删除资产（级联删除会自动处理 asset_creator 表）
    const result = await DB.prepare(`
        DELETE FROM asset WHERE uuid = ?
    `).bind(assetUUID).run();
    
    return result.success && (result.meta.changes as number) > 0;
}

// DeleteRelation - 删除作品关系
export async function DeleteRelation(DB: D1Database, relationUUID: string): Promise<boolean> {
    // 1. 验证UUID格式
    if (!(await UUIDCheck(relationUUID))) {
        return false;
    }
    
    // 2. 删除作品关系
    const result = await DB.prepare(`
        DELETE FROM work_relation WHERE uuid = ?
    `).bind(relationUUID).run();
    
    return result.success && (result.meta.changes as number) > 0;
}

// DeleteWorksByCreator - 删除指定创作者的所有作品
export async function DeleteWorksByCreator(DB: D1Database, creatorUUID: string): Promise<number> {
    // 1. 验证UUID格式
    if (!(await UUIDCheck(creatorUUID))) {
        return 0;
    }
    
    // 2. 获取创作者参与的所有作品
    const worksResult = await DB.prepare(`
        SELECT DISTINCT work_uuid 
        FROM work_creator 
        WHERE creator_uuid = ?
    `).bind(creatorUUID).all<{ work_uuid: string }>();
    
    const workUUIDs = worksResult.results || [];
    let deletedCount = 0;
    
    // 3. 逐个删除作品
    for (const { work_uuid } of workUUIDs) {
        const success = await DeleteWork(DB, work_uuid);
        if (success) deletedCount++;
    }
    
    return deletedCount;
}

// Update Request Body Interfaces
export interface UpdateWorkRequestBody extends InputWorkRequestBody {
    work_uuid: string;
}

export interface UpdateCreatorRequestBody extends InputCreatorRequestBody {
    creator_uuid: string;
}

export interface UpdateAssetRequestBody extends InputAssetRequestBody {
    asset_uuid: string;
}

export interface UpdateRelationRequestBody extends InputRelationRequestBody {
    relation_uuid: string;
}

export interface UpdateMediaRequestBody extends InputMediaRequestBody {
    media_uuid: string;
}

// Update Functions

export async function UpdateCreator(DB: D1Database, creator_uuid: string, creator: Creator, wikis?: WikiRef[]): Promise<boolean> {
    if (!(await UUIDCheck(creator_uuid))) return false;

    const statements: D1PreparedStatement[] = [];

    // Update creator table
    statements.push(
        DB.prepare(`
            UPDATE creator 
            SET name = ?, type = ?, voicelib = ?
            WHERE uuid = ?
        `).bind(creator.name, creator.type, creator.voicelib, creator_uuid)
    );

    // Delete old wiki entries
    statements.push(
        DB.prepare(`DELETE FROM creator_wiki WHERE creator_uuid = ?`).bind(creator_uuid)
    );

    // Insert new wiki entries
    if (wikis && wikis.length > 0) {
        wikis.forEach(wiki => {
            statements.push(
                DB.prepare(`
                    INSERT INTO creator_wiki (creator_uuid, platform, identifier)
                    VALUES (?, ?, ?)
                `).bind(creator_uuid, wiki.platform, wiki.identifier)
            );
        });
    }

    const results = await DB.batch(statements);
    return results.every(result => result.success);
}

export async function UpdateWork(DB: D1Database, work_uuid: string, work: Work, titles: WorkTitle[], license: string | null, creators: CreatorWithRole[], wikis?: WikiRef[]): Promise<boolean> {
    if (!(await UUIDCheck(work_uuid))) return false;

    const statements: D1PreparedStatement[] = [];

    // Update work table
    statements.push(
        DB.prepare(`
            UPDATE work 
            SET copyright_basis = ?
            WHERE uuid = ?
        `).bind(work.copyright_basis, work_uuid)
    );

    // Delete and re-insert titles, license, creators, and wikis
    statements.push(DB.prepare(`DELETE FROM work_title WHERE work_uuid = ?`).bind(work_uuid));
    titles.forEach(title => {
        statements.push(
            DB.prepare(`
                INSERT INTO work_title (work_uuid, is_official, language, title)
                VALUES (?, ?, ?, ?)
            `).bind(work_uuid, title.is_official ? 1 : 0, title.language, title.title)
        );
    });

    statements.push(DB.prepare(`DELETE FROM work_license WHERE work_uuid = ?`).bind(work_uuid));
    if (license && work.copyright_basis === 'license') {
        statements.push(
            DB.prepare(`
                INSERT INTO work_license (work_uuid, license_type)
                VALUES (?, ?)
            `).bind(work_uuid, license)
        );
    }

    statements.push(DB.prepare(`DELETE FROM work_creator WHERE work_uuid = ?`).bind(work_uuid));
    creators.forEach(c => {
        statements.push(
            DB.prepare(`
                INSERT INTO work_creator (work_uuid, creator_uuid, role)
                VALUES (?, ?, ?)
            `).bind(work_uuid, c.creator_uuid, c.role)
        );
    });

    statements.push(DB.prepare(`DELETE FROM work_wiki WHERE work_uuid = ?`).bind(work_uuid));
    if (wikis) {
        wikis.forEach(wiki => {
            statements.push(
                DB.prepare(`
                    INSERT INTO work_wiki (work_uuid, platform, identifier)
                    VALUES (?, ?, ?)
                `).bind(work_uuid, wiki.platform, wiki.identifier)
            );
        });
    }

    const results = await DB.batch(statements);
    return results.every(result => result.success);
}

export async function UpdateAsset(DB: D1Database, asset_uuid: string, asset: Asset, creators?: CreatorWithRole[]): Promise<boolean> {
    if (!(await UUIDCheck(asset_uuid))) return false;

    const statements: D1PreparedStatement[] = [];

    // Update asset table
    statements.push(
        DB.prepare(`
            UPDATE asset 
            SET file_id = ?, work_uuid = ?, asset_type = ?, file_name = ?, is_previewpic = ?, language = ?
            WHERE uuid = ?
        `).bind(
            asset.file_id,
            asset.work_uuid,
            asset.asset_type,
            asset.file_name,
            asset.is_previewpic === undefined ? null : (asset.is_previewpic ? 1 : 0),
            asset.language || null,
            asset_uuid
        )
    );

    // Delete and re-insert asset creators
    statements.push(DB.prepare(`DELETE FROM asset_creator WHERE asset_uuid = ?`).bind(asset_uuid));
    if (creators) {
        creators.forEach(c => {
            statements.push(
                DB.prepare(`
                    INSERT INTO asset_creator (asset_uuid, creator_uuid, role)
                    VALUES (?, ?, ?)
                `).bind(asset_uuid, c.creator_uuid, c.role)
            );
        });
    }

    const results = await DB.batch(statements);
    return results.every(result => result.success);
}

export async function UpdateRelation(DB: D1Database, relation_uuid: string, relation: WorkRelation): Promise<boolean> {
    if (!(await UUIDCheck(relation_uuid))) return false;

    const result = await DB.prepare(`
        UPDATE work_relation 
        SET from_work_uuid = ?, to_work_uuid = ?, relation_type = ?
        WHERE uuid = ?
    `).bind(
        relation.from_work_uuid,
        relation.to_work_uuid,
        relation.relation_type,
        relation_uuid
    ).run();

    return result.success;
}

export async function UpdateMedia(DB: D1Database, media_uuid: string, media: MediaSource): Promise<boolean> {
    if (!(await UUIDCheck(media_uuid))) return false;

    const result = await DB.prepare(`
        UPDATE media_source 
        SET work_uuid = ?, is_music = ?, file_name = ?, url = ?, mime_type = ?, info = ?
        WHERE uuid = ?
    `).bind(
        media.work_uuid,
        media.is_music ? 1 : 0,
        media.file_name,
        media.url,
        media.mime_type,
        media.info,
        media_uuid
    ).run();

    return result.success;
}


// List functions
export async function ListRelations(DB: D1Database, page: number, pageSize: number): Promise<any[]> {
    const offset = (page - 1) * pageSize;
    const { results } = await DB.prepare("SELECT * FROM work_relation LIMIT ? OFFSET ?").bind(pageSize, offset).all();
    return results || [];
}

export async function ListMedia(DB: D1Database, page: number, pageSize: number): Promise<any[]> {
    const offset = (page - 1) * pageSize;
    const { results } = await DB.prepare("SELECT * FROM media_source LIMIT ? OFFSET ?").bind(pageSize, offset).all();
    return results || [];
}

export async function ListAssets(DB: D1Database, page: number, pageSize: number): Promise<any[]> {
    const offset = (page - 1) * pageSize;
    const { results } = await DB.prepare("SELECT * FROM asset LIMIT ? OFFSET ?").bind(pageSize, offset).all();
    return results || [];
}

export async function ListWorks(DB: D1Database, page: number, pageSize: number): Promise<any[]> {
    const offset = (page - 1) * pageSize;
    const { results } = await DB.prepare("SELECT * FROM work LIMIT ? OFFSET ?").bind(pageSize, offset).all();
    return results || [];
}

export async function ListAuthors(DB: D1Database, page: number, pageSize: number): Promise<any[]> {
    const offset = (page - 1) * pageSize;
    const { results } = await DB.prepare("SELECT * FROM creator LIMIT ? OFFSET ?").bind(pageSize, offset).all();
    return results || [];
}

// Config-related functions
export async function getConfig(DB: D1Database, key: string): Promise<string | null> {
    const result = await DB.prepare(`
        SELECT value FROM config WHERE key = ?
    `).bind(key).first<{ value: string }>();
    
    return result ? result.value : null;
}

export async function setConfig(DB: D1Database, key: string, value: string): Promise<boolean> {
    const result = await DB.prepare(`
        INSERT INTO config (key, value) VALUES (?, ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `).bind(key, value).run();
    
    return result.success;
}

export async function deleteConfig(DB: D1Database, key: string): Promise<boolean> {
    const result = await DB.prepare(`
        DELETE FROM config WHERE key = ?
    `).bind(key).run();
    
    return result.success && (result.meta.changes as number) > 0;
}