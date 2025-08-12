import { Context } from "hono";
import { authenticator } from 'otplib';
import { getConfig, setConfig } from "./database";
import { verify } from 'hono/jwt';
import { createMiddleware } from 'hono/factory'

// 后台登录-中间件
export const middleware_Auth = createMiddleware(async (c, next) => {
    if (!verify(c.req.header('Authorization')||'',await getConfig(c.env.DB,"JWT_SECRET")||'')) return c.json("Unauthorized",401);
    await next();
})

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
const JWT_ALGORITHM = 'HS256';
const JWT_EXPIRATION = '8h';
