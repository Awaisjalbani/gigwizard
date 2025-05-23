
'use server';
/**
 * @fileOverview Fiverr gig title generator AI agent.
 * Aims to create highly optimized titles using power words and best practices.
 *
 * - generateGigTitle - A function that handles the gig title generation process.
 */

import {ai} from '@/ai/genkit';
import type { GenerateGigTitleInput, GenerateGigTitleOutput } from '@/ai/schemas/gig-generation-schemas';
import { GenerateGigTitleInputSchema, GenerateGigTitleOutputSchema } from '@/ai/schemas/gig-generation-schemas';


export async function generateGigTitle(input: GenerateGigTitleInput): Promise<GenerateGigTitleOutput> {
  return generateGigTitleFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateGigTitlePrompt',
  input: {schema: GenerateGigTitleInputSchema},
  output: {schema: GenerateGigTitleOutputSchema},
  prompt: `You are an expert in creating highly optimized Fiverr gig titles.

  Based on the main keyword: "{{{mainKeyword}}}"

  Generate one compelling and effective gig title that:
  - Starts with "I will..."
  - Is optimized for Fiverr search (incorporate the main keyword naturally).
  - Uses power words to increase click-through rate (e.g., "premium," "professional," "custom," "expert," "fast," "convert").
  - Is clear, concise, and accurately reflects the service offered.
  - Adheres to Fiverr's character limits for titles (typically around 60-80 characters, aim for optimal length).
  - Avoids all caps and excessive special characters.

  IMPORTANT: Ensure the generated gig title is unique and substantially varied each time this prompt is run, even for the same input keyword. Do not repeat previous titles.
  Provide only the gig title string as the output.`,
});

const generateGigTitleFlow = ai.defineFlow(
  {
    name: 'generateGigTitleFlow',
    inputSchema: GenerateGigTitleInputSchema,
    outputSchema: GenerateGigTitleOutputSchema,
  },
  async (input: GenerateGigTitleInput) => {
    const {output} = await prompt(input);
    if (!output?.gigTitle) {
        throw new Error("AI failed to generate a gig title.");
    }
    return output!;
  }
);
