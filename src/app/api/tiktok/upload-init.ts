import type { NextApiRequest, NextApiResponse } from 'next';
import fetch from 'node-fetch';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { access_token, title, video_size, chunk_size, total_chunk_count } = req.body;
  const response = await fetch('https://open.tiktokapis.com/v2/post/publish/video/init/', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json; charset=UTF-8',
    },
    body: JSON.stringify({
      post_info: { title },
      source_info: {
        source: 'FILE_UPLOAD',
        video_size,
        chunk_size,
        total_chunk_count,
      },
    }),
  });
  const data = await response.json();
  res.status(response.status).json(data);
} 