import { NextRequest, NextResponse } from 'next/server';

/**
 * TikTok Token Refresh Endpoint
 * 
 * This endpoint handles automatic renewal of TikTok access tokens using refresh tokens.
 * It's called automatically when tokens are close to expiration or when API calls fail
 * due to expired tokens.
 * 
 * Features:
 * - Exchanges refresh token for new access token
 * - Updates stored account data with new tokens
 * - Handles refresh token rotation (if provided by TikTok)
 * - Provides proper error handling and logging
 */
export async function POST(request: NextRequest) {
  try {
    // Get current account data from cookie
    const accountCookie = request.cookies.get('tiktok_account');
    
    if (!accountCookie) {
      return NextResponse.json({ 
        error: 'no_account',
        error_description: 'No TikTok account found' 
      }, { status: 404 });
    }
    
    const accountData = JSON.parse(accountCookie.value);
    
    if (!accountData.refreshToken) {
      return NextResponse.json({ 
        error: 'no_refresh_token',
        error_description: 'No refresh token available' 
      }, { status: 400 });
    }
    
    // Check if token actually needs refreshing (has at least 5 minutes left)
    const timeUntilExpiry = accountData.expiresAt - Date.now();
    const fiveMinutes = 5 * 60 * 1000;
    
    if (timeUntilExpiry > fiveMinutes) {
      return NextResponse.json({
        success: true,
        message: 'Token is still valid',
        expiresAt: accountData.expiresAt,
        timeUntilExpiry: Math.floor(timeUntilExpiry / 1000)
      });
    }
    
    console.log('TikTok Token Refresh: Refreshing token for user', {
      openId: accountData.openId,
      expiresAt: new Date(accountData.expiresAt).toISOString(),
      timeUntilExpiry: Math.floor(timeUntilExpiry / 1000)
    });
    
    // Refresh the access token
    const newTokenData = await refreshAccessToken(accountData.refreshToken);
    
    // Update account data with new tokens
    const updatedAccountData = {
      ...accountData,
      accessToken: newTokenData.access_token,
      refreshToken: newTokenData.refresh_token || accountData.refreshToken, // Use new refresh token if provided
      expiresAt: Date.now() + (newTokenData.expires_in * 1000),
      scope: newTokenData.scope || accountData.scope,
      lastRefreshed: Date.now()
    };
    
    console.log('TikTok Token Refresh: Successfully refreshed token', {
      openId: updatedAccountData.openId,
      newExpiresAt: new Date(updatedAccountData.expiresAt).toISOString(),
      scope: updatedAccountData.scope
    });
    
    // Create response with updated token info
    const response = NextResponse.json({
      success: true,
      message: 'Token refreshed successfully',
      expiresAt: updatedAccountData.expiresAt,
      scope: updatedAccountData.scope,
      refreshedAt: updatedAccountData.lastRefreshed
    });
    
    // Update the account cookie with new token data
    response.cookies.set('tiktok_account', JSON.stringify(updatedAccountData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: newTokenData.expires_in, // Match token expiration
      path: '/'
    });
    
    return response;
    
  } catch (error) {
    console.error('TikTok token refresh error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    // If refresh fails, the user will need to re-authenticate
    if (errorMessage.includes('invalid_grant') || errorMessage.includes('invalid_token')) {
      // Clear the invalid account data
      const response = NextResponse.json({ 
        error: 'refresh_failed',
        error_description: 'Refresh token is invalid or expired. Re-authentication required.',
        requiresReauth: true
      }, { status: 401 });
      
      response.cookies.delete('tiktok_account');
      return response;
    }
    
    return NextResponse.json({ 
      error: 'refresh_error',
      error_description: errorMessage
    }, { status: 500 });
  }
}

/**
 * Refresh TikTok access token using refresh token
 */
async function refreshAccessToken(refreshToken: string) {
  const clientKey = process.env.TIKTOK_CLIENT_KEY;
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET;
  
  if (!clientKey || !clientSecret) {
    throw new Error('TikTok client credentials not configured');
  }
  
  const tokenParams = new URLSearchParams({
    client_key: clientKey,
    client_secret: clientSecret,
    grant_type: 'refresh_token',
    refresh_token: refreshToken
  });
  
  console.log('TikTok Token Refresh: Calling TikTok refresh endpoint', {
    client_key: clientKey,
    refresh_token: refreshToken.substring(0, 8) + '...'
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
    console.error('TikTok token refresh failed:', data);
    throw new Error(`Token refresh failed: ${data.error_description || data.error || 'Unknown error'}`);
  }
  
  if (!data.access_token) {
    console.error('TikTok refresh response missing access token:', data);
    throw new Error('Invalid refresh response: missing access_token');
  }
  
  console.log('TikTok Token Refresh: Refresh successful', {
    expiresIn: data.expires_in,
    scope: data.scope,
    hasNewRefreshToken: !!data.refresh_token
  });
  
  return data;
}

/**
 * GET endpoint to check token status
 */
export async function GET(request: NextRequest) {
  try {
    const accountCookie = request.cookies.get('tiktok_account');
    
    if (!accountCookie) {
      return NextResponse.json({ 
        error: 'no_account',
        error_description: 'No TikTok account found' 
      }, { status: 404 });
    }
    
    const accountData = JSON.parse(accountCookie.value);
    const timeUntilExpiry = accountData.expiresAt - Date.now();
    
    return NextResponse.json({
      success: true,
      openId: accountData.openId,
      expiresAt: accountData.expiresAt,
      timeUntilExpiry: Math.floor(timeUntilExpiry / 1000),
      isExpired: timeUntilExpiry <= 0,
      needsRefresh: timeUntilExpiry <= (5 * 60 * 1000), // Less than 5 minutes
      lastRefreshed: accountData.lastRefreshed || null,
      scope: accountData.scope
    });
    
  } catch (error) {
    console.error('Token status check error:', error);
    return NextResponse.json({ 
      error: 'status_error',
      error_description: 'Failed to check token status'
    }, { status: 500 });
  }
} 