import { Hono } from 'hono'
import { 
    VerifyTOTPCode,
    GenerateJWTToken,
} from '../auth'
import { setConfig } from '../database'
export const auth = new Hono<{ Bindings: Cloudflare.Env }>()

// 登录
auth.post('/login', async (c) => {
    const { code } = await c.req.json()
    if (!code) return c.text('Missing code.', 400)

    if (!(await VerifyTOTPCode(c.env.DB, code))) return c.text('Invalid code.', 400)
    // Code is valid, generate a JWT
    try {
        const token = await GenerateJWTToken(c.env.DB)
        return c.json({ token }, 200)
    } catch (error: any) {
        console.error('JWT generation failed:', error)
        return c.text('Could not generate token.', 500)
    }
})

// 重置TOTP密钥
auth.post('/reset-secrets', async (c) => {
    try {
        // 使用D1存储TOTP密钥
        const newTotpKey = Math.random().toString(36).substring(2)

        // 存储新密钥到D1
        await setConfig(c.env.DB, "TOTP_SECRET", newTotpKey)
        // 生成OTP URI
        const otpAuthUri = `otpauth://totp/VOCArchive:Admin?secret=${newTotpKey}&issuer=VOCArchive&period=30&digits=6&algorithm=SHA1`
        return c.json({ otpAuthUri }, 200)
    } catch (error: any) {
        console.error('Authorization secrets reset failed:', error)
        return c.text('Could not reset authorization secrets.', 500)
    }
})