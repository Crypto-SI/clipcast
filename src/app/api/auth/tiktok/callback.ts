import type { NextApiRequest, NextApiResponse } from 'next';
import fetch from 'node-fetch';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { code, state } = req.query;
  const cookies = req.headers.cookie || '';
  const csrfState = cookies.split('; ').find(c => c.startsWith('tiktok_csrf_state='))?.split('=')[1];
  if (state !== csrfState) return res.status(400).send('Invalid state');

  const params = new URLSearchParams({
    client_key: process.env.TIKTOK_CLIENT_KEY!,
    client_secret: process.env.TIKTOK_CLIENT_SECRET!,
    code: code as string,
    grant_type: 'authorization_code',
    redirect_uri: process.env.TIKTOK_REDIRECT_URI!,
  });

  const response = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params,
  });
  const data = await response.json();
  // TODO: Save data.access_token, data.refresh_token, data.open_id, etc. to your DB/session
  res.status(200).json(data);
} 