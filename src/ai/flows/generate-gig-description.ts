'use server';

/**
 * @fileOverview Generates a compelling gig description with relevant FAQs based on the main keyword and top-performing gigs.
 *
 * - generateGigDescription - A function that generates a gig description.
 * - GenerateGigDescriptionInput - The input type for the generateGigDescription function.
 * - GenerateGigDescriptionOutput - The return type for the generateGigDescription function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateGigDescriptionInputSchema = z.object({
  mainKeyword: z.string().describe('The main keyword for the Fiverr gig.'),
  topGigData: z
    .string()
    .describe(
      'Data from top-performing gigs in the analyzed category, including features and FAQs.  This can be the HTML content of those gigs.'
    ),
});
export type GenerateGigDescriptionInput = z.infer<typeof GenerateGigDescriptionInputSchema>;

const GenerateGigDescriptionOutputSchema = z.object({
  gigDescription: z.string().describe('The generated gig description.'),
  faqs: z.array(z.string()).describe('Relevant FAQs for the gig.'),
});
export type GenerateGigDescriptionOutput = z.infer<typeof GenerateGigDescriptionOutputSchema>;

export async function generateGigDescription(input: GenerateGigDescriptionInput): Promise<GenerateGigDescriptionOutput> {
  return generateGigDescriptionFlow(input);
}

const generateDescriptionPrompt = ai.definePrompt({
  name: 'generateDescriptionPrompt',
  input: {schema: GenerateGigDescriptionInputSchema},
  output: {schema: GenerateGigDescriptionOutputSchema},
  prompt: `You are an expert Fiverr gig description writer.

  Based on the main keyword: {{{mainKeyword}}} and the following data from top-performing gigs:

  {{topGigData}}

  Generate a compelling gig description and a list of relevant FAQs.

  The gig description should highlight the key features and benefits of the service.

  The FAQs should address common questions that potential buyers may have.
  Make the gig description SEO optimized, highlight what the user will get, and why they should choose us.
  Format the output in markdown.
  `,
});

const generateGigDescriptionFlow = ai.defineFlow(
  {
    name: 'generateGigDescriptionFlow',
    inputSchema: GenerateGigDescriptionInputSchema,
    outputSchema: GenerateGigDescriptionOutputSchema,
  },
  async input => {
    const {output} = await generateDescriptionPrompt(input);
    return output!;
  }
);
