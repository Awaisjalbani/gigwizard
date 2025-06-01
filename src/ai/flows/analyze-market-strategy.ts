
'use server';
/**
 * @fileOverview Analyzes the market for a given keyword and user gig concept,
 * simulating research of top Fiverr gigs to suggest competitor profiles, success factors,
 * strategic recommendations, an outreach tip, and a winning approach summary.
 * All generated content aims to be fresh and unique on each attempt.
 *
 * - analyzeMarketAndSuggestStrategy - A function that orchestrates this analysis.
 */

import {ai} from '@/ai/genkit';
import {
  AnalyzeMarketStrategyInputSchema,
  AnalyzeMarketStrategyOutputSchema,
  type AnalyzeMarketStrategyInput,
  type AnalyzeMarketStrategyOutput,
  type HypotheticalCompetitorProfile,
} from '@/ai/schemas/gig-generation-schemas';

export async function analyzeMarketAndSuggestStrategy(
  input: AnalyzeMarketStrategyInput
): Promise<AnalyzeMarketStrategyOutput> {
  return analyzeMarketStrategyFlow(input);
}

const analyzeMarketPrompt = ai.definePrompt({
  name: 'analyzeMarketStrategyPrompt',
  input: {schema: AnalyzeMarketStrategyInputSchema},
  output: {schema: AnalyzeMarketStrategyOutputSchema},
  prompt: `You are an expert Fiverr gig strategist and market analyst. Your responses MUST be unique and substantially varied each time this prompt is run, even for the exact same input keyword or concept. Avoid repeating phrases or structures from previous generations.

Given the main keyword: "{{mainKeyword}}"
{{#if userGigConcept}}And the user's gig concept: "{{userGigConcept}}"{{/if}}

Your task is to perform a simulated analysis as if you've deeply reviewed the TOP 4 performing (hypothetical) Fiverr gigs for the "{{mainKeyword}}". Based on this simulation, generate the following:

1.  **Simulated Competitor Profiles (Array of 2 to 4 profiles)**:
    *   Create distinct profiles for 2 to 4 HYPOTHETICAL successful competitors.
    *   For each competitor, ensure ALL details (title, offering, selling points, price range, audience) are plausible, distinct from other profiles in this response, and DIFFERENT from any previous generation for this keyword.
    *   `gigTitle`: A compelling and unique title they might use.
    *   `primaryOffering`: What is the core service they seem to excel at?
    *   `keySellingPoints`: 2-3 unique bullet points on what makes them attractive.
    *   `estimatedPriceRange`: A general, varied idea of their pricing structure (e.g., "Basic: $X, Pro: $Y", or "From $Z").
    *   `targetAudienceHint`: Who are they likely targeting? (e.g., "Indie game devs," "SaaS companies").

2.  **Observed Success Factors (Array of 3-4 strings)**:
    *   Based on your simulated research, list 3-4 common factors or patterns that contribute to success for gigs in the "{{mainKeyword}}" niche. These factors should be fresh and insightful each time.

3.  **Strategic Recommendations for User (Array of 3-5 strings)**:
    *   Based on the keyword{{#if userGigConcept}}, their concept "{{userGigConcept}}"{{/if}}, and your analysis, provide 3-5 actionable, unique strategic recommendations for the user's gig. Help them differentiate.

4.  **Overall Market Summary (String)**:
    *   Write a brief (2-4 sentences), unique summary of the competitive landscape and opportunity for the "{{mainKeyword}}".

5.  **Outreach Tip (String)**:
    *   Provide one concise, actionable, and unique tip for how the user could approach outreach or initial communication with potential clients for this type of gig.

6.  **Winning Approach Summary (String)**:
    *   Summarize a unique core value proposition or "winning approach" the user could adopt to stand out and succeed with their gig.

CRITICAL: Every single field in your output must be freshly generated and substantially different from any previous outputs for the same inputs. Do not use templated responses. Be creative and strategic.
Output strictly adheres to the AnalyzeMarketStrategyOutputSchema JSON format.
`,
});

