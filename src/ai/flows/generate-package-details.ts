
'use server';
/**
 * @fileOverview Generates detailed, highly converting pricing package details for a Fiverr gig,
 * using AI-suggested base prices and aiming for uniqueness and value.
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
Your task is to generate three distinct packages (Basic, Standard, Premium) for a gig.

Gig Context:
- Main Keyword: {{{mainKeyword}}}
- Gig Title: {{{gigTitle}}}
- Category: {{{category}}} > {{{subcategory}}}

Reference Prices (from previous AI analysis of competitors):
- Basic Reference Price: {{{basePrice}}}
- Standard Reference Price: {{{standardPrice}}}
- Premium Reference Price: {{{premiumPrice}}}

Use these reference prices as a strong guideline. Your final package prices should be these exact reference prices.

For each package (Basic, Standard, Premium), provide:
1.  A compelling and unique 'title' (e.g., "Keyword Starter Pack", "Growth Accelerator", "Ultimate Domination Kit"). Titles MUST be different for each package tier and unique per generation.
2.  The final 'price' (use the reference prices provided above).
3.  A detailed 'description' of services included. This description MUST:
    - Be concise, ideally around 30 words.
    - STRICTLY NOT exceed 180 characters.
    - Be based on (simulated) deep research for the '{{{mainKeyword}}}' niche within '{{{category}}} > {{{subcategory}}}'.
    - Clearly highlight unique selling points, key deliverables, and what makes this specific package tier stand out.
    - Focus on tangible benefits for the buyer.
    - Be unique and varied for each package and each time this prompt is run, even for the same input.
4.  A realistic 'deliveryTime' (e.g., "3 Days", "1 Week").
5.  The number of 'revisions' offered (e.g., "1 Revision", "Unlimited Revisions").

Critical Instructions for Uniqueness and Quality:
- Each time you generate these packages, ensure the 'title', 'description', 'deliveryTime', and 'revisions' for ALL THREE packages are substantially unique and varied, even if the input keyword, title, category, and prices are the same as a previous request. AVOID REPETITION.
- Ensure that each package tier offers progressively more value. The descriptions must clearly articulate these differences.
- The goal is to create packages that are attractive, competitive, and encourage buyers to choose higher-value options by showcasing standout value.
- Model the package structure (what's typically included at each tier) based on (simulated analysis of) top-performing gigs for similar services.
`,
});

const generatePackageDetailsFlow = ai.defineFlow(
  {
    name: 'generatePackageDetailsFlow',
    inputSchema: GeneratePackageDetailsInputSchema,
    outputSchema: GeneratePackageDetailsOutputSchema,
  },
  async (input: GeneratePackageDetailsInput) => {
    const {output} = await generateDetailsPrompt(input);
    if (!output) {
        throw new Error("AI failed to generate package details.");
    }
    // Ensure prices match the input reference prices, as per prompt instruction.
    // This acts as a safeguard if the LLM deviates.
    output.basic.price = input.basePrice;
    output.standard.price = input.standardPrice;
    output.premium.price = input.premiumPrice;
    
    return output;
  }
);
