import { Context } from "hono";
import { authenticator } from 'otplib';
import { sign } from 'hono/jwt'

// TOTP验证
export async function VerifyTOTPCode(c: Context, code: string): Promise<boolean> {
    const secretKey = c.env.TOTP_SECRET as string;
    if (!secretKey) return false;
    return authenticator.check(code, secretKey);
}

export const JWT_ALGORITHM = 'HS256';
export const JWT_EXPIRATION = 1000 * 60 * 60 * 8;
export async function GenerateJWTToken(c: Context): Promise<string> {
    const secretKey = c.env.JWT_SECRET as string;
    return sign({exp: Date.now() + JWT_EXPIRATION}, secretKey, JWT_ALGORITHM);
}