
'use server';
/**
 * @fileOverview Generates detailed, highly converting pricing package details for a Fiverr gig,
 * including specific features, using AI-suggested base prices and aiming for uniqueness and value.
 * This flow now uses a "Raw" schema for direct AI output to allow for more lenient initial parsing,
 * and then strictly processes and validates the data against a final "Strict" schema.
 *
 * - generatePackageDetails - A function that generates pricing package details.
 */

import {ai} from '@/ai/genkit';
import type { GeneratePackageDetailsInput, GeneratePackageDetailsOutput, RawGeneratePackageDetailsOutput } from '@/ai/schemas/gig-generation-schemas';
import { GeneratePackageDetailsInputSchema, GeneratePackageDetailsOutputSchema, RawGeneratePackageDetailsOutputSchema } from '@/ai/schemas/gig-generation-schemas';
import { z } from 'genkit';

// Define a fallback structure that matches RawSinglePackageDetailSchema (without description length limit initially)
// This is used if the AI completely fails to return a package structure.
const fallbackRawPackageDefaults = (price: number, titlePrefix: string): z.infer<typeof import('@/ai/schemas/gig-generation-schemas').RawSinglePackageDetailSchema> => ({
    title: `${titlePrefix} Package Default`,
    price: price,
    description: "High-quality service. Default concise description.",
    features: ["Core Service Feature", "Standard Support Included"],
    deliveryTime: "Contact Seller",
    revisions: "1 Revision"
});


export async function generatePackageDetails(input: GeneratePackageDetailsInput): Promise<GeneratePackageDetailsOutput> {
  return generatePackageDetailsFlow(input);
}

