import { generateKey, getKeyUri, totp, exportKey, SecretKey } from "otp-io";
import { hmac, randomBytes } from "otp-io/crypto";
import * as jose from 'jose';
import { getConfig, setConfig } from './database';

export async function getTotpSecret(DB: D1Database): Promise<string | null> {
    return await getConfig(DB, 'TOTP_SECRET');
}

export async function setTotpSecret(DB: D1Database, secret: string): Promise<boolean> {
    return await setConfig(DB, 'TOTP_SECRET', secret);
}

function getBeijingDate() {
  // 获取当前UTC时间
  const now = new Date();
  
  // 将时间格式化为目标时区的ISO字符串
  const tzString = now.toLocaleString('en-CA', {
    timeZone: 'Asia/Shanghai',
    hour12: false
  }).replace(', ', 'T') + '.000Z';

  // 用新时区字符串创建Date对象
  return new Date(tzString);
}


// 直接从D1验证TOTP代码
export async function VerifyCode(DB: D1Database, code: string): Promise<boolean> {
    const secretKey = await getTotpSecret(DB);
    if (!secretKey) return false;
    
    // 将字符串密钥转换为Uint8Array
    const encoder = new TextEncoder();
    const keyBytes = encoder.encode(secretKey);
    
    // 创建符合SecretKey类型的对象
    const secret = {
        bytes: keyBytes
    };

    const serverCode = await totp(hmac, { secret,now:getBeijingDate() ,pad:true});
    console.log("Server code:", serverCode, "Client code:", code);
    console.log("Secret key:", secretKey);
    console.log("Time:", getBeijingDate());
    return serverCode === code;
}


// 生成随机密钥
export async function GenerateRandKey(): Promise<string> {
    return exportKey(generateKey(randomBytes, 10));
}

// ... 保持其他函数不变 ...

export function generateTotpSecret() {
    return generateKey(randomBytes, 20); // 20 bytes for a robust secret
}

export async function generateTotpUri(key: SecretKey, accountName: string, issuer: string): Promise<string> {
    console.log("Generating TOTP URI with key:", key);
    return getKeyUri({
        type: "totp",
        secret: key,
        algorithm: 'sha1',
        digits: 6,
        name: accountName,
        issuer: issuer,
        stepSeconds: 30
    });
}






// --- JWT Functions ---

const JWT_ALGORITHM = 'HS256';
const JWT_EXPIRATION = '8h';

async function getJwtSecret(DB: D1Database): Promise<Uint8Array> {
    let secret = await getConfig(DB, 'JWT_SECRET');
    if (!secret) {
        console.log('JWT_SECRET not set, generating a new one.');
        secret = await GenerateRandKey();
        await setConfig(DB, 'JWT_SECRET', secret);
    }
    return new TextEncoder().encode(secret);
}

export async function resetJwtSecret(DB: D1Database): Promise<void> {
    console.log('Starting JWT_SECRET reset.');
    const newSecret = await GenerateRandKey();
    await setConfig(DB, 'JWT_SECRET', newSecret);
    console.log('JWT_SECRET has been successfully reset.');
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
