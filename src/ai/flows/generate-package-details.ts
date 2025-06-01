
'use server';
/**
 * @fileOverview Generates detailed, highly converting pricing package details for a Fiverr gig,
 * including specific features, using AI-suggested base prices and aiming for uniqueness and value.
 *
 * - generatePackageDetails - A function that generates pricing package details.
 */

import {ai} from '@/ai/genkit';
import type { GeneratePackageDetailsInput, GeneratePackageDetailsOutput } from '@/ai/schemas/gig-generation-schemas';
import { GeneratePackageDetailsInputSchema, GeneratePackageDetailsOutputSchema, SinglePackageDetailSchema } from '@/ai/schemas/gig-generation-schemas';
import { z } from 'genkit';


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
3.  A concise 'description'. CRITICAL: This description MUST be a high-level overview or a compelling summary of the package's core value proposition. It MUST be around 20-30 words and ABSOLUTELY, STRICTLY under 100 characters. DO NOT exceed 100 characters. This is a hard limit. Avoid listing detailed features here; use the 'features' list for that. It should be unique and varied.
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
- REMEMBER THE ABSOLUTE HARD LIMIT: Package descriptions ('description' field) MUST BE UNDER 100 CHARACTERS.
`,
});

const generatePackageDetailsFlow = ai.defineFlow(
  {
    name: 'generatePackageDetailsFlow',
    inputSchema: GeneratePackageDetailsInputSchema,
    outputSchema: GeneratePackageDetailsOutputSchema,
  },
  async (input: GeneratePackageDetailsInput): Promise<GeneratePackageDetailsOutput> => {
    const {output: aiOutput} = await generateDetailsPrompt(input);
    
    let result: GeneratePackageDetailsOutput;

    const fallbackPackage = (price: number, titlePrefix: string): z.infer<typeof SinglePackageDetailSchema> => ({
        title: `${titlePrefix} Package Default`,
        price: price,
        description: "High-quality service. Max 100 characters for this description.", // Fallback description under 100 chars
        features: ["Core Service Feature", "Standard Support Included"],
        deliveryTime: "Contact Seller",
        revisions: "1 Revision"
    });

    if (!aiOutput) {
        console.warn("AI output for package details was completely missing. Using fallbacks for all packages.");
        result = {
            basic: fallbackPackage(input.basePrice, "Basic"),
            standard: fallbackPackage(input.standardPrice, "Standard"),
            premium: fallbackPackage(input.premiumPrice, "Premium"),
        };
    } else {
        // Use AI output as the base, ensuring it conforms to the overall structure
        // It's safer to build the result object field by field from aiOutput if its structure can be inconsistent
        // For now, assume aiOutput at least has basic, standard, premium keys if not null
        result = {
            basic: aiOutput.basic || fallbackPackage(input.basePrice, "Basic"),
            standard: aiOutput.standard || fallbackPackage(input.standardPrice, "Standard"),
            premium: aiOutput.premium || fallbackPackage(input.premiumPrice, "Premium"),
        };
    }
    
    const packageKeys = ['basic', 'standard', 'premium'] as const;

    for (const key of packageKeys) {
        // Ensure the package object itself exists on the result, if not, use fallback
        if (!result[key]) {
             console.warn(`Package object for '${key}' was missing from AI output or initial result. Using full fallback.`);
             result[key] = fallbackPackage(
                key === 'basic' ? input.basePrice : key === 'standard' ? input.standardPrice : input.premiumPrice,
                key.charAt(0).toUpperCase() + key.slice(1)
            );
        }
        
        const currentPackage = result[key]; // currentPackage is now guaranteed to be an object

        // Set price from input, overriding AI if necessary
        currentPackage.price = key === 'basic' ? input.basePrice : key === 'standard' ? input.standardPrice : input.premiumPrice;

        // Ensure title exists
        if (!currentPackage.title) {
            console.warn(`Package '${key}' title was missing. Setting a default.`);
            currentPackage.title = `${key.charAt(0).toUpperCase() + key.slice(1)} Default Title`;
        }
        
        // Ensure description exists and then truncate if necessary
        if (!currentPackage.description) {
            console.warn(`Package '${key}' description was missing. Using fallback description.`);
            currentPackage.description = `High-quality ${key} service. Under 100 chars.`;
        }
        // THE CRITICAL TRUNCATION
        if (currentPackage.description.length > 100) {
            const originalDesc = currentPackage.description;
            console.warn(`Package '${key}' description was >100 chars (length: ${originalDesc.length}). Original: "${originalDesc}". Truncating...`);
            currentPackage.description = originalDesc.substring(0, 97) + "...";
            console.warn(`Package '${key}' description truncated to (length: ${currentPackage.description.length}): "${currentPackage.description}"`);
        }
        // Ensure description is not empty after potential truncation
         if (currentPackage.description.length === 0) {
            console.warn(`Package '${key}' description was empty. Setting a default.`);
            currentPackage.description = "Concise service overview.";
        }

        // Ensure features array exists and has at least one item
        if (!currentPackage.features || currentPackage.features.length === 0) {
            console.warn(`Package '${key}' features were missing or empty. Adding default features.`);
            currentPackage.features = [`Default feature for ${currentPackage.title || key}`];
             if (currentPackage.features.length === 0) { // Should not happen if above line works
                 currentPackage.features.push(`Essential item for ${currentPackage.title || key}`);
             }
        }
        
        // Ensure deliveryTime exists
        if (!currentPackage.deliveryTime) {
            console.warn(`Package '${key}' deliveryTime was missing. Setting a default.`);
            currentPackage.deliveryTime = "Contact Seller";
        }
        // Ensure revisions exist
        if (!currentPackage.revisions) {
            console.warn(`Package '${key}' revisions were missing. Setting a default.`);
            currentPackage.revisions = "Not specified";
        }
    }
    
    // Explicitly cast the validated and processed output before returning
    return result as GeneratePackageDetailsOutput;
  }
);

