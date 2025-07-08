import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Instagram OAuth 2.0 Configuration
const INSTAGRAM_APP_ID = process.env.INSTAGRAM_APP_ID;
const INSTAGRAM_APP_SECRET = process.env.INSTAGRAM_APP_SECRET;
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002';

// Instagram API endpoints
const INSTAGRAM_TOKEN_URL = 'https://api.instagram.com/oauth/access_token';
const INSTAGRAM_LONG_TOKEN_URL = 'https://graph.instagram.com/access_token';
const INSTAGRAM_USER_INFO_URL = 'https://graph.instagram.com/me';

export async function GET(request: NextRequest) {
  try {
    console.log('Instagram Callback: Processing OAuth callback');

    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Handle authorization errors
    if (error) {
      console.error('Instagram Callback: Authorization error:', {
        error,
        error_reason: searchParams.get('error_reason'),
        error_description: searchParams.get('error_description')
      });

      return NextResponse.redirect(`${BASE_URL}/?error=instagram_auth_denied`);
    }

    // Validate required parameters
    if (!code || !state) {
      console.error('Instagram Callback: Missing required parameters', { code: !!code, state: !!state });
      return NextResponse.redirect(`${BASE_URL}/?error=instagram_missing_params`);
    }

    // Validate environment variables
    if (!INSTAGRAM_APP_ID || !INSTAGRAM_APP_SECRET) {
      console.error('Instagram Callback: Missing environment variables');
      return NextResponse.redirect(`${BASE_URL}/?error=instagram_config_error`);
    }

    // Verify state parameter (CSRF protection)
    const cookieStore = await cookies();
    const storedState = cookieStore.get('instagram_oauth_state')?.value;

    if (!storedState || storedState !== state) {
      console.error('Instagram Callback: State mismatch', { 
        stored: storedState?.substring(0, 8) + '...', 
        received: state?.substring(0, 8) + '...' 
      });
      return NextResponse.redirect(`${BASE_URL}/?error=instagram_state_mismatch`);
    }

    console.log('Instagram Callback: Exchanging authorization code for access token');

    // Exchange authorization code for short-lived access token
    const tokenResponse = await fetch(INSTAGRAM_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: INSTAGRAM_APP_ID,
        client_secret: INSTAGRAM_APP_SECRET,
        grant_type: 'authorization_code',
        redirect_uri: `${BASE_URL}/api/auth/instagram/callback`,
        code: code,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Instagram Callback: Token exchange failed:', {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        error: errorText
      });
      return NextResponse.redirect(`${BASE_URL}/?error=instagram_token_exchange_failed`);
    }

    const tokenData = await tokenResponse.json();
    console.log('Instagram Callback: Short-lived token obtained:', {
      user_id: tokenData.data?.[0]?.user_id,
      permissions: tokenData.data?.[0]?.permissions
    });

    const shortLivedToken = tokenData.data?.[0]?.access_token;
    const userId = tokenData.data?.[0]?.user_id;
    const permissions = tokenData.data?.[0]?.permissions;

    if (!shortLivedToken || !userId) {
      console.error('Instagram Callback: Invalid token response:', tokenData);
      return NextResponse.redirect(`${BASE_URL}/?error=instagram_invalid_token_response`);
    }

    console.log('Instagram Callback: Exchanging for long-lived token');

    // Exchange short-lived token for long-lived token (60 days)
    const longTokenResponse = await fetch(
      `${INSTAGRAM_LONG_TOKEN_URL}?grant_type=ig_exchange_token&client_secret=${INSTAGRAM_APP_SECRET}&access_token=${shortLivedToken}`,
      { method: 'GET' }
    );

    if (!longTokenResponse.ok) {
      const errorText = await longTokenResponse.text();
      console.error('Instagram Callback: Long-lived token exchange failed:', {
        status: longTokenResponse.status,
        error: errorText
      });
      // Continue with short-lived token if long-lived exchange fails
    }

    let accessToken = shortLivedToken;
    let expiresIn = 3600; // 1 hour for short-lived token

    if (longTokenResponse.ok) {
      const longTokenData = await longTokenResponse.json();
      accessToken = longTokenData.access_token;
      expiresIn = longTokenData.expires_in || 5183944; // ~60 days
      console.log('Instagram Callback: Long-lived token obtained:', {
        expires_in: expiresIn,
        expires_in_days: Math.round(expiresIn / 86400)
      });
    }

    console.log('Instagram Callback: Fetching user profile information');

    // Fetch user profile information
    const userResponse = await fetch(
      `${INSTAGRAM_USER_INFO_URL}?fields=id,username,account_type,media_count&access_token=${accessToken}`,
      { method: 'GET' }
    );

    let userProfile = {
      id: userId,
      username: 'Unknown',
      account_type: 'BUSINESS',
      media_count: 0
    };

    if (userResponse.ok) {
      const userData = await userResponse.json();
      userProfile = {
        id: userData.id || userId,
        username: userData.username || 'Unknown',
        account_type: userData.account_type || 'BUSINESS',
        media_count: userData.media_count || 0
      };
      console.log('Instagram Callback: User profile fetched:', userProfile);
    } else {
      console.warn('Instagram Callback: Failed to fetch user profile, using defaults');
    }

    // Calculate expiration time
    const expiresAt = new Date(Date.now() + (expiresIn * 1000));

    // Prepare account data
    const accountData = {
      platform: 'instagram',
      id: userProfile.id,
      username: userProfile.username,
      displayName: userProfile.username,
      accountType: userProfile.account_type,
      mediaCount: userProfile.media_count,
      accessToken: accessToken,
      expiresAt: expiresAt.toISOString(),
      expiresIn: expiresIn,
      permissions: permissions?.split(',') || [],
      connectedAt: new Date().toISOString(),
      status: 'active'
    };

    console.log('Instagram Callback: Storing account data:', {
      platform: accountData.platform,
      username: accountData.username,
      accountType: accountData.accountType,
      mediaCount: accountData.mediaCount,
      expiresAt: accountData.expiresAt,
      permissions: accountData.permissions
    });

    // Store account data in secure HTTP-only cookie
    cookieStore.set('instagram_account', JSON.stringify(accountData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: expiresIn,
      path: '/'
    });

    // Clear the state cookie
    cookieStore.delete('instagram_oauth_state');

    console.log('Instagram Callback: Authentication completed successfully');

    // Redirect to home page with success message
    return NextResponse.redirect(`${BASE_URL}/?instagram_connected=true`);

  } catch (error) {
    console.error('Instagram Callback: Unexpected error:', error);
    return NextResponse.redirect(`${BASE_URL}/?error=instagram_callback_error`);
  }
} 