import { Context } from "hono";
import { authenticator } from 'otplib';
import { getConfig, setConfig } from "./database";
import { decode, sign, verify } from 'hono/jwt'

// TOTP验证
export async function VerifyTOTPCode(DB: D1Database, code: string): Promise<boolean> {
    const secretKey = await getConfig(DB, 'TOTP_SECRET');
    if (!secretKey) return false;
    return authenticator.check(code, secretKey);
}

export async function GenerateRandKey(): Promise<string> {
    return authenticator.generateSecret();
}

export async function resetJwtSecret(DB: D1Database): Promise<void> {
    console.log('JWT_SECRET 正在被重置.');
    const newSecret = await GenerateRandKey();
    await setConfig(DB, 'JWT_SECRET', newSecret);
}
export const JWT_ALGORITHM = 'HS256';
export const JWT_EXPIRATION = 1000 * 60 * 60 * 8;
export async function GenerateJWTToken(DB: D1Database): Promise<string> {
    const secretKey = await getConfig(DB, 'JWT_SECRET')||'';
    return sign({exp: Date.now() + JWT_EXPIRATION}, secretKey, JWT_ALGORITHM);
}