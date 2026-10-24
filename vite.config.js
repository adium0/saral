import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, loadEnv } from 'vite';
import { handleAi, rateLimited } from './api/_lib/aiCore.js';

// Serves POST /api/ai during `npm run dev` with the same code the deployed function uses.
function devAiApi(env) {
  return {
    name: 'saral-dev-ai',
    configureServer(server) {
      server.middlewares.use('/api/ai', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          return res.end();
        }
        let raw = '';
        for await (const chunk of req) raw += chunk;
        const out = rateLimited(req.socket.remoteAddress || 'dev')
          ? { status: 429, body: { error: 'rate_limited' } }
          : await handleAi(JSON.parse(raw || '{}'), env);
        res.statusCode = out.status;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(out.body));
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = { ...process.env, ...loadEnv(mode, process.cwd(), '') };
  return {
    plugins: [react(), tailwindcss(), devAiApi(env)],
  };
});
