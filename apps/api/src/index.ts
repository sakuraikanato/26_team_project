import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { auth, webOrigins } from "../lib/auth.js"
import { apiHandler } from './routes/index.js'
import { MyError } from '../lib/myerror.js'

const app = new Hono()

// フロント（別ポート）から Cookie つきで呼べるようにする
.use('/api/*', cors({
  origin: webOrigins,
  credentials: true,
  allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type'],
}))
.get('/', (c) => {
  return c.text('Hello Hono!')
})
// 自前のルート（/api/v1/auth/me など）。better-auth より先に登録する
.route('/api/v1', apiHandler)
// ログイン・ログアウトなど better-auth の処理
.on(['GET', 'POST'], '/api/v1/auth/*', (c) => auth.handler(c.req.raw))

.onError((err, c) => {
  if (err instanceof MyError) {
    return c.json(err.response())
  }
  return c.json({
    code: "INTERNAL_ERROR",
    message: "予期せぬエラーが発生しました"
  }, 500)
})

export default app;
// フロントの Hono RPC クライアント（hc<AppType>）で使う型
export type AppType = typeof app;

serve({
  fetch: app.fetch,
  port: 8000
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`);
})
