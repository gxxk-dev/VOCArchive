import {
    InitDatabase, GetWorkByUUID, ExportAllTables,
    DropUserTables, GetWorkListWithPagination,
    InputAsset, InputCreator, InputMedia, InputRelation, InputWork, UUIDCheck,
    GetCreatorByUUID, GetMediaByUUID, GetAssetByUUID, GetRelationByUUID,
    InputAssetRequestBody, InputCreatorRequestBody, InputMediaRequestBody, InputRelationRequestBody, InputWorkRequestBody,
    DeleteAssetRequestBody, DeleteCreatorRequestBody, DeleteMediaRequestBody, DeleteRelationRequestBody, DeleteWorkRequestBody,
    DeleteAsset, DeleteCreator, DeleteMedia, DeleteRelation, DeleteWork, DeleteWorksByCreator,
    UpdateCreator, UpdateWork, UpdateAsset, UpdateRelation, UpdateMedia,
    UpdateWorkRequestBody, UpdateCreatorRequestBody, UpdateAssetRequestBody, UpdateRelationRequestBody, UpdateMediaRequestBody,
    ListAssets, ListAuthors, ListMedia, ListRelations, ListWorks
} from "./database";

import { VerifyCode, generateJWT, verifyJWT } from "./auth";

interface Env extends Cloudflare.Env { }

// --- Helper Functions ---

function validatePagination(page: number, pageSize: number): boolean {
    return Number.isInteger(page) && page > 0 &&
        Number.isInteger(pageSize) && pageSize > 0 && pageSize <= 100;
}

function jsonResponse(data: any, status: number = 200): Response {
    return new Response(JSON.stringify(data), {
        headers: { "Content-Type": "application/json" },
        status: status,
    });
}

function badRequest(message: string = "Bad Request"): Response {
    return new Response(message, { status: 400 });
}

function notFound(message: string = "Not Found"): Response {
    return new Response(message, { status: 404 });
}

function unauthorized(message: string = "Unauthorized"): Response {
    return new Response(message, { status: 401 });
}

// --- Route Handlers ---

type Handler = (request: Request, env: Env, params: URLSearchParams, body?: any) => Promise<Response>;


// --- GET, LIST Handlers ---

async function handleGet(request: Request, env: Env, params: URLSearchParams, route: string): Promise<Response> {
    // Special case for dbexport which doesn't need a UUID
    if (route === 'dbexport') {
        console.log(`[GET /api/get/dbexport] Received request.`);
        try {
            const tables = await ExportAllTables(env.DB);
            console.log(`[GET /api/get/dbexport] Successfully exported tables.`);
            return jsonResponse(tables);
        } catch (error: any) {
            console.error(`[GET /api/get/dbexport] Error exporting tables: ${error.message}`);
            return new Response("Internal Server Error while exporting database.", { status: 500 });
        }
    }

    const uuid = params.get("uuid");
    if (!uuid || !(await UUIDCheck(uuid))) {
        return badRequest("Missing or invalid 'uuid' parameter.");
    }

    let data;
    switch (route) {
        case 'work':
            try {
                data = await GetWorkByUUID(env.DB, uuid);
                if (data) {
                    console.log(`[GET /api/get/work] Successfully found work for UUID: ${uuid}`);
                } else {
                    console.log(`[GET /api/get/work] Work not found for UUID: ${uuid}`);
                }
            } catch (error: any) {
                console.error(`[GET /api/get/work] Error fetching work for UUID: ${uuid}. Error: ${error.message}`);
                return new Response("Internal Server Error while fetching work.", { status: 500 });
            }
            break;
        case 'creator':
            data = await GetCreatorByUUID(env.DB, uuid);
            break;
        case 'media':
            data = await GetMediaByUUID(env.DB, uuid);
            break;
        case 'asset':
            data = await GetAssetByUUID(env.DB, uuid);
            break;
        case 'relation':
            data = await GetRelationByUUID(env.DB, uuid);
            break;
        default:
            return notFound();
    }
    
    return data ? jsonResponse(data) : notFound();
}