const generateDetailsPrompt = ai.definePrompt({
  name: 'generatePackageDetailsPrompt',
  input: {schema: GeneratePackageDetailsInputSchema},
  // Use the RAW (more lenient) schema for the direct output of this prompt
  output: {schema: RawGeneratePackageDetailsOutputSchema},
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
3.  A concise 'description'. CRITICAL: This description MUST be a high-level overview or a compelling summary of the package's core value proposition. It MUST be ABSOLUTELY, STRICTLY 99 CHARACTERS OR LESS. To be safe, aim for 80-90 characters. DO NOT exceed 99 characters. This is a hard limit. Avoid listing detailed features here; use the 'features' list for that. It should be unique and varied.
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
- REMEMBER THE ABSOLUTE HARD LIMIT: Package descriptions ('description' field) MUST BE 99 CHARACTERS OR LESS.
`,
});


const generatePackageDetailsFlow = ai.defineFlow(
  {
    name: 'generatePackageDetailsFlow',
    inputSchema: GeneratePackageDetailsInputSchema,
    // The flow's final output must adhere to the STRICT schema
    outputSchema: GeneratePackageDetailsOutputSchema,
  },
  async (input: GeneratePackageDetailsInput): Promise<GeneratePackageDetailsOutput> => {
    console.log("[generatePackageDetailsFlow] Input:", JSON.stringify(input, null, 2));
    
    // The 'aiOutput' will be parsed according to RawGeneratePackageDetailsOutputSchema (lenient on description length)
    const {output: aiOutputUntyped} = await generateDetailsPrompt(input);
    const aiOutput = aiOutputUntyped as RawGeneratePackageDetailsOutput; // Cast for processing

    console.log("[generatePackageDetailsFlow] AI direct output (parsed as RawSchema):", JSON.stringify(aiOutput, null, 2));

    // Initialize the result object, which will be typed according to the strict GeneratePackageDetailsOutputSchema
    // We will carefully populate this, ensuring all constraints of the strict schema are met.
    const result: GeneratePackageDetailsOutput = {
        basic: {
            title: aiOutput?.basic?.title || fallbackRawPackageDefaults(input.basePrice, "Basic").title,
            price: input.basePrice, // Always use the input price
            description: aiOutput?.basic?.description || fallbackRawPackageDefaults(input.basePrice, "Basic").description,
            features: aiOutput?.basic?.features || fallbackRawPackageDefaults(input.basePrice, "Basic").features,
            deliveryTime: aiOutput?.basic?.deliveryTime || fallbackRawPackageDefaults(input.basePrice, "Basic").deliveryTime,
            revisions: aiOutput?.basic?.revisions || fallbackRawPackageDefaults(input.basePrice, "Basic").revisions,
        },
        standard: {
            title: aiOutput?.standard?.title || fallbackRawPackageDefaults(input.standardPrice, "Standard").title,
            price: input.standardPrice, // Always use the input price
            description: aiOutput?.standard?.description || fallbackRawPackageDefaults(input.standardPrice, "Standard").description,
            features: aiOutput?.standard?.features || fallbackRawPackageDefaults(input.standardPrice, "Standard").features,
            deliveryTime: aiOutput?.standard?.deliveryTime || fallbackRawPackageDefaults(input.standardPrice, "Standard").deliveryTime,
            revisions: aiOutput?.standard?.revisions || fallbackRawPackageDefaults(input.standardPrice, "Standard").revisions,
        },
        premium: {
            title: aiOutput?.premium?.title || fallbackRawPackageDefaults(input.premiumPrice, "Premium").title,
            price: input.premiumPrice, // Always use the input price
            description: aiOutput?.premium?.description || fallbackRawPackageDefaults(input.premiumPrice, "Premium").description,
            features: aiOutput?.premium?.features || fallbackRawPackageDefaults(input.premiumPrice, "Premium").features,
            deliveryTime: aiOutput?.premium?.deliveryTime || fallbackRawPackageDefaults(input.premiumPrice, "Premium").deliveryTime,
            revisions: aiOutput?.premium?.revisions || fallbackRawPackageDefaults(input.premiumPrice, "Premium").revisions,
        },
    };
    
    const packageKeys: Array<keyof GeneratePackageDetailsOutput> = ['basic', 'standard', 'premium'];

    for (const key of packageKeys) {
        const currentPackage = result[key]; // This is a part of the 'result' object to be returned

        // Ensure title exists and is not empty
        if (!currentPackage.title || currentPackage.title.trim().length === 0) {
            console.warn(`[generatePackageDetailsFlow] Package '${key}' title was missing or empty. Setting a default.`);
            currentPackage.title = `${key.charAt(0).toUpperCase() + key.slice(1)} Default Title`;
        }
        
        // Ensure description exists, is not empty/whitespace, and then TRUNCATE if necessary
        if (!currentPackage.description || currentPackage.description.trim().length === 0) {
            console.warn(`[generatePackageDetailsFlow] Package '${key}' description was missing or empty/whitespace. Using fallback.`);
            currentPackage.description = `Default concise ${key} service overview. Max 99 characters.`;
        }
        
        // CRITICAL TRUNCATION for the strict schema (maxLength: 100)
        if (currentPackage.description.length > 100) { 
            const originalDesc = currentPackage.description;
            console.warn(`[generatePackageDetailsFlow] Package '${key}' description from AI was >100 chars (length: ${originalDesc.length}). Original: "${originalDesc}". TRUNCATING to 100 chars.`);
            currentPackage.description = originalDesc.substring(0, 97) + "..."; // Truncate to 97 + "..." = 100 chars
            console.warn(`[generatePackageDetailsFlow] Package '${key}' description TRUNCATED to (length: ${currentPackage.description.length}): "${currentPackage.description}"`);
        }
         // Final check if description became empty after potential truncation or was initially empty/whitespace
         if (currentPackage.description.trim().length === 0) {
            console.warn(`[generatePackageDetailsFlow] Package '${key}' description was empty post-processing. Setting a failsafe default.`);
            currentPackage.description = "Concise service overview."; // Default < 100 chars
        }

        // Ensure features array exists and has at least one item
        if (!currentPackage.features || currentPackage.features.length === 0) {
            console.warn(`[generatePackageDetailsFlow] Package '${key}' features were missing or empty. Adding default features.`);
            currentPackage.features = [`Default feature for ${currentPackage.title || key}`];
        }
        
        // Ensure deliveryTime exists
        if (!currentPackage.deliveryTime || currentPackage.deliveryTime.trim().length === 0) {
            console.warn(`[generatePackageDetailsFlow] Package '${key}' deliveryTime was missing or empty. Setting a default.`);
            currentPackage.deliveryTime = "Contact Seller";
        }
        // Ensure revisions exist
        if (!currentPackage.revisions || currentPackage.revisions.trim().length === 0) {
            console.warn(`[generatePackageDetailsFlow] Package '${key}' revisions were missing or empty. Setting a default.`);
            currentPackage.revisions = "Not specified";
        }
        console.log(`[generatePackageDetailsFlow] Processed package '${key}': Description length is ${currentPackage.description.length}, Content: "${currentPackage.description}"`);
    }
    
    console.log("[generatePackageDetailsFlow] Returning fully processed package details (adhering to strict schema):", JSON.stringify(result, null, 2));
    return result; // This 'result' object is what Genkit will validate against the flow's 'outputSchema'
  }
);
