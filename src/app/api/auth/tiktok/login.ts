// If you see type errors for 'process', ensure you have @types/node installed: npm i --save-dev @types/node
// If you see type errors for Next.js API types, you can use (req: any, res: any) for compatibility.

export default function handler(req: any, res: any) {
  const state = Math.random().toString(36).substring(2);
  res.setHeader('Set-Cookie', `tiktok_csrf_state=${state}; HttpOnly; Path=/; Max-Age=600`);
  const params = new URLSearchParams({
    client_key: process.env.TIKTOK_CLIENT_KEY!,
    response_type: 'code',
    scope: 'user.info.basic,video.upload',
    redirect_uri: process.env.TIKTOK_REDIRECT_URI!,
    state,
  });
  res.redirect(`https://www.tiktok.com/v2/auth/authorize/?${params.toString()}`);
} 