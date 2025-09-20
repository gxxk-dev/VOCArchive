import { Context } from "hono";
import { authenticator } from 'otplib';
import { sign } from 'hono/jwt'
import { createDrizzleClient } from './db/client';
import { getSiteConfig } from './db/operations/config';

// TOTP验证
export async function VerifyTOTPCode(c: Context, code: string): Promise<boolean> {
    try {
        const db = createDrizzleClient(c.env.DB);
        const config = await getSiteConfig(db, 'totp_secret');
        const secretKey = config?.value || c.env.TOTP_SECRET as string;
        if (!secretKey) return false;
        return authenticator.check(code, secretKey);
    } catch (error) {
        console.error('Error verifying TOTP:', error);
        // Fallback to environment variable
        const secretKey = c.env.TOTP_SECRET as string;
        if (!secretKey) return false;
        return authenticator.check(code, secretKey);
    }
}

export const JWT_ALGORITHM = 'HS256';
export const JWT_EXPIRATION = 1000 * 60 * 60 * 8;
export async function GenerateJWTToken(c: Context): Promise<string> {
    try {
        const db = createDrizzleClient(c.env.DB);
        const config = await getSiteConfig(db, 'jwt_secret');
        const secretKey = config?.value || c.env.JWT_SECRET as string;
        return sign({exp: Date.now() + JWT_EXPIRATION}, secretKey, JWT_ALGORITHM);
    } catch (error) {
        console.error('Error generating JWT:', error);
        // Fallback to environment variable
        const secretKey = c.env.JWT_SECRET as string;
        return sign({exp: Date.now() + JWT_EXPIRATION}, secretKey, JWT_ALGORITHM);
    }
}