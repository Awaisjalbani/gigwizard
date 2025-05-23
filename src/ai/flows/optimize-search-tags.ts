'use server';

/**
 * @fileOverview Optimizes search tags for a Fiverr gig based on a main keyword.
 *
 * - optimizeSearchTags - A function that optimizes search tags for a Fiverr gig.
 * - OptimizeSearchTagsInput - The input type for the optimizeSearchTags function.
 * - OptimizeSearchTagsOutput - The return type for the optimizeSearchTags function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const OptimizeSearchTagsInputSchema = z.object({
  mainKeyword: z
    .string()
    .describe('The main keyword for which to optimize search tags.'),
});
export type OptimizeSearchTagsInput = z.infer<typeof OptimizeSearchTagsInputSchema>;

const OptimizeSearchTagsOutputSchema = z.object({
  searchTags: z
    .array(z.string())
    .length(5)
    .describe(
      'An array of 5 optimized search tags that are less competitive, highly relevant, and have good search volume.'
    ),
});
export type OptimizeSearchTagsOutput = z.infer<typeof OptimizeSearchTagsOutputSchema>;

export async function optimizeSearchTags(
  input: OptimizeSearchTagsInput
): Promise<OptimizeSearchTagsOutput> {
  return optimizeSearchTagsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'optimizeSearchTagsPrompt',
  input: {schema: OptimizeSearchTagsInputSchema},
  output: {schema: OptimizeSearchTagsOutputSchema},
  prompt: `You are an expert in Fiverr SEO and keyword research.

  Based on the main keyword provided, identify 5 search tags that are:
  - Less competitive
  - Highly relevant
  - Have good search volume

  Main Keyword: {{{mainKeyword}}}

  Provide the 5 search tags as an array of strings.
  `,
});

const optimizeSearchTagsFlow = ai.defineFlow(
  {
    name: 'optimizeSearchTagsFlow',
    inputSchema: OptimizeSearchTagsInputSchema,
    outputSchema: OptimizeSearchTagsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
