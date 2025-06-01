
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
  prompt: `You are an expert Fiverr gig strategist and market analyst. Your responses MUST be unique and substantially varied each time this prompt is run, even for the exact same input keyword or concept. Avoid repeating phrases, structures, or specific examples from previous generations. Every detail should feel freshly conceived.

Given the main keyword: "{{mainKeyword}}"
{{#if userGigConcept}}And the user's gig concept: "{{userGigConcept}}"{{/if}}

Your task is to perform a simulated analysis as if you've deeply reviewed the TOP 4 performing (hypothetical) Fiverr gigs for the "{{mainKeyword}}". Based on this simulation, generate the following:

1.  **Simulated Competitor Profiles (Array of 2 to 4 profiles)**:
    *   Create distinct profiles for 2 to 4 HYPOTHETICAL successful competitors.
    *   For each competitor, ensure ALL details (gigTitle, primaryOffering, keySellingPoints, estimatedPriceRange, targetAudienceHint) are plausible, distinct from other profiles in *this current response*, and ENTIRELY DIFFERENT from any previous generation for this keyword. Be highly creative and specific.
    *   \\\`gigTitle\\\`: A compelling and unique title they might use. Must be fresh.
    *   \\\`primaryOffering\\\`: What is the core service they seem to excel at? Must be fresh.
    *   \\\`keySellingPoints\\\`: 2-3 unique bullet points on what makes them attractive. Must be fresh.
    *   \\\`estimatedPriceRange\\\`: A general, varied idea of their pricing structure (e.g., "Basic: $X, Pro: $Y", or "From $Z"). Must be fresh.
    *   \\\`targetAudienceHint\\\`: Who are they likely targeting? (e.g., "Indie game devs," "SaaS companies"). Must be fresh.

2.  **Observed Success Factors (Array of 3-4 strings)**:
    *   Based on your simulated research, list 3-4 common factors or patterns that contribute to success for gigs in the "{{mainKeyword}}" niche. These factors should be insightful and completely different from any factors listed in previous generations.

3.  **Strategic Recommendations for User (Array of 3-5 strings)**:
    *   Based on the keyword{{#if userGigConcept}}, their concept "{{userGigConcept}}"{{/if}}, and your analysis, provide 3-5 actionable, unique, and highly specific strategic recommendations for the user's gig. Help them differentiate. These recommendations must not repeat advice given in previous generations.

4.  **Overall Market Summary (String)**:
    *   Write a brief (2-4 sentences), unique summary of the competitive landscape and opportunity for the "{{mainKeyword}}". This summary must offer a fresh perspective each time.

5.  **Outreach Tip (String)**:
    *   Provide one concise, actionable, and unique tip for how the user could approach outreach or initial communication with potential clients for this type of gig. This tip must be entirely different from previous outreach tips.

6.  **Winning Approach Summary (String)**:
    *   Summarize a unique core value proposition or "winning approach" the user could adopt to stand out and succeed with their gig. This approach must be freshly conceived and distinct from prior suggestions.

CRITICAL: Every single field in your output (including all elements within arrays) must be freshly generated and substantially different from any previous outputs for the same inputs. Do not use templated responses. Be creative, specific, and strategic in ensuring this uniqueness.
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
        { gigTitle: `Unique Premium ${input.mainKeyword} Expert (Gen ${Math.random().toString(36).substring(7)})`, primaryOffering: `Custom-tailored ${input.mainKeyword} solutions focusing on innovation.`, keySellingPoints: ["Dedicated 1-on-1 strategy sessions", "Unique approach to problem-solving in " + input.mainKeyword], estimatedPriceRange: `High-End Tier (Contact for Quote)`, targetAudienceHint: `Clients seeking novel ${input.mainKeyword} strategies.`},
        { gigTitle: `Rapid ${input.mainKeyword} Results (Gen ${Math.random().toString(36).substring(7)})`, primaryOffering: `Accelerated ${input.mainKeyword} project delivery.`, keySellingPoints: ["Guaranteed fast turnaround", "Streamlined process for quick wins"], estimatedPriceRange: `Mid-Range Packages ($X00 - $Y000)`, targetAudienceHint: `Businesses needing ${input.mainKeyword} results urgently.`},
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
    let profileCounter = 0;
    while (output.simulatedCompetitorProfiles.length < 2 && output.simulatedCompetitorProfiles.length < 4) { // Add more generic if needed
        profileCounter++;
        output.simulatedCompetitorProfiles.push({
            gigTitle: `General ${input.mainKeyword} Provider - Variant ${String.fromCharCode(67 + output.simulatedCompetitorProfiles.length - 2 + profileCounter)} (Gen ${Math.random().toString(36).substring(7)})`, 
            primaryOffering: `Versatile ${input.mainKeyword} tasks with a fresh perspective.`,
            keySellingPoints: ["Broad expertise, new angles", "Flexible approach to " + input.mainKeyword],
            estimatedPriceRange: "Varies by scope (dynamic pricing)",
            targetAudienceHint: `Wide range of clients for ${input.mainKeyword}, seeking unique solutions.`
        });
    }


    if (!output.observedSuccessFactors || output.observedSuccessFactors.length < 3) {
      output.observedSuccessFactors = [
          `Clear articulation of a unique value proposition for ${input.mainKeyword}.`, 
          `Strong portfolio (simulated) demonstrating diverse ${input.mainKeyword} capabilities.`, 
          `Proactive and responsive client communication strategies.`,
          `Offering tiered packages with distinctly different value for ${input.mainKeyword}.`
        ].sort(() => 0.5 - Math.random()).slice(0, Math.max(3, output.observedSuccessFactors?.length || 0));
    }


    if (!output.strategicRecommendationsForUser || output.strategicRecommendationsForUser.length < 3) {
      output.strategicRecommendationsForUser = [
          `Develop a hyper-niche within ${input.mainKeyword} to stand out (e.g., '${input.mainKeyword} for e-commerce startups').`, 
          `Create a signature process or methodology for your ${input.mainKeyword} service that offers unique client benefits.`, 
          `Bundle complementary micro-services with your main ${input.mainKeyword} offering to increase perceived value.`,
          `Focus on building long-term relationships rather than one-off ${input.mainKeyword} projects.`
        ].sort(() => 0.5 - Math.random()).slice(0, Math.max(3, output.strategicRecommendationsForUser?.length || 0));
    }


    if (!output.overallMarketSummary) {
      output.overallMarketSummary = `The market for "${input.mainKeyword}" is active, with opportunities for providers who can offer a truly differentiated service. Success hinges on carving out a unique niche or offering unparalleled value/expertise. (Gen ${Math.random().toString(36).substring(7)})`;
    }

    if (!output.outreachTip) {
      output.outreachTip = `Offer a highly specific, valuable piece of free advice related to ${input.mainKeyword} in your initial outreach to demonstrate expertise immediately. (Gen ${Math.random().toString(36).substring(7)})`;
    }

    if (!output.winningApproachSummary) {
      output.winningApproachSummary = `A winning approach for "${input.mainKeyword}" could be to position yourself as a 'strategic partner' rather than just a 'service provider,' focusing on achieving client's broader business goals through your expertise. (Gen ${Math.random().toString(36).substring(7)})`;
    }
    return output;
  }
);

