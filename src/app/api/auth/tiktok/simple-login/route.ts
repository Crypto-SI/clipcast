import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

/**
 * TikTok Simple Login Endpoint for Single-User Apps
 * 
 * This endpoint provides a simplified OAuth flow specifically designed for single-user applications.
 * It generates the authorization URL with proper PKCE parameters and provides clear instructions
 * for the user to complete the authentication process.
 * 
 * Features:
 * - Uses the same secure OAuth 2.0 + PKCE flow as the main endpoint
 * - Provides user-friendly instructions and authorization URL
 * - Stores PKCE parameters securely in HTTP-only cookies
 * - Uses the same callback endpoint for consistency
 */
export async function GET(request: NextRequest) {
  try {
    const clientKey = process.env.TIKTOK_CLIENT_KEY;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002';
    const redirectUri = `${baseUrl}/api/auth/tiktok/callback`;
    
    if (!clientKey) {
      console.error('TikTok Simple Login Error: TIKTOK_CLIENT_KEY not configured');
      return NextResponse.json({ 
        error: 'invalid_configuration',
        error_description: 'TikTok client key not configured. Please check your environment variables.' 
      }, { status: 500 });
    }

    // Generate PKCE parameters (same as main OAuth flow)
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = generateCodeChallenge(codeVerifier);
    const state = generateState();
    
    // TikTok API scopes - using basic scopes that don't require special approval
    const scopes = [
      'user.info.basic',    // Basic profile info (display name, avatar)
      'video.list'          // Read user's public videos
    ];
    
    // Build authorization URL with PKCE parameters
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
    
    console.log('TikTok Simple Login: Generated authorization URL', {
      client_key: clientKey,
      redirect_uri: redirectUri,
      scopes: scopes,
      state: state.substring(0, 8) + '...'
    });
    
    // Create response with authorization URL and instructions
    const response = NextResponse.json({
      success: true,
      authUrl: authUrl,
      instructions: {
        title: 'TikTok Account Connection',
        description: 'Connect your TikTok account to access your profile and videos.',
        steps: [
          'Click the authorization URL below or use the "Open Authorization" button',
          'You will be redirected to TikTok to log in and authorize this app',
          'After authorization, you will be automatically redirected back to this app',
          'Your TikTok account will be connected and ready to use'
        ],
        authUrl: authUrl,
        note: 'This process is secure and uses OAuth 2.0 with PKCE for maximum security.',
        scopes: {
          'user.info.basic': 'Access to basic profile information (name, avatar)',
          'video.list': 'Access to your public video list'
        }
      },
      config: {
        redirect_uri: redirectUri,
        scopes: scopes,
        expires_in: 600 // 10 minutes for user to complete authorization
      }
    });
    
    // Store PKCE parameters in secure HTTP-only cookies (same as main flow)
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: 600, // 10 minutes
      path: '/'
    };
    
    response.cookies.set('tiktok_code_verifier', codeVerifier, cookieOptions);
    response.cookies.set('tiktok_state', state, cookieOptions);
    
    return response;
    
  } catch (error) {
    console.error('TikTok Simple Login error:', error);
    return NextResponse.json({ 
      error: 'server_error',
      error_description: 'Failed to initialize TikTok authorization',
      details: error instanceof Error ? error.message : 'Unknown error'
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