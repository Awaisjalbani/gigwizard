
'use server';
/**
 * @fileOverview Generates detailed, highly converting pricing package details for a Fiverr gig,
 * including specific features, using AI-suggested base prices and aiming for uniqueness and value.
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
3.  A concise 'description' (around 20-30 words, STRICTLY under 100 characters). This description should be a high-level overview or a compelling summary of the package's core value proposition. Avoid listing detailed features here; use the 'features' list for that. It should be unique and varied.
4.  A list of 2-5 specific 'features' or deliverables. These features MUST:
    - Be tailored to the main keyword '{{{mainKeyword}}}' and category '{{{category}}} > {{{subcategory}}}'. For example, if the keyword is "logo design", features might be "2 Initial Concepts", "Source File", "3D Mockup". If it's "article writing", features might be "500 Words", "SEO Optimization", "Topic Research".
    - Clearly differentiate the value between Basic, Standard, and Premium tiers (e.g., Basic: "1 Concept", Standard: "3 Concepts", Premium: "5 Concepts + Stationery").
    - Be unique and varied for each package and each time this prompt is run.
    - Example: ["3 Pages Included", "Content Upload", "Speed Optimization", "Source File", "2 Logo Concepts"]
5.  A realistic 'deliveryTime' (e.g., "3 Days", "1 Week").
6.  The number of 'revisions' offered (e.g., "1 Revision", "Unlimited Revisions").

Critical Instructions for Uniqueness and Quality:
- Each time you generate these packages, ensure the 'title', 'description', 'features', 'deliveryTime', and 'revisions' for ALL THREE packages are substantially unique and varied, even if the input keyword, title, category, and prices are the same as a previous request. AVOID REPETITION.
- Ensure that each package tier offers progressively more value. The descriptions and feature lists must clearly articulate these differences.
- The goal is to create packages that are attractive, competitive, and encourage buyers to choose higher-value options by showcasing standout value.
- Model the package structure (what's typically included at each tier for features) based on (simulated analysis of) top-performing gigs for similar services.
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
        // Fallback if AI fails completely
        const defaultFeatures = ["Core Service Delivery", "Standard Support"];
        return {
            basic: { title: "Basic Package", price: input.basePrice, description: "Essential services to get you started.", features: defaultFeatures, deliveryTime: "3 Days", revisions: "1 Revision" },
            standard: { title: "Standard Package", price: input.standardPrice, description: "More comprehensive services for better results.", features: [...defaultFeatures, "Enhanced Feature 1"], deliveryTime: "5 Days", revisions: "3 Revisions" },
            premium: { title: "Premium Package", price: input.premiumPrice, description: "The complete solution for maximum impact.", features: [...defaultFeatures, "Enhanced Feature 1", "Premium Only Feature"], deliveryTime: "7 Days", revisions: "Unlimited Revisions" },
        };
    }
    // Ensure prices match the input reference prices, as per prompt instruction.
    output.basic.price = input.basePrice;
    output.standard.price = input.standardPrice;
    output.premium.price = input.premiumPrice;

    // Ensure features array exists, even if empty, if AI omits it (though Zod optional handles undefined)
    for (const pkg of [output.basic, output.standard, output.premium]) {
        if (!pkg.features) {
            pkg.features = [`Default feature for ${pkg.title || 'package'}`]; 
        }
         if (pkg.features.length === 0) {
            pkg.features.push(`Key deliverable for ${pkg.title || 'package'}`);
        }
    }
    
    return output;
  }
);

