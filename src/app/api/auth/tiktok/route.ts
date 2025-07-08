import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

/**
 * TikTok OAuth 2.0 Authorization Endpoint with PKCE
 * 
 * This endpoint initiates the TikTok OAuth flow following TikTok's official documentation:
 * - Uses OAuth 2.0 Authorization Code Flow with PKCE (RFC 7636)
 * - Implements proper state parameter for CSRF protection
 * - Uses TikTok's v2 authorization endpoint
 * - Stores PKCE parameters securely in HTTP-only cookies
 */
export async function GET(request: NextRequest) {
  try {
    const clientKey = process.env.TIKTOK_CLIENT_KEY;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002';
    const redirectUri = `${baseUrl}/api/auth/tiktok/callback`;
    
    if (!clientKey) {
      console.error('TikTok OAuth Error: TIKTOK_CLIENT_KEY not configured');
      return NextResponse.json({ 
        error: 'invalid_configuration',
        error_description: 'TikTok client key not configured' 
      }, { status: 500 });
    }

    // Generate PKCE code_verifier (43-128 characters, base64url-encoded)
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = generateCodeChallenge(codeVerifier);
    
    // Generate anti-forgery state token (CSRF protection)
    const state = generateState();
    
    // TikTok API scopes - using basic scopes that don't require special approval
    const scopes = [
      'user.info.basic',    // Basic profile info (display name, avatar)
      'video.list'          // Read user's public videos
    ];
    
    // Construct authorization URL according to TikTok's specification
    const authParams = new URLSearchParams({
      client_key: clientKey,
      scope: scopes.join(','),
      response_type: 'code',
      redirect_uri: redirectUri,
      state: state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256'
    });
    
    const authUrl = `https://www.tiktok.com/v2/auth/authorize/?${authParams.toString()}`;
    
    console.log('TikTok OAuth: Initiating authorization flow', {
      client_key: clientKey,
      redirect_uri: redirectUri,
      scopes: scopes,
      state: state.substring(0, 8) + '...' // Log partial state for debugging
    });
    
    // Create response with redirect to TikTok authorization page
    const response = NextResponse.redirect(authUrl);
    
    // Store PKCE parameters in secure HTTP-only cookies
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: 600, // 10 minutes (enough time for user to authorize)
      path: '/'
    };
    
    response.cookies.set('tiktok_code_verifier', codeVerifier, cookieOptions);
    response.cookies.set('tiktok_state', state, cookieOptions);
    
    return response;
    
  } catch (error) {
    console.error('TikTok OAuth initialization error:', error);
    return NextResponse.json({ 
      error: 'server_error',
      error_description: 'OAuth initialization failed',
      log_id: generateLogId()
    }, { status: 500 });
  }
}

/**
 * Generate PKCE code_verifier
 * Must be 43-128 characters long, using unreserved characters [A-Z] / [a-z] / [0-9] / "-" / "." / "_" / "~"
 */
function generateCodeVerifier(): string {
  // Generate 96 random bytes and encode as base64url (128 characters)
  return crypto.randomBytes(96).toString('base64url');
}

/**
 * Generate PKCE code_challenge
 * SHA256 hash of code_verifier, base64url-encoded
 */
function generateCodeChallenge(codeVerifier: string): string {
  return crypto.createHash('sha256').update(codeVerifier).digest('base64url');
}

/**
 * Generate anti-forgery state token
 * Used to prevent CSRF attacks
 */
function generateState(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Generate log ID for debugging purposes
 */
function generateLogId(): string {
  const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
  const random = crypto.randomBytes(8).toString('hex').toUpperCase();
  return `${timestamp}${random}`;
} 