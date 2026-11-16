import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { auth } from "../lib/auth.js"
import { apiHandler } from './routes'
import { MyError } from '../lib/myerror.js'

const app = new Hono()

.get('/', (c) => {
  return c.text('Hello Hono!')
})
.route('/api', apiHandler)
.all("/api/auth/*", (c) => auth.handler(c.req.raw))

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
export const AppType = typeof app;

serve({
  fetch: app.fetch,
  port: 8000
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`);
})
