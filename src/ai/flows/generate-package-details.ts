
'use server';
/**
 * @fileOverview Generates detailed, highly converting pricing package details for a Fiverr gig.
 *
 * - generatePackageDetails - A function that generates pricing package details.
 */

import {ai} from '@/ai/genkit';
import type { GeneratePackageDetailsInput, GeneratePackageDetailsOutput } from '@/ai/schemas/gig-generation-schemas';
import { GeneratePackageDetailsInputSchema, GeneratePackageDetailsOutputSchema } from '@/ai/schemas/gig-generation-schemas';


export async function generatePackageDetails(input: GeneratePackageDetailsInput): Promise<GeneratePackageDetailsOutput> {
  return generatePackageDetailsFlow(input);
}

const generateDetailsPrompt = ai.definePrompt({
  name: 'generatePackageDetailsPrompt',
  input: {schema: GeneratePackageDetailsInputSchema},
  output: {schema: GeneratePackageDetailsOutputSchema},
  prompt: `You are an expert Fiverr gig strategist specializing in creating highly converting service packages.
Your task is to generate three distinct packages (Basic, Standard, Premium) for a gig related to the main keyword: {{{mainKeyword}}}.

You have been provided with AI-suggested reference prices:
- Basic Reference Price: {{{basePrice}}}
- Standard Reference Price: {{{standardPrice}}}
- Premium Reference Price: {{{premiumPrice}}}

Use these reference prices as a guideline, but feel free to adjust them slightly if it makes sense for the value offered in each package. The final prices in your output should be the ones you deem most appropriate for conversion.

For each package (Basic, Standard, Premium), provide:
1.  A compelling 'name' (e.g., "Starter Kit", "Growth Engine", "Ultimate Boost").
2.  The final 'price' you determined.
3.  A detailed 'description' of services included. This description must be based on deep research for the '{{{mainKeyword}}}' niche. Highlight unique selling points and what makes the service stand out. Focus on benefits for the buyer.
4.  A realistic 'deliveryTime' (e.g., "3 Days").
5.  The number of 'revisions' offered.

Ensure that each package tier offers progressively more value. The descriptions should clearly articulate these differences. The goal is to create packages that are attractive and encourage buyers to choose higher-value options.
Make the packages highly converting by offering clear value propositions.
`,
});

const generatePackageDetailsFlow = ai.defineFlow(
  {
    name: 'generatePackageDetailsFlow',
    inputSchema: GeneratePackageDetailsInputSchema,
    outputSchema: GeneratePackageDetailsOutputSchema,
  },
  async (input: GeneratePackageDetailsInput) => {
    // Ensure the prices from input are used if AI is not supposed to change them,
    // or allow AI to adjust as per prompt instructions.
    // The current prompt allows AI to adjust, so we directly pass the input prices.
    // If prices were fixed, we might construct the output prices here post-AI call.

    const {output} = await generateDetailsPrompt(input);
    
    // Ensure prices in output match or are derived from input if needed,
    // but the current prompt allows the AI to set the final price.
    // For now, we trust the AI to use the reference prices correctly as per the prompt.
    // If we wanted to strictly enforce the input prices, we would do something like:
    // if (output) {
    //   output.basic.price = input.basePrice;
    //   output.standard.price = input.standardPrice;
    //   output.premium.price = input.premiumPrice;
    // }
    return output!;
  }
);
