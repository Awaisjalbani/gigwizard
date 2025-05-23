
'use server';

/**
 * @fileOverview Optimizes search tags for a Fiverr gig based on a main keyword.
 *
 * - optimizeSearchTags - A function that optimizes search tags for a Fiverr gig.
 */

import {ai} from '@/ai/genkit';
import type { OptimizeSearchTagsInput, OptimizeSearchTagsOutput } from '@/ai/schemas/gig-generation-schemas';
import { OptimizeSearchTagsInputSchema, OptimizeSearchTagsOutputSchema } from '@/ai/schemas/gig-generation-schemas';


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
  IMPORTANT: Ensure the generated search tags are unique and varied each time, even for the same input keyword.
  `,
});

const optimizeSearchTagsFlow = ai.defineFlow(
  {
    name: 'optimizeSearchTagsFlow',
    inputSchema: OptimizeSearchTagsInputSchema,
    outputSchema: OptimizeSearchTagsOutputSchema,
  },
  async (input: OptimizeSearchTagsInput) => {
    const {output} = await prompt(input);
    return output!;
  }
);
