
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
- REMEMBER: Package descriptions MUST BE UNDER 100 CHARACTERS.
`,
});

const generatePackageDetailsFlow = ai.defineFlow(
  {
    name: 'generatePackageDetailsFlow',
    inputSchema: GeneratePackageDetailsInputSchema,
    outputSchema: GeneratePackageDetailsOutputSchema,
  },
  async (input: GeneratePackageDetailsInput): Promise<GeneratePackageDetailsOutput> => {
    const {output} = await generateDetailsPrompt(input);
    
    const fallbackPackage = (price: number, titlePrefix: string): z.infer<typeof SinglePackageDetailSchema> => ({
        title: `${titlePrefix} Package`,
        price: price,
        description: "Essential services to get you started. Max 100 chars.", // Ensure fallback is compliant
        features: ["Core Service Delivery", "Standard Support"],
        deliveryTime: "3 Days",
        revisions: "1 Revision"
    });

    if (!output) { // If the entire output is missing
        console.warn("AI output for package details was completely missing. Using fallbacks for all packages.");
        return {
            basic: fallbackPackage(input.basePrice, "Basic"),
            standard: fallbackPackage(input.standardPrice, "Standard"),
            premium: fallbackPackage(input.premiumPrice, "Premium"),
        };
    }
    
    const packagesToProcess = [output.basic, output.standard, output.premium];
    const inputPrices = [input.basePrice, input.standardPrice, input.premiumPrice];
    const packageKeys = ['basic', 'standard', 'premium'] as const;

    for (let i = 0; i < packageKeys.length; i++) {
        const key = packageKeys[i];
        let pkg = (output as any)[key] as z.infer<typeof SinglePackageDetailSchema> | undefined; // Type assertion
        
        if (!pkg) {
            console.warn(`AI output for package '${key}' was missing. Using fallback.`);
            pkg = fallbackPackage(inputPrices[i], key.charAt(0).toUpperCase() + key.slice(1));
            (output as any)[key] = pkg; 
        }

        // Ensure prices match the input reference prices
        pkg.price = inputPrices[i];

        // Fallback for features if missing or empty
        if (!pkg.features || pkg.features.length === 0) {
            console.warn(`Package '${key}' features were missing or empty. Adding default features.`);
            pkg.features = [`Default feature for ${pkg.title || key}`, `Key deliverable for ${pkg.title || key}`];
             if (pkg.features.length === 0) { 
                 pkg.features.push(`Essential item for ${pkg.title || key}`);
             }
        }
        
        // Fallback and Truncate description if necessary
        if (!pkg.description) {
            console.warn(`Package '${key}' description was missing. Using fallback description.`);
            pkg.description = `High-quality ${key} service. Under 100 chars.`;
        }

        if (pkg.description.length > 100) {
            console.warn(`Package '${key}' description was >100 chars (${pkg.description.length}). Truncating to ensure compliance.`);
            // Truncate to 97 characters and add "..." to make it exactly 100.
            pkg.description = pkg.description.substring(0, 97) + "...";
        }
        
        // Ensure description is not empty after potential truncation or if it was initially empty
         if (pkg.description.length === 0) {
            console.warn(`Package '${key}' description was empty. Setting a default.`);
            pkg.description = "Concise service overview.";
        }

        // Ensure other required fields have fallbacks if somehow missing from AI output
        if (!pkg.title) {
            console.warn(`Package '${key}' title was missing. Setting a default.`);
            pkg.title = `${key.charAt(0).toUpperCase() + key.slice(1)} Default Title`;
        }
        if (!pkg.deliveryTime) {
            console.warn(`Package '${key}' deliveryTime was missing. Setting a default.`);
            pkg.deliveryTime = "N/A";
        }
        if (!pkg.revisions) {
            console.warn(`Package '${key}' revisions were missing. Setting a default.`);
            pkg.revisions = "N/A";
        }
    }
    
    // Explicitly cast the validated and processed output before returning
    return output as GeneratePackageDetailsOutput;
  }
);

