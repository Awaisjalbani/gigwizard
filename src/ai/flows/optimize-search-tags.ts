
'use server';

/**
 * @fileOverview Optimizes search tags for a Fiverr gig based on a main keyword,
 * simulating deep keyword research using a tool.
 *
 * - optimizeSearchTags - A function that optimizes search tags for a Fiverr gig.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { OptimizeSearchTagsInput, OptimizeSearchTagsOutput, SearchTagAnalytics } from '@/ai/schemas/gig-generation-schemas';
import { OptimizeSearchTagsInputSchema, OptimizeSearchTagsOutputSchema, SearchTagAnalyticsSchema } from '@/ai/schemas/gig-generation-schemas';

// Simulated Tool: Pretends to fetch keyword analytics
const fetchKeywordAnalyticsTool = ai.defineTool(
  {
    name: 'fetchKeywordAnalyticsTool',
    description: 'Simulates fetching keyword analytics (like search volume, competition, related terms) from tools like Google Keywords or Semrush for a given main keyword, category, and subcategory context. Returns a list of related keywords with their analytics.',
    inputSchema: z.object({
      mainKeyword: z.string().describe('The main keyword for the gig.'),
      category: z.string().describe('The gig category for context.'),
      subcategory: z.string().describe('The gig subcategory for context.'),
    }),
    outputSchema: z.object({
      relatedKeywords: z.array(SearchTagAnalyticsSchema).describe('A list of simulated related keywords with their analytics.'),
    }),
  },
  async (input: { mainKeyword: string; category: string; subcategory: string; }) => {
    // Simulate API call or research. Return mock data.
    // This mock data should be diverse and reflect potential real-world scenarios.
    const volumes: Array<'High' | 'Medium' | 'Low'> = ['High', 'Medium', 'Low'];
    const competitions: Array<'High' | 'Medium' | 'Low'> = ['High', 'Medium', 'Low'];
    
    const getRandom = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

    const baseKeywords: SearchTagAnalytics[] = [
      { term: `${input.mainKeyword} services`, volume: getRandom(volumes), competition: getRandom(competitions) },
      { term: `best ${input.mainKeyword}`, volume: getRandom(volumes), competition: getRandom(competitions) },
      { term: `hire ${input.mainKeyword} expert`, volume: getRandom(volumes), competition: getRandom(competitions) },
      { term: `affordable ${input.mainKeyword}`, volume: getRandom(volumes), competition: getRandom(competitions) },
      { term: `${input.subcategory} ${input.mainKeyword}`, volume: getRandom(volumes), competition: getRandom(competitions) },
      { term: `${input.category} services`, volume: getRandom(volumes), competition: getRandom(competitions) },
      { term: `custom ${input.mainKeyword}`, volume: getRandom(volumes), competition: getRandom(competitions) },
      { term: `professional ${input.mainKeyword}`, volume: getRandom(volumes), competition: getRandom(competitions) },
      { term: `${input.mainKeyword} for business`, volume: getRandom(volumes), competition: getRandom(competitions) },
      { term: `freelance ${input.mainKeyword}`, volume: getRandom(volumes), competition: getRandom(competitions) },
      { term: `${input.mainKeyword}`, volume: 'High', competition: 'High' }, // Ensure main keyword is an option
      { term: `${input.subcategory}`, volume: 'Medium', competition: 'Medium' },
      { term: `${input.category}`, volume: 'Medium', competition: 'Medium' },
      // Added more specific/long-tail variations for diversity
      { term: `top rated ${input.mainKeyword}`, volume: getRandom(volumes), competition: getRandom(competitions) },
      { term: `${input.mainKeyword} solutions`, volume: getRandom(volumes), competition: getRandom(competitions) },
      { term: `quick ${input.mainKeyword} delivery`, volume: getRandom(volumes), competition: getRandom(competitions) },
      { term: `${input.mainKeyword} specialist`, volume: getRandom(volumes), competition: getRandom(competitions) },
      { term: `online ${input.mainKeyword} help`, volume: getRandom(volumes), competition: getRandom(competitions) },
    ];
    // Shuffle and pick a few to make it seem dynamic, ensuring some variety.
    // Filter out duplicates by term before returning.
    const uniqueKeywords = baseKeywords.filter((value, index, self) =>
      index === self.findIndex((t) => (
        t.term === value.term
      ))
    );
    return { relatedKeywords: uniqueKeywords.sort(() => 0.5 - Math.random()).slice(0, 12) }; // Increased pool size
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

  Use the 'fetchKeywordAnalyticsTool' to get simulated data on related keywords, their search volume (High, Medium, Low), and competition (High, Medium, Low).
  Based on the tool's output and your expertise, choose 5 tags that:
  1. Are highly relevant to the gig's main keyword, title, and category.
  2. Prioritize terms with good search volume (Medium or High if possible).
  3. Favor less competitive terms (Low or Medium if good volume).
  4. Adhere to Fiverr best practices for tags (e.g., character limits, clarity, no special characters unless part of the keyword). Each tag typically is 1-3 words.
  5. The main keyword itself can be one of the tags if it's strong.
  6. Ensure the final list of 5 tags contains unique terms.

  Provide the 5 search tags as an array of objects, where each object has 'term', 'volume', and 'competition' fields.
  The 'volume' and 'competition' fields should reflect the data obtained from the tool for the chosen term.
  IMPORTANT: Ensure the generated search tags are unique and strategically chosen based on the (simulated) analytics each time, even for the same input keyword. Avoid generic tags unless data supports them, and try to provide a varied set of tags that cover different angles if possible.
  Output exactly 5 tags.
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
    if (!output?.searchTags || output.searchTags.length === 0) {
        console.warn("LLM did not return search tags. Using a fallback strategy.");
        const fallbackTags: SearchTagAnalytics[] = [
            { term: input.mainKeyword, volume: 'Medium', competition: 'Medium' },
            { term: `${input.subcategory}`, volume: 'Low', competition: 'Low' },
            { term: `${input.mainKeyword} expert`, volume: 'High', competition: 'Medium' },
            { term: `custom ${input.mainKeyword}`, volume: 'Medium', competition: 'Low' },
            { term: `${input.category} specialist`, volume: 'Medium', competition: 'High' }
        ].slice(0,5).filter((tag, index, self) => self.findIndex(t => t.term === tag.term) === index); 
        // Ensure no duplicates in fallback
        while (fallbackTags.length < 5) {
            fallbackTags.push({term: `unique fallback ${fallbackTags.length + 1}`, volume: 'Low', competition: 'Low'});
        }
        return { searchTags: fallbackTags.slice(0,5) };
    }
    // Ensure exactly 5 tags are returned, preferring the AI's selection
    let finalTags = output.searchTags.filter((tag, index, self) => self.findIndex(t => t.term === tag.term) === index); // Remove duplicates from AI

    if (finalTags.length > 5) {
        finalTags = finalTags.slice(0, 5);
    } else if (finalTags.length < 5) {
        console.warn(`LLM returned ${finalTags.length} tags, expected 5. Padding with fallbacks.`);
        const fallbackOptions: SearchTagAnalytics[] = [
            { term: input.mainKeyword, volume: 'Medium', competition: 'Medium' },
            { term: input.subcategory, volume: 'Low', competition: 'Low' },
            { term: input.category, volume: 'Low', competition: 'Medium'},
            { term: `${input.mainKeyword} services`, volume: 'High', competition: 'High' },
            { term: `professional ${input.mainKeyword}`, volume: 'Medium', competition: 'Medium' },
            { term: `fast ${input.mainKeyword}`, volume: 'Low', competition: 'Medium' },
            { term: `${input.mainKeyword} pro`, volume: 'Medium', competition: 'High' }
        ];
        let i = 0;
        while(finalTags.length < 5 && i < fallbackOptions.length) {
            if (!finalTags.find(t => t.term === fallbackOptions[i].term)) {
                finalTags.push(fallbackOptions[i]);
            }
            i++;
        }
         // Ensure 5 tags even if all fallbacks are used up and duplicates existed
        while (finalTags.length < 5) {
            finalTags.push({term: `extra fallback ${finalTags.length + 1}`, volume: 'Low', competition: 'Low'});
        }
    }
    // Ensure all tags have at least default analytics if missing (shouldn't happen with schema)
    finalTags = finalTags.map(tag => ({
        term: tag.term,
        volume: tag.volume || 'Low',
        competition: tag.competition || 'Low'
    }));
    
    return { searchTags: finalTags.slice(0,5) }; // Final trim to 5
  }
);

