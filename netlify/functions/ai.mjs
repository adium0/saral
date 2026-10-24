import { handleAi, rateLimited } from '../../api/_lib/aiCore.js';

// Netlify function: POST /api/ai (see netlify.toml redirect)
export default async (req) => {
  if (req.method !== 'POST') return Response.json({ error: 'method' }, { status: 405 });
  const ip = req.headers.get('x-nf-client-connection-ip') || 'unknown';
  if (rateLimited(ip)) return Response.json({ error: 'rate_limited' }, { status: 429 });
  const body = await req.json().catch(() => ({}));
  const out = await handleAi(body, process.env);
  return Response.json(out.body, { status: out.status });
};
