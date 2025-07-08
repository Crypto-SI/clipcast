import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Instagram API endpoints
const INSTAGRAM_USER_INFO_URL = 'https://graph.instagram.com/me';
const INSTAGRAM_REFRESH_TOKEN_URL = 'https://graph.instagram.com/refresh_access_token';

// GET: Check Instagram account status and return account information
export async function GET(request: NextRequest) {
  try {
    console.log('Instagram Account: Checking account status');

    const cookieStore = await cookies();
    const accountCookie = cookieStore.get('instagram_account');

    if (!accountCookie?.value) {
      console.log('Instagram Account: No account connected');
      return NextResponse.json({
        connected: false,
        message: 'No Instagram account connected'
      });
    }

    let accountData;
    try {
      accountData = JSON.parse(accountCookie.value);
    } catch (error) {
      console.error('Instagram Account: Invalid account data in cookie');
      // Clear invalid cookie
      cookieStore.delete('instagram_account');
      return NextResponse.json({
        connected: false,
        message: 'Invalid account data'
      });
    }

    // Check if token is expired or about to expire (within 24 hours)
    const expiresAt = new Date(accountData.expiresAt);
    const now = new Date();
    const timeUntilExpiry = expiresAt.getTime() - now.getTime();
    const hoursUntilExpiry = timeUntilExpiry / (1000 * 60 * 60);
    const daysUntilExpiry = timeUntilExpiry / (1000 * 60 * 60 * 24);

    const isExpired = timeUntilExpiry <= 0;
    const needsRefresh = hoursUntilExpiry <= 24 && hoursUntilExpiry > 0;

    let status = 'active';
    if (isExpired) {
      status = 'expired';
    } else if (needsRefresh) {
      status = 'expires_soon';
    }

    // Try to refresh token if it's about to expire
    if (needsRefresh && !isExpired) {
      console.log('Instagram Account: Token expires soon, attempting refresh');
      try {
        const refreshResponse = await fetch(
          `${INSTAGRAM_REFRESH_TOKEN_URL}?grant_type=ig_refresh_token&access_token=${accountData.accessToken}`,
          { method: 'GET' }
        );

        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          const newExpiresAt = new Date(Date.now() + (refreshData.expires_in * 1000));
          
          accountData.accessToken = refreshData.access_token;
          accountData.expiresAt = newExpiresAt.toISOString();
          accountData.expiresIn = refreshData.expires_in;
          
          // Update cookie with refreshed token
          cookieStore.set('instagram_account', JSON.stringify(accountData), {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: refreshData.expires_in,
            path: '/'
          });

          status = 'active';
          console.log('Instagram Account: Token refreshed successfully');
        }
      } catch (error) {
        console.warn('Instagram Account: Token refresh failed:', error);
      }
    }

    console.log('Instagram Account: Returning account status:', {
      platform: accountData.platform,
      username: accountData.username,
      status,
      expiresAt: accountData.expiresAt,
      hoursUntilExpiry: Math.round(hoursUntilExpiry)
    });

    return NextResponse.json({
      connected: true,
      account: {
        platform: accountData.platform,
        id: accountData.id,
        username: accountData.username,
        displayName: accountData.displayName,
        accountType: accountData.accountType,
        mediaCount: accountData.mediaCount,
        permissions: accountData.permissions,
        connectedAt: accountData.connectedAt,
        expiresAt: accountData.expiresAt,
        status,
        isExpired,
        needsRefresh,
        timeUntilExpiry: Math.max(0, Math.round(hoursUntilExpiry)),
        daysUntilExpiry: Math.max(0, Math.round(daysUntilExpiry))
      }
    });

  } catch (error) {
    console.error('Instagram Account: Error checking account status:', error);
    return NextResponse.json(
      { error: 'Failed to check Instagram account status' },
      { status: 500 }
    );
  }
}

