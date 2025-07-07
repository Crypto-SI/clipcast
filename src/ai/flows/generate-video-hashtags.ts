'use server';
/**
 * @fileOverview AI-powered hashtag generator for video content.
 *
 * - generateVideoHashtags - A function that generates relevant hashtags for a video.
 * - GenerateVideoHashtagsInput - The input type for the generateVideoHashtags function.
 * - GenerateVideoHashtagsOutput - The return type for the generateVideoHashtags function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateVideoHashtagsInputSchema = z.object({
  videoDataUri: z
    .string()
    .describe(
      "A video file as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  description: z.string().describe('The description of the video.'),
});
export type GenerateVideoHashtagsInput = z.infer<typeof GenerateVideoHashtagsInputSchema>;

const GenerateVideoHashtagsOutputSchema = z.object({
  hashtags: z.array(z.string()).describe('An array of relevant hashtags for the video.'),
});
export type GenerateVideoHashtagsOutput = z.infer<typeof GenerateVideoHashtagsOutputSchema>;

export async function generateVideoHashtags(input: GenerateVideoHashtagsInput): Promise<GenerateVideoHashtagsOutput> {
  return generateVideoHashtagsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateVideoHashtagsPrompt',
  input: {schema: GenerateVideoHashtagsInputSchema},
  output: {schema: GenerateVideoHashtagsOutputSchema},
  prompt: `You are an expert social media manager specializing in generating hashtags for TikTok and Instagram videos.

You will analyze the video content and its description to generate a list of relevant hashtags that will increase its visibility.

Description: {{{description}}}
Video: {{media url=videoDataUri}}

Generate at least 10 hashtags.`,
});

const generateVideoHashtagsFlow = ai.defineFlow(
  {
    name: 'generateVideoHashtagsFlow',
    inputSchema: GenerateVideoHashtagsInputSchema,
    outputSchema: GenerateVideoHashtagsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