async function handleList(request: Request, env: Env, params: URLSearchParams, route: string): Promise<Response> {
    const page = parseInt(params.get("page") ?? "1", 10);
    const pageSize = parseInt(params.get("pageSize") ?? "10", 10);

    if (!validatePagination(page, pageSize)) {
        return badRequest("Invalid 'page' or 'pageSize' parameter. 'page' must be > 0 and 'pageSize' must be > 0 and <= 100.");
    }

    let data;
    switch (route) {
        case 'relation':
            data = await ListRelations(env.DB, page, pageSize);
            break;
        case 'media':
            data = await ListMedia(env.DB, page, pageSize);
            break;
        case 'asset':
            data = await ListAssets(env.DB, page, pageSize);
            break;
        case 'works':
            data = await GetWorkListWithPagination(env.DB, page, pageSize);
            break;
        case 'authors':
            data = await ListAuthors(env.DB, page, pageSize);
            break;
        default:
            return notFound();
    }
    return jsonResponse(data);
}


// --- INPUT, DELETE, UPDATE Handlers (POST) ---

async function handleInput(request: Request, env: Env, params: URLSearchParams, body: any, route: string): Promise<Response> {
    switch (route) {
        case 'work':
            await InputWork(env.DB, (body as InputWorkRequestBody).work, (body as InputWorkRequestBody).titles || [], (body as InputWorkRequestBody).license || null, (body as InputWorkRequestBody).creators || [], (body as InputWorkRequestBody).wikis || []);
            return new Response("Work added successfully.", { status: 200 });
        case 'creator':
            await InputCreator(env.DB, (body as InputCreatorRequestBody).creator, (body as InputCreatorRequestBody).wikis || []);
            return new Response("Creator added successfully.", { status: 200 });
        case 'asset':
            await InputAsset(env.DB, (body as InputAssetRequestBody).asset, (body as InputAssetRequestBody).creators || []);
            return new Response("Asset added successfully.", { status: 200 });
        case 'relation':
            await InputRelation(env.DB, body as InputRelationRequestBody);
            return new Response("Work relation added successfully.", { status: 200 });
        case 'media':
            await InputMedia(env.DB, body as InputMediaRequestBody);
            return new Response("Media source added successfully.", { status: 200 });
        case 'dbinit':
            await InitDatabase(env.DB);
            return new Response("OK.");
        default:
            return notFound();
    }
}

async function handleDelete(request: Request, env: Env, params: URLSearchParams, body: any, route: string): Promise<Response> {
    let deleted = false;
    switch (route) {
        case 'creator':
            deleted = await DeleteCreator(env.DB, (body as DeleteCreatorRequestBody).creator_uuid);
            return deleted ? new Response("Creator deleted successfully.", { status: 200 }) : notFound("Creator not found or delete failed.");
        case 'work':
            deleted = await DeleteWork(env.DB, (body as DeleteWorkRequestBody).work_uuid);
            return deleted ? new Response("Work deleted successfully.", { status: 200 }) : notFound("Work not found or delete failed.");
        case 'media':
            deleted = await DeleteMedia(env.DB, (body as DeleteMediaRequestBody).media_uuid);
            return deleted ? new Response("Media source deleted successfully.", { status: 200 }) : notFound("Media source not found or delete failed.");
        case 'asset':
            deleted = await DeleteAsset(env.DB, (body as DeleteAssetRequestBody).asset_uuid);
            return deleted ? new Response("Asset deleted successfully.", { status: 200 }) : notFound("Asset not found or delete failed.");
        case 'relation':
            deleted = await DeleteRelation(env.DB, (body as DeleteRelationRequestBody).relation_uuid);
            return deleted ? new Response("Work relation deleted successfully.", { status: 200 }) : notFound("Work relation not found or delete failed.");
        case 'worksbycreator':
            const deletedCount = await DeleteWorksByCreator(env.DB, (body as DeleteCreatorRequestBody).creator_uuid);
            return new Response(`Successfully deleted ${deletedCount} works.`, { status: 200 });
        case 'dbclear':
            await DropUserTables(env.DB);
            return new Response("OK.");
        default:
            return notFound();
    }
}

