import { NextRequest, NextResponse } from 'next/server';

/**
 * TikTok OAuth 2.0 Callback Endpoint
 * 
 * Handles the authorization callback from TikTok:
 * 1. Validates state parameter (CSRF protection)
 * 2. Exchanges authorization code for access token using PKCE
 * 3. Fetches user profile information
 * 4. Stores account data securely
 * 5. Redirects user back to the app
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');
  
  try {
    // Handle OAuth errors from TikTok
    if (error) {
      console.error('TikTok OAuth Error:', { error, errorDescription });
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002'}/?error=${encodeURIComponent(error)}&error_description=${encodeURIComponent(errorDescription || 'Unknown error')}`
      );
    }
    
    // Validate required parameters
    if (!code || !state) {
      console.error('TikTok OAuth: Missing required parameters', { code: !!code, state: !!state });
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002'}/?error=invalid_request&error_description=Missing authorization code or state`
      );
    }
    
    // Retrieve and validate PKCE parameters from cookies
    const storedState = request.cookies.get('tiktok_state')?.value;
    const codeVerifier = request.cookies.get('tiktok_code_verifier')?.value;
    
    if (!storedState || !codeVerifier) {
      console.error('TikTok OAuth: Missing PKCE parameters in cookies');
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002'}/?error=invalid_request&error_description=Missing PKCE parameters`
      );
    }
    
    // Validate state parameter (CSRF protection)
    if (state !== storedState) {
      console.error('TikTok OAuth: State mismatch', { 
        received: state.substring(0, 8) + '...', 
        stored: storedState.substring(0, 8) + '...' 
      });
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002'}/?error=invalid_state&error_description=State parameter mismatch`
      );
    }
    
    // Step 1: Exchange authorization code for access token
    const tokenData = await exchangeCodeForToken(code, codeVerifier);
    
    // Step 2: Fetch user profile information
    const userProfile = await fetchUserProfile(tokenData.access_token, tokenData.open_id);
    
    // Step 3: Create account data object
    const accountData = {
      platform: 'TikTok',
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      openId: tokenData.open_id,
      scope: tokenData.scope,
      expiresAt: Date.now() + (tokenData.expires_in * 1000),
      connectedAt: Date.now(),
      
      // User profile data
      username: userProfile.username || `user_${tokenData.open_id.substring(0, 8)}`,
      displayName: userProfile.display_name || 'TikTok User',
      avatar: userProfile.avatar_url || userProfile.avatar_large_url || '',
      followerCount: userProfile.follower_count || 0,
      followingCount: userProfile.following_count || 0,
      likesCount: userProfile.likes_count || 0,
      videoCount: userProfile.video_count || 0,
      isVerified: userProfile.is_verified || false,
      
      // Additional profile info
      bio: userProfile.bio_description || '',
      profileDeepLink: userProfile.profile_deep_link || '',
    };
    
    console.log('TikTok OAuth: Successfully connected account', {
      openId: accountData.openId,
      username: accountData.username,
      displayName: accountData.displayName,
      scope: accountData.scope
    });
    
    // Step 4: Store account data in secure HTTP-only cookie
    const response = NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002'}/?success=tiktok_connected`
    );
    
    // Store account data securely
    response.cookies.set('tiktok_account', JSON.stringify(accountData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: tokenData.expires_in, // Match token expiration
      path: '/'
    });
    
    // Clean up temporary PKCE cookies
    response.cookies.delete('tiktok_code_verifier');
    response.cookies.delete('tiktok_state');
    
    return response;
    
  } catch (error) {
    console.error('TikTok OAuth callback error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002'}/?error=callback_error&error_description=${encodeURIComponent(errorMessage)}`
    );
  }
}

/**
 * Exchange authorization code for access token using PKCE
 */
async function exchangeCodeForToken(code: string, codeVerifier: string) {
  const clientKey = process.env.TIKTOK_CLIENT_KEY;
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET;
  const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002'}/api/auth/tiktok/callback`;
  
  if (!clientKey || !clientSecret) {
    throw new Error('TikTok client credentials not configured');
  }
  
  const tokenParams = new URLSearchParams({
    client_key: clientKey,
    client_secret: clientSecret,
    code: code,
    grant_type: 'authorization_code',
    redirect_uri: redirectUri,
    code_verifier: codeVerifier
  });
  
  console.log('TikTok OAuth: Exchanging code for token', {
    client_key: clientKey,
    redirect_uri: redirectUri,
    code: code.substring(0, 8) + '...'
  });
  
  const response = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cache-Control': 'no-cache'
    },
    body: tokenParams.toString()
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    console.error('TikTok token exchange failed:', data);
    throw new Error(`Token exchange failed: ${data.error_description || data.error || 'Unknown error'}`);
  }
  
  if (!data.access_token || !data.open_id) {
    console.error('TikTok token response missing required fields:', data);
    throw new Error('Invalid token response: missing access_token or open_id');
  }
  
  console.log('TikTok OAuth: Token exchange successful', {
    openId: data.open_id,
    scope: data.scope,
    expiresIn: data.expires_in
  });
  
  return data;
}

/**
 * Fetch user profile information using the access token
 */
async function fetchUserProfile(accessToken: string, openId: string) {
  const fields = [
    'open_id',
    'union_id', 
    'avatar_url',
    'avatar_large_url',
    'display_name',
    'bio_description',
    'profile_deep_link',
    'is_verified',
    'follower_count',
    'following_count',
    'likes_count',
    'video_count'
  ].join(',');
  
  console.log('TikTok OAuth: Fetching user profile', { openId });
  
  const response = await fetch(`https://open.tiktokapis.com/v2/user/info/?fields=${fields}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    console.error('TikTok user info fetch failed:', data);
    throw new Error(`Failed to fetch user profile: ${data.error?.message || 'Unknown error'}`);
  }
  
  if (!data.data || !data.data.user) {
    console.error('TikTok user info response missing user data:', data);
    throw new Error('Invalid user info response: missing user data');
  }
  
  const userInfo = data.data.user;
  console.log('TikTok OAuth: User profile fetched successfully', {
    openId: userInfo.open_id,
    displayName: userInfo.display_name,
    isVerified: userInfo.is_verified
  });
  
  return userInfo;
} 