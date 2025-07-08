import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const clientKey = process.env.TIKTOK_CLIENT_KEY;
    const clientSecret = process.env.TIKTOK_CLIENT_SECRET;
    
    if (!clientKey || !clientSecret) {
      return NextResponse.json({ 
        error: 'TikTok credentials not configured',
        clientKey: !!clientKey,
        clientSecret: !!clientSecret
      }, { status: 500 });
    }

    // Test client credentials by getting a client access token
    const tokenResponse = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cache-Control': 'no-cache'
      },
      body: new URLSearchParams({
        client_key: clientKey,
        client_secret: clientSecret,
        grant_type: 'client_credentials'
      })
    });

    const tokenData = await tokenResponse.json();
    
    if (tokenResponse.ok) {
      return NextResponse.json({
        success: true,
        message: 'Client credentials are valid',
        clientKey: clientKey,
        tokenType: tokenData.token_type,
        expiresIn: tokenData.expires_in
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Client credentials test failed',
        clientKey: clientKey,
        response: tokenData
      }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({ 
      error: 'Test failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 