// POST: Refresh account data and token
export async function POST(request: NextRequest) {
  try {
    console.log('Instagram Account: Refreshing account data');

    const cookieStore = await cookies();
    const accountCookie = cookieStore.get('instagram_account');

    if (!accountCookie?.value) {
      return NextResponse.json(
        { error: 'No Instagram account connected' },
        { status: 404 }
      );
    }

    let accountData;
    try {
      accountData = JSON.parse(accountCookie.value);
    } catch (error) {
      console.error('Instagram Account: Invalid account data');
      cookieStore.delete('instagram_account');
      return NextResponse.json(
        { error: 'Invalid account data' },
        { status: 400 }
      );
    }

    // Check if token is expired
    const expiresAt = new Date(accountData.expiresAt);
    const now = new Date();
    const isExpired = expiresAt.getTime() <= now.getTime();

    if (isExpired) {
      console.log('Instagram Account: Token expired, cannot refresh');
      cookieStore.delete('instagram_account');
      return NextResponse.json(
        { error: 'Instagram token expired. Please reconnect your account.' },
        { status: 401 }
      );
    }

    // Refresh access token
    console.log('Instagram Account: Refreshing access token');
    const refreshResponse = await fetch(
      `${INSTAGRAM_REFRESH_TOKEN_URL}?grant_type=ig_refresh_token&access_token=${accountData.accessToken}`,
      { method: 'GET' }
    );

    if (!refreshResponse.ok) {
      const errorText = await refreshResponse.text();
      console.error('Instagram Account: Token refresh failed:', errorText);
      return NextResponse.json(
        { error: 'Failed to refresh Instagram token' },
        { status: 400 }
      );
    }

    const refreshData = await refreshResponse.json();
    const newExpiresAt = new Date(Date.now() + (refreshData.expires_in * 1000));

    // Fetch updated user profile
    console.log('Instagram Account: Fetching updated profile');
    const userResponse = await fetch(
      `${INSTAGRAM_USER_INFO_URL}?fields=id,username,account_type,media_count&access_token=${refreshData.access_token}`,
      { method: 'GET' }
    );

    let updatedProfile = {
      username: accountData.username,
      account_type: accountData.accountType,
      media_count: accountData.mediaCount
    };

    if (userResponse.ok) {
      const userData = await userResponse.json();
      updatedProfile = {
        username: userData.username || accountData.username,
        account_type: userData.account_type || accountData.accountType,
        media_count: userData.media_count || accountData.mediaCount
      };
    }

    // Update account data
    const updatedAccountData = {
      ...accountData,
      username: updatedProfile.username,
      displayName: updatedProfile.username,
      accountType: updatedProfile.account_type,
      mediaCount: updatedProfile.media_count,
      accessToken: refreshData.access_token,
      expiresAt: newExpiresAt.toISOString(),
      expiresIn: refreshData.expires_in,
      status: 'active'
    };

    // Store updated account data
    cookieStore.set('instagram_account', JSON.stringify(updatedAccountData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: refreshData.expires_in,
      path: '/'
    });

    console.log('Instagram Account: Account data refreshed successfully');

    return NextResponse.json({
      success: true,
      message: 'Instagram account refreshed successfully',
      account: {
        platform: updatedAccountData.platform,
        id: updatedAccountData.id,
        username: updatedAccountData.username,
        displayName: updatedAccountData.displayName,
        accountType: updatedAccountData.accountType,
        mediaCount: updatedAccountData.mediaCount,
        permissions: updatedAccountData.permissions,
        connectedAt: updatedAccountData.connectedAt,
        expiresAt: updatedAccountData.expiresAt,
        status: 'active'
      }
    });

  } catch (error) {
    console.error('Instagram Account: Error refreshing account:', error);
    return NextResponse.json(
      { error: 'Failed to refresh Instagram account' },
      { status: 500 }
    );
  }
}

// DELETE: Disconnect Instagram account
export async function DELETE(request: NextRequest) {
  try {
    console.log('Instagram Account: Disconnecting account');

    const cookieStore = await cookies();
    const accountCookie = cookieStore.get('instagram_account');

    if (!accountCookie?.value) {
      return NextResponse.json(
        { error: 'No Instagram account connected' },
        { status: 404 }
      );
    }

    // Clear the account cookie
    cookieStore.delete('instagram_account');

    console.log('Instagram Account: Account disconnected successfully');

    return NextResponse.json({
      success: true,
      message: 'Instagram account disconnected successfully'
    });

  } catch (error) {
    console.error('Instagram Account: Error disconnecting account:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect Instagram account' },
      { status: 500 }
    );
  }
} 