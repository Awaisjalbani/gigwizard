
'use server';
/**
 * @fileOverview This file defines a Genkit flow for suggesting client requirements for a Fiverr gig,
 * tailored to the specific gig details.
 *
 * - suggestRequirements - A function that orchestrates the requirement suggestion process.
 */

import {ai} from '@/ai/genkit';
import type { SuggestRequirementsInput, SuggestRequirementsOutput } from '@/ai/schemas/gig-generation-schemas';
import { SuggestRequirementsInputSchema, SuggestRequirementsOutputSchema } from '@/ai/schemas/gig-generation-schemas';


export async function suggestRequirements(input: SuggestRequirementsInput): Promise<SuggestRequirementsOutput> {
  return suggestRequirementsFlow(input);
}

const suggestRequirementsPrompt = ai.definePrompt({
  name: 'suggestRequirementsPrompt',
  input: {schema: SuggestRequirementsInputSchema},
  output: {schema: SuggestRequirementsOutputSchema},
  prompt: `You are an expert Fiverr gig creator.
  Given the following gig details:
  - Title: {{{gigTitle}}}
  - Category: {{{gigCategory}}}
  - Subcategory: {{{gigSubcategory}}}
  - Description: {{{gigDescription}}}

  Suggest a list of 3-5 essential requirements that the Fiverr seller should ask from their client to start working effectively on this specific gig.
  The requirements should be clear, concise, and directly relevant to the service described.
  Focus on what is absolutely necessary to begin the work.

  Output a JSON array of strings.
  IMPORTANT: Ensure the generated requirements are unique and substantially varied each time this prompt is run, even for the same input gig details. Do not repeat previous lists of requirements. Think about different angles or specific details that might be relevant for this particular combination of gig info.
  For example, instead of just "Brand guidelines", consider "Your brand's logo files (vector preferred) and any existing brand style guides." or "Please provide access to your hosting/domain if deployment is needed."
  Be specific and creative with the requirements each time.`,
});

const suggestRequirementsFlow = ai.defineFlow(
  {
    name: 'suggestRequirementsFlow',
    inputSchema: SuggestRequirementsInputSchema,
    outputSchema: SuggestRequirementsOutputSchema,
  },
  async (input: SuggestRequirementsInput) => {
    const {output} = await suggestRequirementsPrompt(input);
    if (!output?.requirements || output.requirements.length === 0) {
        // Fallback with more keyword-specific examples
        const fallbackRequirements = [
            `Specific goals for this ${input.gigSubcategory} project.`,
            `Any brand assets (logos, color palettes) for ${input.gigTitle}.`,
            `Examples of ${input.gigSubcategory} work you like or dislike.`,
            `Target audience details for the ${input.gigTitle} deliverable.`,
            `Your preferred timeline or any deadlines for the ${input.gigCategory} work.`
        ];
        const numToTake = Math.floor(Math.random() * 3) + 3; // 3 to 5
        
        // Shuffle and pick
        const shuffled = fallbackRequirements.sort(() => 0.5 - Math.random());
        return { requirements: shuffled.slice(0, numToTake) };
    }
    return output;
  }
);

