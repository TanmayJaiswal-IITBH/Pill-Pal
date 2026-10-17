import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Serves api/scan.js during `npm run dev`, so the app works locally without the Vercel CLI.
// On Vercel the same file runs as a serverless function.
function localApi() {
  return {
    name: 'pillpal-local-api',
    apply: 'serve',
    configureServer(server) {
      const env = loadEnv('development', process.cwd(), '')
      process.env.AI_API_KEY ??= env.AI_API_KEY
      if (env.TAVILY_API_KEY) process.env.TAVILY_API_KEY ??= env.TAVILY_API_KEY
      server.middlewares.use('/api/scan', async (req, res) => {
        const chunks = []
        for await (const chunk of req) chunks.push(chunk)
        let body
        try {
          body = JSON.parse(Buffer.concat(chunks).toString() || '{}')
        } catch {
          body = {}
        }
        const { default: handler } = await server.ssrLoadModule('/api/scan.js')
        const reply = {
          setHeader: (name, value) => res.setHeader(name, value),
          status(code) {
            res.statusCode = code
            return reply
          },
          json(payload) {
            res.setHeader('content-type', 'application/json')
            res.end(JSON.stringify(payload))
          },
        }
        await handler({ method: req.method, body }, reply)
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), localApi()],
})
