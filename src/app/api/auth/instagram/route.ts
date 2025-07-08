import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Instagram OAuth 2.0 Configuration
const INSTAGRAM_APP_ID = process.env.INSTAGRAM_APP_ID;
const INSTAGRAM_APP_SECRET = process.env.INSTAGRAM_APP_SECRET;
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002';

// Instagram API endpoints
const INSTAGRAM_AUTH_URL = 'https://www.instagram.com/oauth/authorize';
const INSTAGRAM_TOKEN_URL = 'https://api.instagram.com/oauth/access_token';
const INSTAGRAM_LONG_TOKEN_URL = 'https://graph.instagram.com/access_token';

// Required Instagram permissions for content publishing
const INSTAGRAM_SCOPES = [
  'instagram_business_basic',
  'instagram_business_content_publish',
  'instagram_business_manage_messages',
  'instagram_business_manage_comments'
].join(',');

export async function GET(request: NextRequest) {
  try {
    console.log('Instagram OAuth: Starting authorization flow');

    // Validate environment variables
    if (!INSTAGRAM_APP_ID || !INSTAGRAM_APP_SECRET) {
      console.error('Instagram OAuth: Missing required environment variables');
      return NextResponse.json(
        { error: 'Instagram authentication not configured' },
        { status: 500 }
      );
    }

    // Generate state parameter for CSRF protection
    const state = generateRandomString(32);
    const redirect_uri = `${BASE_URL}/api/auth/instagram/callback`;

    // Store state in secure cookie for validation
    const cookieStore = await cookies();
    cookieStore.set('instagram_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
      path: '/'
    });

    // Build Instagram authorization URL
    const authUrl = new URL(INSTAGRAM_AUTH_URL);
    authUrl.searchParams.set('client_id', INSTAGRAM_APP_ID);
    authUrl.searchParams.set('redirect_uri', redirect_uri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', INSTAGRAM_SCOPES);
    authUrl.searchParams.set('state', state);

    console.log('Instagram OAuth: Generated authorization URL', {
      app_id: INSTAGRAM_APP_ID,
      redirect_uri,
      scopes: INSTAGRAM_SCOPES.split(','),
      state: state.substring(0, 8) + '...'
    });

    // Return the authorization URL for frontend to handle
    return NextResponse.json({
      authUrl: authUrl.toString(),
      message: 'Instagram authorization URL generated successfully'
    });

  } catch (error) {
    console.error('Instagram OAuth: Error in authorization flow:', error);
    return NextResponse.json(
      { error: 'Failed to initialize Instagram authentication' },
      { status: 500 }
    );
  }
}

// Simple login endpoint for direct access
export async function POST(request: NextRequest) {
  try {
    console.log('Instagram Simple Login: Generating authorization URL');

    if (!INSTAGRAM_APP_ID || !INSTAGRAM_APP_SECRET) {
      return NextResponse.json(
        { error: 'Instagram authentication not configured' },
        { status: 500 }
      );
    }

    const state = generateRandomString(32);
    const redirect_uri = `${BASE_URL}/api/auth/instagram/callback`;

    // Store state in cookie
    const cookieStore = await cookies();
    cookieStore.set('instagram_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600,
      path: '/'
    });

    const authUrl = new URL(INSTAGRAM_AUTH_URL);
    authUrl.searchParams.set('client_id', INSTAGRAM_APP_ID);
    authUrl.searchParams.set('redirect_uri', redirect_uri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', INSTAGRAM_SCOPES);
    authUrl.searchParams.set('state', state);

    console.log('Instagram Simple Login: Generated authorization URL', {
      app_id: INSTAGRAM_APP_ID,
      redirect_uri,
      scopes: INSTAGRAM_SCOPES.split(','),
      state: state.substring(0, 8) + '...'
    });

    return NextResponse.json({
      authUrl: authUrl.toString(),
      message: 'Click the link to authorize your Instagram Business account',
      instructions: [
        '1. You must have an Instagram Business or Creator account',
        '2. Your Instagram account must be linked to a Facebook Page',
        '3. You need admin access to the connected Facebook Page',
        '4. Click the authorization link to grant permissions',
        '5. You will be redirected back to ClipCast after authorization'
      ],
      scopes: {
        'instagram_business_basic': 'Access basic account information',
        'instagram_business_content_publish': 'Publish photos and videos to your account',
        'instagram_business_manage_messages': 'Send and receive direct messages',
        'instagram_business_manage_comments': 'Moderate comments on your posts'
      }
    });

  } catch (error) {
    console.error('Instagram Simple Login: Error generating URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate Instagram authorization URL' },
      { status: 500 }
    );
  }
}

// Utility function to generate random string for state parameter
function generateRandomString(length: number): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return result;
} 