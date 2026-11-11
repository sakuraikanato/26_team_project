import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { auth } from '../lib/auth';
import { apiHandler } from './routes';

const app = new Hono()

.get('/', (c) => {
  return c.text('Hello Hono!')
})
.route('/api', apiHandler)
.all("/api/auth/*", (c) => auth.handler(c.req.raw))

export default app;
export const AppType = typeof app;

serve({
  fetch: app.fetch,
  port: 8000
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`);
})
