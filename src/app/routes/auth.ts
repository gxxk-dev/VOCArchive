import { Hono } from 'hono'
import { 
    VerifyCode,
    generateJWT,
    setTotpSecret,
    generateTotpUri,
    resetAndReturnJwtSecret,
} from '../../auth'
import { InitDatabase, DropUserTables } from '../../database'
import { badRequest, json, unauthorized } from '../utils'

const auth = new Hono<{ Bindings: Cloudflare.Env }>()

// 登录
auth.post('/login', async (c) => {
    const { code } = await c.req.json()
    if (!code) {
        return badRequest(c, 'Missing \'code\' in request body.')
    }

    if (!(await VerifyCode(c.env.DB, code))) {
        return unauthorized(c, 'Invalid code.')
    }
    // Code is valid, generate a JWT
    try {
        const token = await generateJWT(c.env.DB)
        return json(c, { token: token })
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
        await setTotpSecret(c.env.DB, newTotpKey)
        // 生成OTP URI
        const otpAuthUri = await generateTotpUri(newTotpKey, 'Admin', 'VOCArch1ve')
        return json(c, { otpAuthUri: otpAuthUri })
    } catch (error: any) {
        console.error('Authorization secrets reset failed:', error)
        return c.text('Could not reset authorization secrets.', 500)
    }
})

// 重置JWT密钥
auth.post('/reset-jwt-secret', async (c) => {
    try {
        const newSecret = await resetAndReturnJwtSecret(c.env.DB)
        return json(c, { new_secret: newSecret })
    } catch (error: any) {
        console.error('JWT secret reset failed:', error)
        return c.text('Could not reset JWT secret.', 500)
    }
})

// 重置数据库
auth.post('/reset', async (c) => {
    const { current_code, new_code } = await c.req.json()
    if (!current_code || !new_code) {
        return badRequest(c, 'Missing \'current_code\' or \'new_code\' in request body.')
    }
    // 从D1验证当前代码
    if (!(await VerifyCode(c.env.DB, current_code))) {
        return unauthorized(c, 'Invalid current code.')
    }
    try {
        await DropUserTables(c.env.DB)
        await InitDatabase(c.env.DB)

        // 存储新代码到D1
        await setTotpSecret(c.env.DB, new_code)

        const qr_code = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(
            new_code
        )}&size=200x200`
        return json(c, { qr_code: qr_code })
    } catch (error: any) {
        console.error('Database reset failed:', error)
        return c.text('Could not reset database.', 500)
    }
})

export { auth as authRoutes }