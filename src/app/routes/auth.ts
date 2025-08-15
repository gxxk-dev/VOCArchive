import { Hono } from 'hono'
import { 
    VerifyTOTPCode,
    GenerateJWTToken,
} from '../auth'
export const auth = new Hono<{ Bindings: Cloudflare.Env }>()

// 登录
auth.post('/login', async (c) => {
    const { code } = await c.req.json()
    if (!code) return c.text('Missing code.', 400)
    
    if (!(await VerifyTOTPCode(c, code))) return c.text('Invalid code.', 401)
    // Code is valid, generate a JWT
    try {
        const token = await GenerateJWTToken(c)
        return c.json({ token }, 200)
    } catch (error: any) {
        console.error('JWT generation failed:', error)
        return c.text('Could not generate token.', 500)
    }
})