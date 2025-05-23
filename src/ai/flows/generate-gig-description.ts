
'use server';

/**
 * @fileOverview Generates a compelling gig description with relevant FAQs based on the main keyword and top-performing gigs.
 *
 * - generateGigDescription - A function that generates a gig description.
 */

import {ai} from '@/ai/genkit';
import type { GenerateGigDescriptionInput, GenerateGigDescriptionOutput } from '@/ai/schemas/gig-generation-schemas';
import { GenerateGigDescriptionInputSchema, GenerateGigDescriptionOutputSchema } from '@/ai/schemas/gig-generation-schemas';


export async function generateGigDescription(input: GenerateGigDescriptionInput): Promise<GenerateGigDescriptionOutput> {
  return generateGigDescriptionFlow(input);
}

const generateDescriptionPrompt = ai.definePrompt({
  name: 'generateDescriptionPrompt',
  input: {schema: GenerateGigDescriptionInputSchema},
  output: {schema: GenerateGigDescriptionOutputSchema},
  prompt: `You are an expert Fiverr gig description writer.

  Based on the main keyword: {{{mainKeyword}}} and the following data from top-performing gigs:

  {{{topGigData}}}

  Generate a compelling gig description and a list of 2-3 relevant and concise FAQs.

  The gig description should:
  - Be SEO optimized for the main keyword.
  - Clearly highlight what the user will get (key features and benefits).
  - Explain why the buyer should choose this service (unique selling points).
  - Be formatted in Markdown.

  The FAQs should:
  - Be a list of 2 to 3 frequently asked questions.
  - Each FAQ must have a clear 'question' and a direct, helpful 'answer'.
  - Avoid lengthy questions or answers. Keep them concise.
  `,
});

const generateGigDescriptionFlow = ai.defineFlow(
  {
    name: 'generateGigDescriptionFlow',
    inputSchema: GenerateGigDescriptionInputSchema,
    outputSchema: GenerateGigDescriptionOutputSchema,
  },
  async (input: GenerateGigDescriptionInput) => {
    const {output} = await generateDescriptionPrompt(input);
    return output!;
  }
);
