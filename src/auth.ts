import { authenticator } from 'otplib';
import * as jose from 'jose';
import { getConfig, setConfig } from './database';

// ---------- TOTP Functions ----------

export async function getTotpSecret(DB: D1Database): Promise<string | null> {
    return await getConfig(DB, 'TOTP_SECRET');
}

export async function setTotpSecret(DB: D1Database, secret: string): Promise<boolean> {
    return await setConfig(DB, 'TOTP_SECRET', secret);
}

export async function GenerateRandKey(): Promise<string> {
    return authenticator.generateSecret();
}

export async function VerifyCode(DB: D1Database, code: string): Promise<boolean> {
    const secretKey = await getTotpSecret(DB);
    if (!secretKey) return false;
    return authenticator.check(code, secretKey);
}

export async function generateTotpUri(key: string, accountName: string, issuer: string): Promise<string> {
    console.log("Generating TOTP URI with key:", key);
    return authenticator.keyuri(accountName, issuer, key);
}


// --- JWT Functions ---

const JWT_ALGORITHM = 'HS256';
const JWT_EXPIRATION = '8h';

async function getJwtSecret(DB: D1Database): Promise<Uint8Array> {
    let secret = await getConfig(DB, 'JWT_SECRET');
    if (!secret) {
        console.log('JWT_SECRET 未设置 将自动生成并写入配置.');
        secret = await GenerateRandKey();
        await setConfig(DB, 'JWT_SECRET', secret);
    }
    return new TextEncoder().encode(secret);
}

export async function resetJwtSecret(DB: D1Database): Promise<void> {
    console.log('JWT_SECRET 正在被重置.');
    const newSecret = await GenerateRandKey();
    await setConfig(DB, 'JWT_SECRET', newSecret);
}

export async function resetAndReturnJwtSecret(DB: D1Database): Promise<string> {
    console.log('Starting JWT_SECRET reset and return.');
    const newSecret = await GenerateRandKey();
    await setConfig(DB, 'JWT_SECRET', newSecret);
    console.log('JWT_SECRET has been successfully reset.');
    return newSecret;
}

export async function generateJWT(DB: D1Database): Promise<string> {
    // 从数据库获取JWT密钥
    const secret = await getJwtSecret(DB);
    // 创建并签名JWT令牌
    const jwt = await new jose.SignJWT({})
        .setProtectedHeader({ alg: JWT_ALGORITHM }) // 设置保护头，指定算法
        .setIssuedAt() // 设置签发时间
        .setExpirationTime(JWT_EXPIRATION) // 设置过期时间
        .sign(secret); // 使用密钥签名
    return jwt; // 返回生成的JWT令牌
}

export async function verifyJWT(DB: D1Database, token: string): Promise<boolean> {
    try {
        const secret = await getJwtSecret(DB);
        await jose.jwtVerify(token, secret);
        return true;
    } catch (error) {
        console.error("JWT Verification failed:", error);
        return false;
    }
}
