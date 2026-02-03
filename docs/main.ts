import { Hono } from 'https://deno.land/x/hono@v3.12.8/mod.ts'
import { serveStatic } from 'https://deno.land/x/hono@v3.12.8/middleware.ts'

const app = new Hono()

// Serve static files from current directory
app.use('/*', serveStatic({ root: './' }))

// Fallback to index.html for SPA
app.get('/*', (c) => {
  return c.html(Deno.readTextFileSync('./index.html'))
})

Deno.serve(app.fetch)
