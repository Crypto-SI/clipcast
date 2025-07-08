import { NextRequest, NextResponse } from 'next/server';

/**
 * TikTok Account Information Endpoint
 * 
 * This endpoint manages TikTok account data and provides current account information.
 * It automatically handles token refresh when tokens are close to expiration.
 * 
 * Features:
 * - Returns current account information
 * - Automatically refreshes tokens when needed
 * - Provides token status and expiration information
 * - Handles account disconnection
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
    
    let accountData = JSON.parse(accountCookie.value);
    
    // Check if token needs refreshing (less than 5 minutes remaining)
    const timeUntilExpiry = accountData.expiresAt - Date.now();
    const fiveMinutes = 5 * 60 * 1000;
    
    if (timeUntilExpiry <= fiveMinutes && accountData.refreshToken) {
      try {
        console.log('TikTok Account: Auto-refreshing token', {
          openId: accountData.openId,
          timeUntilExpiry: Math.floor(timeUntilExpiry / 1000)
        });
        
        // Attempt to refresh the token
        const refreshResponse = await fetch(`${request.nextUrl.origin}/api/auth/tiktok/refresh`, {
          method: 'POST',
          headers: {
            'Cookie': request.headers.get('Cookie') || ''
          }
        });
        
        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          console.log('TikTok Account: Token auto-refresh successful');
          
          // Get the updated account data from the refresh response
          const setCookieHeader = refreshResponse.headers.get('Set-Cookie');
          if (setCookieHeader) {
            // Parse the updated account data (in a real implementation, you might want to use a proper cookie parser)
            const updatedAccountCookie = request.cookies.get('tiktok_account');
            if (updatedAccountCookie) {
              accountData = JSON.parse(updatedAccountCookie.value);
            }
          }
        } else {
          console.warn('TikTok Account: Auto-refresh failed, continuing with current token');
        }
      } catch (refreshError) {
        console.error('TikTok Account: Auto-refresh error:', refreshError);
        // Continue with current token - user will get error if it's actually expired
      }
    }
    
    // Check if token is actually expired
    if (Date.now() > accountData.expiresAt) {
      return NextResponse.json({ 
        error: 'token_expired',
        error_description: 'TikTok access token has expired. Please reconnect your account.',
        expiresAt: accountData.expiresAt,
        requiresReauth: true
      }, { status: 401 });
    }
    
    // Calculate time until expiry
    const currentTimeUntilExpiry = accountData.expiresAt - Date.now();
    
    // Return account data without sensitive tokens
    const responseData = {
      success: true,
      platform: accountData.platform,
      openId: accountData.openId,
      username: accountData.username,
      displayName: accountData.displayName,
      avatar: accountData.avatar,
      bio: accountData.bio || '',
      profileDeepLink: accountData.profileDeepLink || '',
      
      // Statistics
      followerCount: accountData.followerCount || 0,
      followingCount: accountData.followingCount || 0,
      likesCount: accountData.likesCount || 0,
      videoCount: accountData.videoCount || 0,
      isVerified: accountData.isVerified || false,
      
      // Token information (without actual tokens)
      scope: accountData.scope || '',
      expiresAt: accountData.expiresAt,
      timeUntilExpiry: Math.floor(currentTimeUntilExpiry / 1000),
      isExpired: currentTimeUntilExpiry <= 0,
      needsRefresh: currentTimeUntilExpiry <= fiveMinutes,
      connectedAt: accountData.connectedAt,
      lastRefreshed: accountData.lastRefreshed || null,
      
      // Status indicators
      status: currentTimeUntilExpiry > fiveMinutes ? 'active' : 'expires_soon'
    };
    
    console.log('TikTok Account: Returning account info', {
      openId: responseData.openId,
      username: responseData.username,
      status: responseData.status,
      timeUntilExpiry: responseData.timeUntilExpiry
    });
    
    return NextResponse.json(responseData);
    
  } catch (error) {
    console.error('Error retrieving TikTok account:', error);
    return NextResponse.json({ 
      error: 'account_error',
      error_description: 'Failed to retrieve account information'
    }, { status: 500 });
  }
}

/**
 * DELETE endpoint to disconnect TikTok account
 */
