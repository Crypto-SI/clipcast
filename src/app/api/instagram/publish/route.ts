import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Instagram Graph API endpoints
const INSTAGRAM_MEDIA_URL = 'https://graph.facebook.com/v21.0';

interface PublishRequest {
  mediaUrl: string;
  mediaType: 'IMAGE' | 'REELS' | 'STORIES';
  caption?: string;
  coverUrl?: string; // For video thumbnails
  locationId?: string;
  userTags?: Array<{
    username: string;
    x: number;
    y: number;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    console.log('Instagram Publish: Starting content publishing');

    // Get Instagram account from cookie
    const cookieStore = await cookies();
    const accountCookie = cookieStore.get('instagram_account');

    if (!accountCookie?.value) {
      return NextResponse.json(
        { error: 'No Instagram account connected. Please connect your account first.' },
        { status: 401 }
      );
    }

    let accountData;
    try {
      accountData = JSON.parse(accountCookie.value);
    } catch (error) {
      console.error('Instagram Publish: Invalid account data');
      return NextResponse.json(
        { error: 'Invalid account data. Please reconnect your account.' },
        { status: 400 }
      );
    }

    // Check if token is expired
    const expiresAt = new Date(accountData.expiresAt);
    const now = new Date();
    const isExpired = expiresAt.getTime() <= now.getTime();

    if (isExpired) {
      console.log('Instagram Publish: Access token expired');
      return NextResponse.json(
        { error: 'Instagram access token expired. Please reconnect your account.' },
        { status: 401 }
      );
    }

    // Parse request body
    const requestData: PublishRequest = await request.json();

    if (!requestData.mediaUrl || !requestData.mediaType) {
      return NextResponse.json(
        { error: 'Media URL and media type are required' },
        { status: 400 }
      );
    }

    // Validate media type
    const validMediaTypes = ['IMAGE', 'REELS', 'STORIES'];
    if (!validMediaTypes.includes(requestData.mediaType)) {
      return NextResponse.json(
        { error: 'Invalid media type. Must be IMAGE, REELS, or STORIES' },
        { status: 400 }
      );
    }

    // Check permissions
    const hasPublishPermission = accountData.permissions?.includes('instagram_business_content_publish');
    if (!hasPublishPermission) {
      return NextResponse.json(
        { error: 'Missing instagram_business_content_publish permission. Please reconnect your account.' },
        { status: 403 }
      );
    }

    console.log('Instagram Publish: Creating media container', {
      mediaType: requestData.mediaType,
      hasCaption: !!requestData.caption,
      mediaUrl: requestData.mediaUrl.substring(0, 50) + '...'
    });

    // Step 1: Create media container
    const mediaParams = new URLSearchParams({
      access_token: accountData.accessToken
    });

    // Add media URL based on type
    if (requestData.mediaType === 'IMAGE') {
      mediaParams.append('image_url', requestData.mediaUrl);
    } else {
      mediaParams.append('video_url', requestData.mediaUrl);
    }

    // Add media type
    mediaParams.append('media_type', requestData.mediaType);

    // Add caption if provided
    if (requestData.caption) {
      mediaParams.append('caption', requestData.caption);
    }

    // Add cover URL for videos if provided
    if (requestData.coverUrl && requestData.mediaType !== 'IMAGE') {
      mediaParams.append('thumb_offset', '1000'); // Default thumb offset
    }

    // Add location if provided
    if (requestData.locationId) {
      mediaParams.append('location_id', requestData.locationId);
    }

    // Add user tags if provided (for images only)
    if (requestData.userTags && requestData.mediaType === 'IMAGE') {
      const userTagsParam = requestData.userTags.map(tag => ({
        username: tag.username,
        x: tag.x,
        y: tag.y
      }));
      mediaParams.append('user_tags', JSON.stringify(userTagsParam));
    }

    // Create media container
    const containerResponse = await fetch(
      `${INSTAGRAM_MEDIA_URL}/${accountData.id}/media`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: mediaParams.toString()
      }
    );

