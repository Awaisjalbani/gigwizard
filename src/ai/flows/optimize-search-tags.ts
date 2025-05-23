
'use server';

/**
 * @fileOverview Optimizes search tags for a Fiverr gig based on a main keyword,
 * simulating deep keyword research using a tool.
 *
 * - optimizeSearchTags - A function that optimizes search tags for a Fiverr gig.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { OptimizeSearchTagsInput, OptimizeSearchTagsOutput } from '@/ai/schemas/gig-generation-schemas';
import { OptimizeSearchTagsInputSchema, OptimizeSearchTagsOutputSchema } from '@/ai/schemas/gig-generation-schemas';

// Simulated Tool: Pretends to fetch keyword analytics
const fetchKeywordAnalyticsTool = ai.defineTool(
  {
    name: 'fetchKeywordAnalyticsTool',
    description: 'Simulates fetching keyword analytics (like search volume, competition, related terms) from tools like Google Keywords or Semrush for a given main keyword, category, and subcategory context.',
    inputSchema: z.object({
      mainKeyword: z.string().describe('The main keyword for the gig.'),
      category: z.string().describe('The gig category for context.'),
      subcategory: z.string().describe('The gig subcategory for context.'),
    }),
    outputSchema: z.object({
      relatedKeywords: z.array(z.object({
        term: z.string().describe('A related keyword term.'),
        // These are simulated values
        volume: z.enum(['High', 'Medium', 'Low']).describe('Simulated search volume.'),
        competition: z.enum(['High', 'Medium', 'Low']).describe('Simulated competition level.'),
      })).describe('A list of simulated related keywords with their analytics.'),
    }),
  },
  async (input: { mainKeyword: string; category: string; subcategory: string; }) => {
    // Simulate API call or research. Return mock data.
    // This mock data should be diverse and reflect potential real-world scenarios.
    const baseKeywords = [
      { term: `${input.mainKeyword} services`, volume: 'Medium', competition: 'Medium' },
      { term: `best ${input.mainKeyword}`, volume: 'High', competition: 'High' },
      { term: `hire ${input.mainKeyword} expert`, volume: 'Medium', competition: 'Medium' },
      { term: `affordable ${input.mainKeyword}`, volume: 'Low', competition: 'Low' },
      { term: `${input.subcategory} ${input.mainKeyword}`, volume: 'High', competition: 'Medium' },
      { term: `${input.category} expert`, volume: 'Medium', competition: 'High' },
      { term: `custom ${input.mainKeyword}`, volume: 'Medium', competition: 'Low' },
      { term: `professional ${input.mainKeyword}`, volume: 'High', competition: 'Medium' },
      { term: `${input.mainKeyword} for business`, volume: 'Medium', competition: 'Medium' },
      { term: `freelance ${input.mainKeyword}`, volume: 'Low', competition: 'Low' },
    ];
    // Shuffle and pick a few to make it seem dynamic
    return { relatedKeywords: baseKeywords.sort(() => 0.5 - Math.random()).slice(0, 7) };
  }
);


export async function optimizeSearchTags(
  input: OptimizeSearchTagsInput
): Promise<OptimizeSearchTagsOutput> {
  return optimizeSearchTagsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'optimizeSearchTagsPrompt',
  input: {schema: OptimizeSearchTagsInputSchema},
  output: {schema: OptimizeSearchTagsOutputSchema},
  tools: [fetchKeywordAnalyticsTool], // Make the tool available to the LLM
  prompt: `You are an expert in Fiverr SEO and keyword research.
  Your task is to select exactly 5 highly optimized search tags for a Fiverr gig.

  Gig Details:
  - Main Keyword: {{{mainKeyword}}}
  - Title: {{{gigTitle}}}
  - Category: {{{category}}}
  - Subcategory: {{{subcategory}}}

  Use the 'fetchKeywordAnalyticsTool' to get simulated data on related keywords, their search volume, and competition.
  Based on the tool's output and your expertise, choose 5 tags that:
  1. Are highly relevant to the gig's main keyword, title, and category.
  2. Prioritize terms with good search volume (Medium or High if possible).
  3. Favor less competitive terms (Low or Medium if good volume).
  4. Adhere to Fiverr best practices for tags (e.g., character limits, clarity, no special characters unless part of the keyword).
  5. The main keyword itself can be one of the tags if it's strong.

  Provide the 5 search tags as an array of strings.
  IMPORTANT: Ensure the generated search tags are unique and strategically chosen based on the (simulated) analytics each time, even for the same input keyword. Avoid generic tags unless data supports them.
  `,
});

const optimizeSearchTagsFlow = ai.defineFlow(
  {
    name: 'optimizeSearchTagsFlow',
    inputSchema: OptimizeSearchTagsInputSchema,
    outputSchema: OptimizeSearchTagsOutputSchema,
  },
  async (input: OptimizeSearchTagsInput) => {
    // The prompt will internally call the fetchKeywordAnalyticsTool
    const {output} = await prompt(input);
    if (!output?.searchTags || output.searchTags.length !== 5) {
        // Fallback or error handling if the LLM doesn't return exactly 5 tags
        console.warn("LLM did not return exactly 5 tags. Using a fallback strategy.");
        const fallbackTags = [
            input.mainKeyword, 
            `${input.subcategory}`,
            `${input.mainKeyword} pro`,
            `custom ${input.mainKeyword}`,
            `${input.category}`
        ].slice(0,5); // Ensure only 5
        return { searchTags: fallbackTags.filter((tag, index, self) => self.indexOf(tag) === index) }; // ensure unique
    }
    return output!;
  }
);