export async function DELETE(request: NextRequest) {
  try {
    const accountCookie = request.cookies.get('tiktok_account');
    
    if (!accountCookie) {
      return NextResponse.json({ 
        error: 'no_account',
        error_description: 'No TikTok account found' 
      }, { status: 404 });
    }
    
    const accountData = JSON.parse(accountCookie.value);
    
    console.log('TikTok Account: Disconnecting account', {
      openId: accountData.openId,
      username: accountData.username
    });
    
    // In a production app, you might want to revoke the token with TikTok
    // For now, we'll just remove the local cookie
    
    const response = NextResponse.json({ 
      success: true,
      message: 'TikTok account disconnected successfully'
    });
    
    // Remove the account cookie
    response.cookies.delete('tiktok_account');
    
    return response;
    
  } catch (error) {
    console.error('Error disconnecting TikTok account:', error);
    return NextResponse.json({ 
      error: 'disconnect_error',
      error_description: 'Failed to disconnect account'
    }, { status: 500 });
  }
}

/**
 * POST endpoint to manually refresh account data
 */
export async function POST(request: NextRequest) {
  try {
    const accountCookie = request.cookies.get('tiktok_account');
    
    if (!accountCookie) {
      return NextResponse.json({ 
        error: 'no_account',
        error_description: 'No TikTok account found' 
      }, { status: 404 });
    }
    
    const accountData = JSON.parse(accountCookie.value);
    
    if (!accountData.accessToken) {
      return NextResponse.json({ 
        error: 'no_access_token',
        error_description: 'No access token available' 
      }, { status: 400 });
    }
    
    console.log('TikTok Account: Manually refreshing account data', {
      openId: accountData.openId
    });
    
    // Fetch fresh user profile data
    const userProfile = await fetchUserProfile(accountData.accessToken, accountData.openId);
    
    // Update account data with fresh profile information
    const updatedAccountData = {
      ...accountData,
      username: userProfile.username || accountData.username,
      displayName: userProfile.display_name || accountData.displayName,
      avatar: userProfile.avatar_url || userProfile.avatar_large_url || accountData.avatar,
      bio: userProfile.bio_description || accountData.bio,
      followerCount: userProfile.follower_count || accountData.followerCount,
      followingCount: userProfile.following_count || accountData.followingCount,
      likesCount: userProfile.likes_count || accountData.likesCount,
      videoCount: userProfile.video_count || accountData.videoCount,
      isVerified: userProfile.is_verified || accountData.isVerified,
      profileDeepLink: userProfile.profile_deep_link || accountData.profileDeepLink,
      lastUpdated: Date.now()
    };
    
    console.log('TikTok Account: Account data refreshed successfully', {
      openId: updatedAccountData.openId,
      followerCount: updatedAccountData.followerCount,
      videoCount: updatedAccountData.videoCount
    });
    
    // Create response with updated account info
    const response = NextResponse.json({
      success: true,
      message: 'Account data refreshed successfully',
      updatedAt: updatedAccountData.lastUpdated,
      changes: {
        followerCount: updatedAccountData.followerCount !== accountData.followerCount,
        videoCount: updatedAccountData.videoCount !== accountData.videoCount,
        displayName: updatedAccountData.displayName !== accountData.displayName,
        avatar: updatedAccountData.avatar !== accountData.avatar
      }
    });
    
    // Update the account cookie with fresh data
    response.cookies.set('tiktok_account', JSON.stringify(updatedAccountData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: Math.floor((accountData.expiresAt - Date.now()) / 1000), // Keep original expiration
      path: '/'
    });
    
    return response;
    
  } catch (error) {
    console.error('TikTok account refresh error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({ 
      error: 'refresh_error',
      error_description: errorMessage
    }, { status: 500 });
  }
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
  
  console.log('TikTok Account: Fetching user profile', { openId });
  
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
  console.log('TikTok Account: User profile fetched successfully', {
    openId: userInfo.open_id,
    displayName: userInfo.display_name,
    followerCount: userInfo.follower_count
  });
  
  return userInfo;
} 