// src/ai/flows/suggest-requirements.ts
'use server';
/**
 * @fileOverview This file defines a Genkit flow for suggesting client requirements for a Fiverr gig.
 *
 * The flow analyzes the gig's category and description to determine what information
 * the user (Fiverr seller) needs from the client to start working on the gig.
 *
 * @interface SuggestRequirementsInput - The input type for the suggestRequirements function.
 * @interface SuggestRequirementsOutput - The output type for the suggestRequirements function.
 * @function suggestRequirements - A function that orchestrates the requirement suggestion process.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Define the input schema
const SuggestRequirementsInputSchema = z.object({
  gigCategory: z.string().describe('The category of the gig.'),
  gigDescription: z.string().describe('The description of the gig.'),
});
export type SuggestRequirementsInput = z.infer<typeof SuggestRequirementsInputSchema>;

// Define the output schema
const SuggestRequirementsOutputSchema = z.object({
  requirements: z
    .array(z.string())
    .describe('A list of suggested requirements from the client.'),
});
export type SuggestRequirementsOutput = z.infer<typeof SuggestRequirementsOutputSchema>;

// Define the main function that will be called
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

Requirements:`,
});

// Define the flow
const suggestRequirementsFlow = ai.defineFlow(
  {
    name: 'suggestRequirementsFlow',
    inputSchema: SuggestRequirementsInputSchema,
    outputSchema: SuggestRequirementsOutputSchema,
  },
  async input => {
    const {output} = await suggestRequirementsPrompt(input);
    return output!;
  }
);