const analyzeMarketStrategyFlow = ai.defineFlow(
  {
    name: 'analyzeMarketStrategyFlow',
    inputSchema: AnalyzeMarketStrategyInputSchema,
    outputSchema: AnalyzeMarketStrategyOutputSchema,
  },
  async (input: AnalyzeMarketStrategyInput): Promise<AnalyzeMarketStrategyOutput> => {
    const {output} = await analyzeMarketPrompt(input);

    if (!output) {
      throw new Error('AI failed to generate market analysis and strategy.');
    }

    // Fallback for competitor profiles (ensure 2-4)
    if (!output.simulatedCompetitorProfiles || output.simulatedCompetitorProfiles.length < 2) {
      const defaultProfiles: HypotheticalCompetitorProfile[] = [
        { gigTitle: `Premium ${input.mainKeyword} Services - Expert A`, primaryOffering: "High-touch, custom solutions", keySellingPoints: ["Dedicated support", "Tailored strategy"], estimatedPriceRange: "Premium Tier ($$$ - $$$$)", targetAudienceHint: "Clients valuing quality and partnership"},
        { gigTitle: `Fast ${input.mainKeyword} Delivery - Specialist B`, primaryOffering: "Quick turnaround services", keySellingPoints: ["Speed and efficiency", "Standardized packages"], estimatedPriceRange: "Mid Tier ($$ - $$$)", targetAudienceHint: "Clients with urgent needs"},
      ];
      if (output.simulatedCompetitorProfiles && output.simulatedCompetitorProfiles.length === 1) {
        output.simulatedCompetitorProfiles.push(defaultProfiles[1]); // Add one more if one exists
      } else {
        output.simulatedCompetitorProfiles = defaultProfiles;
      }
    }
    // Ensure between 2 and 4 profiles by slicing if AI gives too many, or adding if too few.
    if (output.simulatedCompetitorProfiles.length > 4) {
        output.simulatedCompetitorProfiles = output.simulatedCompetitorProfiles.slice(0,4);
    }
    while (output.simulatedCompetitorProfiles.length < 2 && output.simulatedCompetitorProfiles.length < 4) { // Add more generic if needed
        output.simulatedCompetitorProfiles.push({
            gigTitle: `General ${input.mainKeyword} Provider - Type ${String.fromCharCode(67 + output.simulatedCompetitorProfiles.length - 2)}`, // C, D
            primaryOffering: `Versatile ${input.mainKeyword} tasks`,
            keySellingPoints: ["Broad expertise", "Flexible approach"],
            estimatedPriceRange: "Varies by scope",
            targetAudienceHint: "Wide range of clients"
        });
    }


    if (!output.observedSuccessFactors || output.observedSuccessFactors.length === 0) {
      output.observedSuccessFactors = ["Clear and compelling gig descriptions", "Strong portfolio of past work (simulated)", "Positive client testimonials (simulated)", "Responsive communication"];
    }
     if (output.observedSuccessFactors.length < 3) output.observedSuccessFactors.push("Offering tiered packages with clear value");


    if (!output.strategicRecommendationsForUser || output.strategicRecommendationsForUser.length === 0) {
      output.strategicRecommendationsForUser = ["Identify a specific niche within " + input.mainKeyword + " to reduce competition.", "Develop a unique selling proposition (USP) that stands out.", "Showcase expertise through case studies or detailed examples."];
    }
    if (output.strategicRecommendationsForUser.length < 3) output.strategicRecommendationsForUser.push("Build a strong brand identity around your service.");


    if (!output.overallMarketSummary) {
      output.overallMarketSummary = `The market for "${input.mainKeyword}" presents opportunities for those who can clearly articulate their value and differentiate themselves. Competition exists, but specialized skills or unique service bundles can attract buyers.`;
    }

    if (!output.outreachTip) {
      output.outreachTip = "Engage with potential clients by offering a brief, complimentary consultation to understand their needs before they commit to an order.";
    }

    if (!output.winningApproachSummary) {
      output.winningApproachSummary = `Focus on delivering exceptional quality and building strong client relationships. A "premium service at a fair value" approach, coupled with clear communication, can be a winning strategy for "${input.mainKeyword}".`;
    }
    return output;
  }
);
