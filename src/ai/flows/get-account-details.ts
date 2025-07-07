'use server';
/**
 * @fileOverview An AI flow to retrieve simulated details for a social media account.
 *
 * - getAccountDetails - A function that fetches simulated follower count and generates an avatar hint.
 * - GetAccountDetailsInput - The input type for the getAccountDetails function.
 * - GetAccountDetailsOutput - The return type for the getAccountDetails function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const GetAccountDetailsInputSchema = z.object({
  platform: z.enum(['TikTok', 'Instagram']).describe('The social media platform.'),
  username: z.string().describe('The username of the account.'),
});
export type GetAccountDetailsInput = z.infer<typeof GetAccountDetailsInputSchema>;

const GetAccountDetailsOutputSchema = z.object({
  followers: z.number().describe('The number of followers for the account.'),
  dataAiHint: z.string().describe('A two-word hint for generating an avatar image, like "logo abstract" or "gaming mascot".'),
});
export type GetAccountDetailsOutput = z.infer<typeof GetAccountDetailsOutputSchema>;


// This tool simulates fetching data from a live API.
// In a real application, you would replace the random number generation
// with a call to the TikTok or Instagram API.
const getFollowerCountTool = ai.defineTool(
    {
        name: 'getFollowerCount',
        description: 'Gets the follower count for a given social media account.',
        inputSchema: GetAccountDetailsInputSchema,
        outputSchema: z.number(),
    },
    async ({ platform, username }) => {
        // Simulate API call variability
        console.log(`Simulating follower fetch for ${username} on ${platform}...`);
        await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
        return Math.floor(Math.random() * 5000000);
    }
);


const prompt = ai.definePrompt({
    name: 'getAccountDetailsPrompt',
    input: { schema: GetAccountDetailsInputSchema },
    output: { schema: GetAccountDetailsOutputSchema },
    tools: [getFollowerCountTool],
    prompt: `You are a social media account analyst.
    
    Given the platform and username, you must perform two tasks:
    1. Use the getFollowerCount tool to retrieve the number of followers for the account.
    2. Generate a creative and concise two-word "dataAiHint" for an avatar based on the username. For example, if the username is '@travelbug', a good hint would be 'insect world'. If it's '@gamerz', a hint could be 'gaming mascot'.
    
    Platform: {{{platform}}}
    Username: {{{username}}}
    `,
});

const getAccountDetailsFlow = ai.defineFlow(
  {
    name: 'getAccountDetailsFlow',
    inputSchema: GetAccountDetailsInputSchema,
    outputSchema: GetAccountDetailsOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('Failed to get account details from AI.');
    }
    return output;
  }
);


export async function getAccountDetails(input: GetAccountDetailsInput): Promise<GetAccountDetailsOutput> {
  return getAccountDetailsFlow(input);
}
