
'use server';
/**
 * @fileOverview Suggests the optimal Fiverr category and subcategory for a gig.
 *
 * - suggestGigCategory - A function that suggests category and subcategory.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { SuggestGigCategoryInput, SuggestGigCategoryOutput } from '@/ai/schemas/gig-generation-schemas';
import { SuggestGigCategoryInputSchema, SuggestGigCategoryOutputSchema, SuggestedCategorySchema } from '@/ai/schemas/gig-generation-schemas';

// Simulated Tool: Pretends to fetch and analyze Fiverr category data
const fetchFiverrCategoryDataTool = ai.defineTool(
  {
    name: 'fetchFiverrCategoryDataTool',
    description: 'Simulates fetching Fiverr category data and performing analysis to determine the best category and subcategory for a gig based on its main keyword and title. Returns a suggested category and subcategory.',
    inputSchema: SuggestGigCategoryInputSchema,
    outputSchema: SuggestedCategorySchema,
  },
  async (input: SuggestGigCategoryInput): Promise<SuggestedCategory> => {
    // In a real scenario, this would involve API calls, database lookups, or complex logic.
    // For simulation, we'll use simple logic.
    const keyword = input.mainKeyword.toLowerCase();
    const title = input.gigTitle.toLowerCase();

    if (keyword.includes('logo') || title.includes('logo')) {
      return { category: 'Graphics & Design', subcategory: 'Logo Design' };
    }
    if (keyword.includes('website') || title.includes('website') || keyword.includes('web design') || title.includes('web design')) {
      return { category: 'Programming & Tech', subcategory: 'Website Development' };
    }
    if (keyword.includes('shopify') || title.includes('shopify')) {
      return { category: 'eCommerce Development', subcategory: 'Shopify' };
    }
    if (keyword.includes('article') || title.includes('article') || keyword.includes('blog') || title.includes('blog') || keyword.includes('write') || title.includes('write')) {
      return { category: 'Writing & Translation', subcategory: 'Articles & Blog Posts' };
    }
    if (keyword.includes('video edit') || title.includes('video edit') || keyword.includes('animation') || title.includes('animation')) {
      return { category: 'Video & Animation', subcategory: 'Video Editing' };
    }
    if (keyword.includes('social media') || title.includes('social media')) {
      return { category: 'Digital Marketing', subcategory: 'Social Media Marketing' };
    }
    // Default fallback
    return { category: 'General Services', subcategory: 'Other (AI Suggestion)' };
  }
);

const suggestCategoryPrompt = ai.definePrompt({
  name: 'suggestCategoryPrompt',
  input: { schema: z.object({ toolOutput: SuggestedCategorySchema, originalInput: SuggestGigCategoryInputSchema }) },
  output: { schema: SuggestGigCategoryOutputSchema },
  tools: [fetchFiverrCategoryDataTool], // Although tool is called by flow, listing it can help model understand context if needed for refinement
  prompt: `You are an expert Fiverr gig consultant.
  Based on the provided main keyword "{{originalInput.mainKeyword}}" and gig title "{{originalInput.gigTitle}}", the 'fetchFiverrCategoryDataTool' has suggested the following:
  - Category: {{toolOutput.category}}
  - Subcategory: {{toolOutput.subcategory}}

  Your task is to confirm or slightly refine this suggestion if absolutely necessary for better accuracy.
  The output should be the most appropriate category and subcategory.
  Ensure your final output strictly adheres to the JSON schema for category and subcategory.
  IMPORTANT: Ensure the final suggested category and subcategory are logical and consistent.
  `,
});


export async function suggestGigCategory(input: SuggestGigCategoryInput): Promise<SuggestGigCategoryOutput> {
  return suggestGigCategoryFlow(input);
}

const suggestGigCategoryFlow = ai.defineFlow(
  {
    name: 'suggestGigCategoryFlow',
    inputSchema: SuggestGigCategoryInputSchema,
    outputSchema: SuggestGigCategoryOutputSchema,
  },
  async (input: SuggestGigCategoryInput): Promise<SuggestGigCategoryOutput> => {
    // Step 1: Call the (simulated) tool to get an initial category suggestion.
    const toolOutput = await fetchFiverrCategoryDataTool(input);

    // Step 2: (Optional refinement with LLM) Pass tool output to prompt for confirmation or slight adjustment.
    // For this version, we will directly use the tool's output as it's a simulation.
    // If more nuanced AI refinement was needed, we would call `suggestCategoryPrompt` here.
    // const { output: refinedOutput } = await suggestCategoryPrompt({ toolOutput, originalInput: input });
    // if (!refinedOutput) {
    //   throw new Error('AI failed to refine category suggestion.');
    // }
    // return refinedOutput;

    // Direct return for now as the tool provides the structure we need.
    return {
        category: toolOutput.category,
        subcategory: toolOutput.subcategory,
    };
  }
);
