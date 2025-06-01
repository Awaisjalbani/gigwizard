
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

// Define a fallback structure that matches RawSinglePackageDetailSchema
const fallbackRawPackageDefaults = (price: number, titlePrefix: string, keyword: string): z.infer<typeof import('@/ai/schemas/gig-generation-schemas').RawSinglePackageDetailSchema> => ({
    title: `${titlePrefix} ${keyword} Spark`, // Make titles more keyword relevant
    price: price,
    description: `Quality ${keyword} service. Default description for ${titlePrefix}, max 99 chars.`,
    features: [`Core ${keyword} Feature`, "Standard Support", `${titlePrefix}-specific Benefit`],
    deliveryTime: titlePrefix === "Basic" ? "3 Days" : titlePrefix === "Standard" ? "5 Days" : "7 Days",
    revisions: titlePrefix === "Basic" ? "1 Revision" : titlePrefix === "Standard" ? "3 Revisions" : "5 Revisions"
});


export async function generatePackageDetails(input: GeneratePackageDetailsInput): Promise<GeneratePackageDetailsOutput> {
  return generatePackageDetailsFlow(input);
}

const generateDetailsPrompt = ai.definePrompt({
  name: 'generatePackageDetailsPrompt',
  input: {schema: GeneratePackageDetailsInputSchema},
  output: {schema: RawGeneratePackageDetailsOutputSchema},
  prompt: `You are an expert Fiverr gig strategist specializing in creating highly converting service packages.
Your task is to generate three distinct packages (Basic, Standard, Premium) for a gig. Your output MUST be significantly different and unique each time this prompt is run, even for identical inputs. Do not repeat titles, descriptions, or feature phrasing from previous generations.

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
1.  A compelling and unique 'title' (e.g., "Keyword Starter Pack", "Growth Accelerator", "Ultimate Domination Kit"). Titles MUST be different for each package tier and completely unique per generation. Be creative.
2.  The final 'price' (use the reference prices provided above).
3.  A concise 'description'. CRITICAL: This description MUST be a high-level overview or a compelling summary of the package's core value proposition. It MUST be ABSOLUTELY, STRICTLY 99 CHARACTERS OR LESS. To be safe, aim for 80-90 characters. DO NOT exceed 99 characters. This is a hard limit. Avoid listing detailed features here; use the 'features' list for that. It must be entirely unique and varied with each generation.
4.  A list of 2-5 specific 'features' or deliverables. These features MUST:
    - Be tailored to the main keyword '{{{mainKeyword}}}' and category '{{{category}}} > {{{subcategory}}}'. For example, if the keyword is "logo design", features might be "2 Initial Concepts", "Source File", "3D Mockup". If it's "article writing", features might be "500 Words", "SEO Optimization", "Topic Research".
    - Clearly differentiate the value between Basic, Standard, and Premium tiers (e.g., Basic: "1 Concept", Standard: "3 Concepts", Premium: "5 Concepts + Stationery").
    - Be unique and varied for each package and each time this prompt is run. The phrasing and specific features listed should not be repeated from previous generations.
    - Example: ["3 Pages Included", "Content Upload", "Speed Optimization", "Source File", "2 Logo Concepts"]
5.  A realistic 'deliveryTime' (e.g., "3 Days", "1 Week").
6.  The number of 'revisions' offered (e.g., "1 Revision", "Unlimited Revisions").

Critical Instructions for Uniqueness and Quality:
- Each time you generate these packages, ensure the 'title', 'description', and 'features' for ALL THREE packages are substantially unique and varied, even if the input keyword, title, category, and prices are the same as a previous request. AVOID REPETITION for these elements. Think of fresh angles and selling points each time.
- For 'deliveryTime' and 'revisions', provide realistic and appropriate values for each package tier, ensuring they show progression of value; extreme uniqueness per generation is not strictly required for these two fields, but they should be logical.
- Ensure that each package tier offers progressively more value. The descriptions and feature lists must clearly articulate these differences in a new way each time.
- Model the package structure (what's typically included at each tier for features) based on (simulated analysis of) top-performing gigs for similar services, but present your offering uniquely.
- REMEMBER THE ABSOLUTE HARD LIMIT: Package descriptions ('description' field) MUST BE 99 CHARACTERS OR LESS.
`,
});


