
'use server';
/**
 * @fileOverview Suggests the optimal Fiverr category and subcategory for a gig.
 *
 * - suggestGigCategory - A function that suggests category and subcategory.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { SuggestGigCategoryInput, SuggestGigCategoryOutput, SuggestedCategory } from '@/ai/schemas/gig-generation-schemas';
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
    const keyword = input.mainKeyword.toLowerCase();
    const title = input.gigTitle.toLowerCase();

    // More diverse mock suggestions
    if (keyword.includes('logo') || title.includes('logo')) {
      if (title.includes('minimalist')) return { category: 'Graphics & Design', subcategory: 'Minimalist Logo Design' };
      if (title.includes('3d')) return { category: 'Graphics & Design', subcategory: '3D Logo Design' };
      return { category: 'Graphics & Design', subcategory: 'Logo Design' };
    }
    if (keyword.includes('website') || title.includes('website') || keyword.includes('web design') || title.includes('web design')) {
      if (title.includes('wordpress')) return { category: 'Programming & Tech', subcategory: 'WordPress Development' };
      if (title.includes('landing page')) return { category: 'Programming & Tech', subcategory: 'Landing Page Design' };
      return { category: 'Programming & Tech', subcategory: 'Website Development' };
    }
    if (keyword.includes('shopify') || title.includes('shopify')) {
      if (title.includes('dropshipping')) return { category: 'eCommerce Development', subcategory: 'Shopify Dropshipping Store' };
      return { category: 'eCommerce Development', subcategory: 'Shopify Development' };
    }
    if (keyword.includes('article') || title.includes('article') || keyword.includes('blog') || title.includes('blog') || keyword.includes('write') || title.includes('write')) {
      if (title.includes('seo')) return { category: 'Writing & Translation', subcategory: 'SEO Article Writing' };
      return { category: 'Writing & Translation', subcategory: 'Articles & Blog Posts' };
    }
    if (keyword.includes('video edit') || title.includes('video edit')) {
      if (title.includes('youtube')) return { category: 'Video & Animation', subcategory: 'YouTube Video Editing' };
      if (title.includes('short form')) return { category: 'Video & Animation', subcategory: 'Short Form Video Editing' };
      return { category: 'Video & Animation', subcategory: 'Video Editing' };
    }
     if (keyword.includes('animation') || title.includes('animation')) {
      if (title.includes('whiteboard')) return { category: 'Video & Animation', subcategory: 'Whiteboard Animation' };
      return { category: 'Video & Animation', subcategory: '2D Animation' };
    }
    if (keyword.includes('social media') || title.includes('social media')) {
      if (title.includes('manager')) return { category: 'Digital Marketing', subcategory: 'Social Media Management' };
      if (title.includes('ads')) return { category: 'Digital Marketing', subcategory: 'Social Media Advertising' };
      return { category: 'Digital Marketing', subcategory: 'Social Media Marketing' };
    }
    if (keyword.includes('voice over') || title.includes('voice over')) {
        return { category: 'Music & Audio', subcategory: 'Voice Over' };
    }
    if (keyword.includes('data entry') || title.includes('data entry')) {
        return { category: 'Data', subcategory: 'Data Entry' };
    }
    // Default fallback
    return { category: 'Miscellaneous', subcategory: 'Other Services (AI Suggestion)' };
  }
);

const suggestCategoryPrompt = ai.definePrompt({
  name: 'suggestCategoryPrompt',
  // The input to this prompt is the output of the tool, plus the original input for context.
  input: { schema: z.object({ toolOutput: SuggestedCategorySchema, originalInput: SuggestGigCategoryInputSchema }) },
  output: { schema: SuggestGigCategoryOutputSchema },
  // Tools are not directly called by this prompt, but its input comes from a tool.
  prompt: `You are an expert Fiverr gig consultant.
  The 'fetchFiverrCategoryDataTool' has analyzed the main keyword "{{originalInput.mainKeyword}}" and gig title "{{originalInput.gigTitle}}" and suggested the following:
  - Category: {{toolOutput.category}}
  - Subcategory: {{toolOutput.subcategory}}

  Your task is to review this suggestion.
  If the suggestion is accurate and optimal, confirm it.
  If you believe a slight refinement would make it more precise for Fiverr, provide that refinement.
  The final output MUST be the most appropriate category and subcategory for the gig.
  Ensure your final output strictly adheres to the JSON schema (category and subcategory strings).
  For example, if the tool suggests "Programming & Tech" / "Website Development" for a title like "I will build a modern WordPress blog", that's good.
  If the tool suggests "Graphics & Design" / "Logo Design" for "I will write SEO articles", you should correct it to "Writing & Translation" / "SEO Article Writing" or similar.
  Focus on selecting the BEST FIT category and subcategory on Fiverr.
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

    // Step 2: Pass tool output and original input to the LLM prompt for confirmation or slight adjustment.
    const { output: refinedOutput } = await suggestCategoryPrompt({ toolOutput, originalInput: input });
    
    if (!refinedOutput || !refinedOutput.category || !refinedOutput.subcategory) {
      console.warn("AI failed to refine category suggestion. Falling back to tool's direct output.");
      return { // Ensure fallback provides both category and subcategory
          category: toolOutput.category || "General Services",
          subcategory: toolOutput.subcategory || "Other",
      };
    }
    return refinedOutput;
  }
);
