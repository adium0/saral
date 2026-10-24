import { handleAi, rateLimited } from './_lib/aiCore.js';

// Vercel serverless function: POST /api/ai
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method' });
    return;
  }
  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  if (rateLimited(ip)) {
    res.status(429).json({ error: 'rate_limited', message: 'Too many requests. Try again in a few minutes.' });
    return;
  }
  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body;
  const out = await handleAi(body, process.env);
  res.status(out.status).json(out.body);
}
