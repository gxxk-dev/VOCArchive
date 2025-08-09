import { generateKey, getKeyUri, totp, exportKey, importKey } from "otp-io";
import { hmac, randomBytes } from "otp-io/crypto";
import * as jose from 'jose';

export async function VerifyCode(code: string, secretKey: string): Promise<boolean> {
	return await CalcTOTPCode(secretKey) === code;
}

async function CalcTOTPCode(secretKey: string): Promise<string> {
	return await totp(hmac,{secret: importKey(secretKey)})
}

export async function GenerateRandKey(): Promise<string> {
	return await CalcTOTPCode(exportKey(generateKey(randomBytes,10)));
}

// --- JWT Functions ---

const JWT_ALGORITHM = 'HS256';
const JWT_EXPIRATION = '8h';

async function getJwtSecret(env: any): Promise<Uint8Array> {
    const secret = env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET environment variable not set');
    }
    return new TextEncoder().encode(secret);
}

export async function generateJWT(env: any): Promise<string> {
    const secret = await getJwtSecret(env);
    const jwt = await new jose.SignJWT({})
        .setProtectedHeader({ alg: JWT_ALGORITHM })
        .setIssuedAt()
        .setExpirationTime(JWT_EXPIRATION)
        .sign(secret);
    return jwt;
}

export async function verifyJWT(env: any, token: string): Promise<boolean> {
    try {
        const secret = await getJwtSecret(env);
        await jose.jwtVerify(token, secret);
        return true;
    } catch (error) {
        console.error("JWT Verification failed:", error);
        return false;
    }
}