    if (!containerResponse.ok) {
      const errorText = await containerResponse.text();
      console.error('Instagram Publish: Media container creation failed:', {
        status: containerResponse.status,
        error: errorText
      });

      let errorMessage = 'Failed to create media container';
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error?.message || errorMessage;
      } catch (e) {
        // Use default error message
      }

      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      );
    }

    const containerData = await containerResponse.json();
    const creationId = containerData.id;

    console.log('Instagram Publish: Media container created:', { creationId });

    // For STORIES, publish immediately
    if (requestData.mediaType === 'STORIES') {
      console.log('Instagram Publish: Publishing story immediately');
      
      const publishParams = new URLSearchParams({
        creation_id: creationId,
        access_token: accountData.accessToken
      });

      const publishResponse = await fetch(
        `${INSTAGRAM_MEDIA_URL}/${accountData.id}/media_publish`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: publishParams.toString()
        }
      );

      if (!publishResponse.ok) {
        const errorText = await publishResponse.text();
        console.error('Instagram Publish: Story publishing failed:', errorText);
        return NextResponse.json(
          { error: 'Failed to publish story' },
          { status: 400 }
        );
      }

      const storyPublishData = await publishResponse.json();
      console.log('Instagram Publish: Story published successfully:', storyPublishData);

      return NextResponse.json({
        success: true,
        message: 'Instagram story published successfully',
        mediaId: storyPublishData.id,
        creationId: creationId,
        mediaType: 'STORIES'
      });
    }

    // For IMAGE and REELS, wait a moment then publish
    console.log('Instagram Publish: Waiting before publishing...');
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds

    // Step 2: Publish the media
    const publishParams = new URLSearchParams({
      creation_id: creationId,
      access_token: accountData.accessToken
    });

    const publishResponse = await fetch(
      `${INSTAGRAM_MEDIA_URL}/${accountData.id}/media_publish`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: publishParams.toString()
      }
    );

    if (!publishResponse.ok) {
      const errorText = await publishResponse.text();
      console.error('Instagram Publish: Publishing failed:', {
        status: publishResponse.status,
        error: errorText
      });

      let errorMessage = 'Failed to publish media';
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error?.message || errorMessage;
        
        // Handle specific error cases
        if (errorMessage.includes('media not ready')) {
          errorMessage = 'Media is still processing. Please try again in a few moments.';
        }
      } catch (e) {
        // Use default error message
      }

      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      );
    }

    const finalPublishData = await publishResponse.json();
    console.log('Instagram Publish: Content published successfully:', {
      mediaId: finalPublishData.id,
      mediaType: requestData.mediaType
    });

    return NextResponse.json({
      success: true,
      message: `Instagram ${requestData.mediaType.toLowerCase()} published successfully`,
      mediaId: finalPublishData.id,
      creationId: creationId,
      mediaType: requestData.mediaType,
      permalink: `https://www.instagram.com/p/${finalPublishData.id}/` // Note: This might not be the correct format
    });

  } catch (error) {
    console.error('Instagram Publish: Unexpected error:', error);
    return NextResponse.json(
      { error: 'Failed to publish content to Instagram' },
      { status: 500 }
    );
  }
}

// GET: Get publishing status or media info
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mediaId = searchParams.get('mediaId');

    if (!mediaId) {
      return NextResponse.json(
        { error: 'Media ID is required' },
        { status: 400 }
      );
    }

    // Get Instagram account from cookie
    const cookieStore = await cookies();
    const accountCookie = cookieStore.get('instagram_account');

    if (!accountCookie?.value) {
      return NextResponse.json(
        { error: 'No Instagram account connected' },
        { status: 401 }
      );
    }

    let accountData;
    try {
      accountData = JSON.parse(accountCookie.value);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid account data' },
        { status: 400 }
      );
    }

    // Fetch media info
    const mediaResponse = await fetch(
      `${INSTAGRAM_MEDIA_URL}/${mediaId}?fields=id,media_type,media_url,permalink,caption,timestamp&access_token=${accountData.accessToken}`,
      { method: 'GET' }
    );

    if (!mediaResponse.ok) {
      const errorText = await mediaResponse.text();
      console.error('Instagram Publish: Failed to fetch media info:', errorText);
      return NextResponse.json(
        { error: 'Failed to fetch media information' },
        { status: 400 }
      );
    }

    const mediaData = await mediaResponse.json();

    return NextResponse.json({
      success: true,
      media: mediaData
    });

  } catch (error) {
    console.error('Instagram Publish: Error fetching media info:', error);
    return NextResponse.json(
      { error: 'Failed to fetch media information' },
      { status: 500 }
    );
  }
} 