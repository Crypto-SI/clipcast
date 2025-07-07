'use server';

import { generateVideoHashtags } from '@/ai/flows/generate-video-hashtags';

export async function generateHashtagsAction(videoDataUri: string, description: string): Promise<string[]> {
  if (!videoDataUri || !description) {
    throw new Error('Video data and description are required.');
  }

  try {
    const result = await generateVideoHashtags({ videoDataUri, description });
    return result.hashtags;
  } catch (error) {
    console.error('Error generating hashtags:', error);
    // You can customize the error message for the client
    throw new Error('Failed to generate hashtags. Please try again.');
  }
}
