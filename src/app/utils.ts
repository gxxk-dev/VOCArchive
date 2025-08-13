import { Context } from 'hono'

export function json(c: Context, data: any, status: number = 200) {
    return c.json(data, status)
}

export function badRequest(c: Context, message: string = 'Bad Request') {
    return c.text(message, 400)
}

export function unauthorized(c: Context, message: string = 'Unauthorized') {
    return c.text(message, 401)
}