const generatePackageDetailsFlow = ai.defineFlow(
  {
    name: 'generatePackageDetailsFlow',
    inputSchema: GeneratePackageDetailsInputSchema,
    outputSchema: GeneratePackageDetailsOutputSchema,
  },
  async (input: GeneratePackageDetailsInput): Promise<GeneratePackageDetailsOutput> => {
    console.log("[generatePackageDetailsFlow] Input:", JSON.stringify(input, null, 2));
    
    let aiOutput: RawGeneratePackageDetailsOutput;

    try {
      const {output: aiOutputUntyped} = await generateDetailsPrompt(input);
      if (!aiOutputUntyped || !aiOutputUntyped.basic || !aiOutputUntyped.standard || !aiOutputUntyped.premium) {
        console.warn("[generatePackageDetailsFlow] AI output structure from prompt was invalid, incomplete, or null. Using full fallback defaults.");
        // This error will be caught by the catch block below
        throw new Error("AI output structure from prompt was invalid or null."); 
      }
      aiOutput = aiOutputUntyped as RawGeneratePackageDetailsOutput;
      console.log("[generatePackageDetailsFlow] AI direct output (parsed as RawSchema):", JSON.stringify(aiOutput, null, 2));

    } catch (error) {
      console.error("[generatePackageDetailsFlow] Error calling generateDetailsPrompt or its initial parsing failed. Using full fallback.", error);
      // Construct a full fallback aiOutput object if prompt fails
      aiOutput = {
        basic: fallbackRawPackageDefaults(input.basePrice, "Basic", input.mainKeyword),
        standard: fallbackRawPackageDefaults(input.standardPrice, "Standard", input.mainKeyword),
        premium: fallbackRawPackageDefaults(input.premiumPrice, "Premium", input.mainKeyword),
      };
      console.log("[generatePackageDetailsFlow] Using fully constructed fallback AI Output:", JSON.stringify(aiOutput, null, 2));
    }
    
    // Initialize the result object, which will be typed according to the strict GeneratePackageDetailsOutputSchema
    const result: GeneratePackageDetailsOutput = {
        basic: {
            title: aiOutput.basic.title || fallbackRawPackageDefaults(input.basePrice, "Basic", input.mainKeyword).title,
            price: input.basePrice, 
            description: aiOutput.basic.description || fallbackRawPackageDefaults(input.basePrice, "Basic", input.mainKeyword).description,
            features: aiOutput.basic.features || fallbackRawPackageDefaults(input.basePrice, "Basic", input.mainKeyword).features,
            deliveryTime: aiOutput.basic.deliveryTime || fallbackRawPackageDefaults(input.basePrice, "Basic", input.mainKeyword).deliveryTime,
            revisions: aiOutput.basic.revisions || fallbackRawPackageDefaults(input.basePrice, "Basic", input.mainKeyword).revisions,
        },
        standard: {
            title: aiOutput.standard.title || fallbackRawPackageDefaults(input.standardPrice, "Standard", input.mainKeyword).title,
            price: input.standardPrice,
            description: aiOutput.standard.description || fallbackRawPackageDefaults(input.standardPrice, "Standard", input.mainKeyword).description,
            features: aiOutput.standard.features || fallbackRawPackageDefaults(input.standardPrice, "Standard", input.mainKeyword).features,
            deliveryTime: aiOutput.standard.deliveryTime || fallbackRawPackageDefaults(input.standardPrice, "Standard", input.mainKeyword).deliveryTime,
            revisions: aiOutput.standard.revisions || fallbackRawPackageDefaults(input.standardPrice, "Standard", input.mainKeyword).revisions,
        },
        premium: {
            title: aiOutput.premium.title || fallbackRawPackageDefaults(input.premiumPrice, "Premium", input.mainKeyword).title,
            price: input.premiumPrice,
            description: aiOutput.premium.description || fallbackRawPackageDefaults(input.premiumPrice, "Premium", input.mainKeyword).description,
            features: aiOutput.premium.features || fallbackRawPackageDefaults(input.premiumPrice, "Premium", input.mainKeyword).features,
            deliveryTime: aiOutput.premium.deliveryTime || fallbackRawPackageDefaults(input.premiumPrice, "Premium", input.mainKeyword).deliveryTime,
            revisions: aiOutput.premium.revisions || fallbackRawPackageDefaults(input.premiumPrice, "Premium", input.mainKeyword).revisions,
        },
    };
    
    const packageKeys: Array<keyof GeneratePackageDetailsOutput> = ['basic', 'standard', 'premium'];

    for (const key of packageKeys) {
        const currentPackage = result[key]; 

        if (!currentPackage.title || currentPackage.title.trim().length === 0) {
            console.warn(`[generatePackageDetailsFlow] Package '${key}' title was missing or empty post AI/fallback. Setting a hard default.`);
            currentPackage.title = `${key.charAt(0).toUpperCase() + key.slice(1)} ${input.mainKeyword} Default Title`;
        }
        
        if (!currentPackage.description || currentPackage.description.trim().length === 0) {
            console.warn(`[generatePackageDetailsFlow] Package '${key}' description was missing or empty/whitespace. Using specific default.`);
            currentPackage.description = `Default concise ${key} ${input.mainKeyword} overview. Max 99 chars.`;
        }
        
        if (currentPackage.description.length > 100) { 
            const originalDesc = currentPackage.description;
            console.warn(`[generatePackageDetailsFlow] Package '${key}' description was >100 chars (length: ${originalDesc.length}). Original: "${originalDesc}". TRUNCATING to 100 chars.`);
            currentPackage.description = originalDesc.substring(0, 97) + "..."; 
            console.warn(`[generatePackageDetailsFlow] Package '${key}' description TRUNCATED to (length: ${currentPackage.description.length}): "${currentPackage.description}"`);
        }
         if (currentPackage.description.trim().length === 0) {
            console.warn(`[generatePackageDetailsFlow] Package '${key}' description became empty post-processing. Setting a failsafe default.`);
            currentPackage.description = `Concise ${input.mainKeyword} service overview.`;
        }

        if (!currentPackage.features || currentPackage.features.length === 0) {
            console.warn(`[generatePackageDetailsFlow] Package '${key}' features were missing or empty. Adding default features.`);
            currentPackage.features = [`Default feature for ${currentPackage.title || key}`, `Another default ${input.mainKeyword} feature`];
        }
        
        if (!currentPackage.deliveryTime || currentPackage.deliveryTime.trim().length === 0) {
            console.warn(`[generatePackageDetailsFlow] Package '${key}' deliveryTime was missing or empty. Setting a default.`);
            currentPackage.deliveryTime = "Contact Seller";
        }
        if (!currentPackage.revisions || currentPackage.revisions.trim().length === 0) {
            console.warn(`[generatePackageDetailsFlow] Package '${key}' revisions were missing or empty. Setting a default.`);
            currentPackage.revisions = "Not specified";
        }
        console.log(`[generatePackageDetailsFlow] Processed package '${key}': Description length is ${currentPackage.description.length}, Content: "${currentPackage.description}"`);
    }
    
    console.log("[generatePackageDetailsFlow] Returning fully processed package details (adhering to strict schema):", JSON.stringify(result, null, 2));
    return result;
  }
);

