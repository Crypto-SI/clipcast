import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { access_token } = await req.json();
    
    if (!access_token) {
      return Response.json({ error: 'Missing access_token' }, { status: 400 });
    }

    const response = await fetch('https://open.tiktokapis.com/v2/post/publish/creator_info/query/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json; charset=UTF-8',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('TikTok creator info failed:', data);
      return Response.json({ error: data.error || 'Creator info failed' }, { status: response.status });
    }

    return Response.json(data);
  } catch (error) {
    console.error('Creator info error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
} 