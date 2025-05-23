
// src/ai/flows/suggest-requirements.ts
'use server';
/**
 * @fileOverview This file defines a Genkit flow for suggesting client requirements for a Fiverr gig.
 *
 * The flow analyzes the gig's category and description to determine what information
 * the user (Fiverr seller) needs from the client to start working on the gig.
 *
 * @function suggestRequirements - A function that orchestrates the requirement suggestion process.
 */

import {ai} from '@/ai/genkit';
import type { SuggestRequirementsInput, SuggestRequirementsOutput } from '@/ai/schemas/gig-generation-schemas';
import { SuggestRequirementsInputSchema, SuggestRequirementsOutputSchema } from '@/ai/schemas/gig-generation-schemas';


export async function suggestRequirements(input: SuggestRequirementsInput): Promise<SuggestRequirementsOutput> {
  return suggestRequirementsFlow(input);
}

// Define the prompt
const suggestRequirementsPrompt = ai.definePrompt({
  name: 'suggestRequirementsPrompt',
  input: {schema: SuggestRequirementsInputSchema},
  output: {schema: SuggestRequirementsOutputSchema},
  prompt: `You are an expert Fiverr gig creator. Given the following gig category and description, suggest a list of requirements that the user should ask from their client to start working on the gig.

Category: {{{gigCategory}}}
Description: {{{gigDescription}}}

Requirements:
IMPORTANT: Ensure the generated requirements are unique and varied each time, even for the same input category and description.`,
});

// Define the flow
const suggestRequirementsFlow = ai.defineFlow(
  {
    name: 'suggestRequirementsFlow',
    inputSchema: SuggestRequirementsInputSchema,
    outputSchema: SuggestRequirementsOutputSchema,
  },
  async (input: SuggestRequirementsInput) => {
    const {output} = await suggestRequirementsPrompt(input);
    return output!;
  }
);
