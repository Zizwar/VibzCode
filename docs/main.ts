import { Hono } from 'https://deno.land/x/hono@v3.12.8/mod.ts'
import { serveStatic } from 'https://deno.land/x/hono@v3.12.8/middleware.ts'
import { dirname, join } from 'https://deno.land/std@0.210.0/path/mod.ts'

const app = new Hono()

// Get the directory of this file
const __dirname = dirname(new URL(import.meta.url).pathname)

// Serve static files from current directory
app.use('/*', serveStatic({ root: __dirname }))

// Fallback to index.html for SPA
app.get('/*', (c) => {
  const indexPath = join(__dirname, 'index.html')
  return c.html(Deno.readTextFileSync(indexPath))
})

Deno.serve(app.fetch)