async function handleUpdate(request: Request, env: Env, params: URLSearchParams, body: any, route: string): Promise<Response> {
    let updated = false;
    switch (route) {
        case 'creator':
            const creatorBody = body as UpdateCreatorRequestBody;
            updated = await UpdateCreator(env.DB, creatorBody.creator_uuid, creatorBody.creator, creatorBody.wikis);
            return updated ? new Response("Creator updated successfully.", { status: 200 }) : notFound("Creator not found or update failed.");
        case 'work':
            const workBody = body as UpdateWorkRequestBody;
            console.log(workBody);
            updated = await UpdateWork(env.DB, workBody.work_uuid, workBody.work, workBody.titles, workBody.license || null, workBody.creators, workBody.wikis);
            console.log(updated)
            return updated ? new Response("Work updated successfully.", { status: 200 }) : notFound("Work not found or update failed.");
        case 'asset':
            const assetBody = body as UpdateAssetRequestBody;
            updated = await UpdateAsset(env.DB, assetBody.asset_uuid, assetBody.asset, assetBody.creators);
            return updated ? new Response("Asset updated successfully.", { status: 200 }) : notFound("Asset not found or update failed.");
        case 'relation':
            const relationBody = body as UpdateRelationRequestBody;
            updated = await UpdateRelation(env.DB, relationBody.relation_uuid, relationBody);
            return updated ? new Response("Work relation updated successfully.", { status: 200 }) : notFound("Work relation not found or update failed.");
        case 'media':
            const mediaBody = body as UpdateMediaRequestBody;
            updated = await UpdateMedia(env.DB, mediaBody.media_uuid, mediaBody);
            return updated ? new Response("Media source updated successfully.", { status: 200 }) : notFound("Media source not found or update failed.");
        default:
            return notFound();
    }
}


// --- Auth Handler ---

async function handleAuth(request: Request, env: Env, params: URLSearchParams, body: any, route: string): Promise<Response> {
    if (route !== 'login') {
        return notFound("Invalid auth route.");
    }

    const { code } = body;
    if (!code) {
        return badRequest("Missing 'code' in request body.");
    }

    const storedCode = await env.KV.get("code");
    if (!storedCode || !(await VerifyCode(code, storedCode))) {
        return unauthorized("Invalid code.");
    }

    // Code is valid, generate a JWT
    try {
        const token = await generateJWT(env);
        return jsonResponse({ token: token });
    } catch (error: any) {
        console.error("JWT generation failed:", error);
        return new Response("Could not generate token.", { status: 500 });
    }
}


// --- Router ---

async function routeRequest(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const method = request.method.toUpperCase();
    const pathSegments = url.pathname.split('/').filter(Boolean); // e.g., ["api", "get", "work"]

    if (pathSegments.length < 2 || pathSegments[0] !== 'api') { // Adjusted for routes like /api/auth
        return notFound();
    }

    const category = pathSegments[1]; // "get", "input", "delete", "list", "auth"
    const route = pathSegments[2];    // "work", "creator", "login", etc.

    if (method === "GET") {
        switch (category) {
            case 'get':
                if (pathSegments.length < 3) return notFound();
                return handleGet(request, env, url.searchParams, route);
            case 'list':
                 if (pathSegments.length < 3) return notFound();
                return handleList(request, env, url.searchParams, route);
            default:
                return notFound("Invalid API category for GET request.");
        }
    }

    if (method === "POST") {
        // Auth route is public and doesn't need JWT verification
        if (category === 'auth') {
             if (pathSegments.length < 3) return notFound();
            try {
                const body = await request.json();
                return handleAuth(request, env, url.searchParams, body, route);
            } catch (e) {
                return badRequest("Invalid JSON body.");
            }
        }

        // All other POST routes are protected
        const authHeader = request.headers.get("Authorization");
        const token = authHeader?.split(' ')[1];

        if (!token || !(await verifyJWT(env, token))) {
            return unauthorized("Invalid or missing token.");
        }

        try {
            const body = await request.json();
            switch (category) {
                case 'input':
                    if (pathSegments.length < 3) return notFound();
                    return handleInput(request, env, url.searchParams, body, route);
                case 'delete':
                    if (pathSegments.length < 3) return notFound();
                    return handleDelete(request, env, url.searchParams, body, route);
                case 'update':
                    if (pathSegments.length < 3) return notFound();
                    return handleUpdate(request, env, url.searchParams, body, route);
                default:
                    return notFound("Invalid API category for POST request.");
            }
        } catch (error: any) {
            console.error("Error processing POST request:", error);
            return jsonResponse({
                error: "Invalid request format or body.",
                details: error.message
            }, 400);
        }
    }

    return notFound();
}

export default {
    async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
        const method = request.method.toUpperCase();
        if (method !== "GET" && method !== "POST") {
            return new Response("Method not allowed", { status: 405 });
        }
        return await routeRequest(request, env);
    },
} satisfies ExportedHandler<Env>;
