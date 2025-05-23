
'use server';

/**
 * @fileOverview A flow to suggest pricing for three service packages on Fiverr 
 * based on (simulated) competitor analysis using a tool.
 *
 * - suggestPackagePricing - A function that suggests pricing for Fiverr gig packages.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit'; 
import type { 
  SuggestPackagePricingInput, 
  SuggestPackagePricingOutput, 
  PricingPromptInput 
} from '@/ai/schemas/gig-generation-schemas';
import { 
  SuggestPackagePricingInputSchema, 
  SuggestPackagePricingOutputSchema, 
  PricingPromptInputSchema 
} from '@/ai/schemas/gig-generation-schemas';


export async function suggestPackagePricing(input: SuggestPackagePricingInput): Promise<SuggestPackagePricingOutput> {
  return suggestPackagePricingFlow(input);
}

// Simulated Tool: analyzeCompetitorGigs
const analyzeCompetitorGigsTool = ai.defineTool({
  name: 'analyzeCompetitorGigsTool', // Renamed for clarity if other tools get similar names
  description: 'Simulates scraping and analyzing 5-10 top competitor gigs on Fiverr for a given keyword, category, and subcategory to determine competitive pricing models for Basic, Standard, and Premium packages.',
  inputSchema: z.object({ 
    keyword: z.string().describe('The main keyword for the Fiverr gig.'),
    category: z.string().describe('The gig category for context.'),
    subcategory: z.string().describe('The gig subcategory for context.'),
  }),
  outputSchema: z.object({
    basic: z.number().describe('The average price of the basic package from (simulated) competitor gigs.'),
    standard: z.number().describe('The average price of the standard package from (simulated) competitor gigs.'),
    premium: z.number().describe('The average price of the premium package from (simulated) competitor gigs.'),
    notes: z.string().describe('Brief notes on observed pricing strategies or value propositions from competitors.'),
  }),
},
async (input: { keyword: string; category: string; subcategory: string; }) => {
  // Placeholder implementation: return some dummy prices.
  // In a real implementation, this tool would analyze real Fiverr gigs and return more meaningful data.
  // Simulate variability based on keyword length or a hash for pseudo-randomness
  const keywordFactor = input.keyword.length % 5; // Simple factor for variability
  let basePrice = 20 + keywordFactor * 5;
  if (input.category.toLowerCase().includes('programming') || input.category.toLowerCase().includes('ecommerce')) {
    basePrice += 30;
  } else if (input.category.toLowerCase().includes('graphics')) {
    basePrice += 10;
  }

  return {
    basic: Math.round(basePrice),
    standard: Math.round(basePrice * 2.5),
    premium: Math.round(basePrice * 5),
    notes: "Simulated analysis: Competitors often bundle more features in premium tiers. Consider offering unique value propositions.",
  };
});

const pricingPrompt = ai.definePrompt({
  name: 'pricingPrompt',
  input: {schema: PricingPromptInputSchema}, 
  output: {schema: SuggestPackagePricingOutputSchema},
  // Tools are not directly called by this specific prompt, but by the flow.
  // The flow calls the tool, then passes its output to this prompt.
  prompt: `You are an AI pricing assistant for Fiverr gigs.
You have been provided with pricing information derived from a simulated competitor analysis for the keyword "{{{keyword}}}" in category "{{{category}}} > {{{subcategory}}}":
- Basic package average price: {{{basicPrice}}}
- Standard package average price: {{{standardPrice}}}
- Premium package average price: {{{premiumPrice}}}

Based strictly on this provided information, determine the suggested pricing for the three Fiverr gig packages.
Your output MUST be a JSON object strictly adhering to the following structure:
{
  "basic": <suggested_basic_price_as_number>,
  "standard": <suggested_standard_price_as_number>,
  "premium": <suggested_premium_price_as_number>
}
Use the exact numeric prices you were provided from the analysis.
`,
});

const suggestPackagePricingFlow = ai.defineFlow(
  {
    name: 'suggestPackagePricingFlow',
    inputSchema: SuggestPackagePricingInputSchema,
    outputSchema: SuggestPackagePricingOutputSchema,
  },
  async (input: SuggestPackagePricingInput): Promise<SuggestPackagePricingOutput> => {
    // Step 1: Call the tool to get (simulated) competitor pricing analysis
    const competitorPricing = await analyzeCompetitorGigsTool({ 
        keyword: input.keyword,
        category: input.category,
        subcategory: input.subcategory,
    });

    // Step 2: Prepare input for the pricingPrompt
    const promptInput: PricingPromptInput = {
      keyword: input.keyword,
      category: input.category,
      subcategory: input.subcategory,
      basicPrice: competitorPricing.basic,
      standardPrice: competitorPricing.standard,
      premiumPrice: competitorPricing.premium,
    };

    // Step 3: Call the prompt with the augmented input
    const {output} = await pricingPrompt(promptInput);
    
    if (!output) {
      throw new Error('Failed to get pricing suggestions from the AI model.');
    }
    // The prompt is expected to return the prices directly as suggested.
    return output;
  }
);
