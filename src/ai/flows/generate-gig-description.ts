
'use server';

/**
 * @fileOverview Generates compelling FAQs for a gig. The main description part is now handled
 * by a more central flow, but this can still provide FAQs and a fallback description.
 *
 * - generateGigDescription (now primarily for FAQs) - A function that generates FAQs and a description.
 */

import {ai} from '@/ai/genkit';
import type { GenerateGigDescriptionInput, GenerateGigDescriptionOutput } from '@/ai/schemas/gig-generation-schemas';
import { GenerateGigDescriptionInputSchema, GenerateGigDescriptionOutputSchema } from '@/ai/schemas/gig-generation-schemas';


export async function generateGigDescription(input: GenerateGigDescriptionInput): Promise<GenerateGigDescriptionOutput> {
  return generateGigDescriptionFlow(input);
}

const generateDescriptionPrompt = ai.definePrompt({
  name: 'generateDescriptionAndFaqsPrompt', // Renamed for clarity
  input: {schema: GenerateGigDescriptionInputSchema},
  output: {schema: GenerateGigDescriptionOutputSchema},
  prompt: `You are an expert Fiverr gig copywriter and strategist.
Your primary task here is to generate a set of 4-5 relevant FAQs.
As a secondary task, also generate a gig description (though this might be overridden by a more specialized description generator).

Gig Context:
- Main Keyword: {{{mainKeyword}}}
- Gig Title: {{{gigTitle}}}
- Category: {{{category}}} > {{{subcategory}}}
- Package Details Overview:
  - Basic: {{{packageDetails.basic.title}}} - {{{packageDetails.basic.description}}}
  - Standard: {{{packageDetails.standard.title}}} - {{{packageDetails.standard.description}}}
  - Premium: {{{packageDetails.premium.title}}} - {{{packageDetails.premium.description}}}
- Simulated Insights from Top Gigs: "{{{topPerformingGigInsights}}}"

FAQs Requirements:
- Quantity: Generate a list of 4 to 5 frequently asked questions.
- Content:
  - Each FAQ must have a clear 'question' and a direct, helpful 'answer'.
  - Questions and answers should be concise and directly address potential buyer concerns related to this specific gig.
  - Base FAQs on the gig's services, category, and typical client queries.
- Uniqueness: IMPORTANT! Ensure the generated questions AND answers are unique and varied each time, even for the same input.

Gig Description Requirements (Secondary Task - may be overridden):
- Content:
  - Analyze the provided gig context and (simulated) insights from top-performing gigs.
  - Craft a description that is SEO optimized for the '{{{mainKeyword}}}'.
  - Clearly highlight what the buyer will get (key features and benefits derived from package details).
  - Explain why the buyer should choose this service (unique selling points, expertise).
  - Use persuasive copywriting techniques (e.g., AIDA: Attention, Interest, Desire, Action; or PAS: Problem, Agitate, Solution).
- Formatting: Use Markdown for clear structure (headings, bullet points, bold text for emphasis).
- Uniqueness: IMPORTANT! Ensure the description content is entirely unique and substantially varied each time this prompt is run, even for the same input. Avoid templated responses.

Output the gig description and FAQs according to the defined JSON schema. Focus heavily on providing excellent FAQs.
`,
});

const generateGigDescriptionFlow = ai.defineFlow(
  {
    name: 'generateGigDescriptionFlow', // Name remains for consistency, but purpose shifted
    inputSchema: GenerateGigDescriptionInputSchema,
    outputSchema: GenerateGigDescriptionOutputSchema,
  },
  async (input: GenerateGigDescriptionInput) => {
    const {output} = await generateDescriptionPrompt(input);
    if (!output) {
        // If AI fails, provide at least a fallback for FAQs
        return {
            gigDescription: "Failed to generate description. Please try again.",
            faqs: [
                { question: "What do I need to provide to get started?", answer: "Please provide all necessary details and assets specific to your project after ordering." },
                { question: "How many revisions are included?", answer: "Revision counts vary by package. Please check the package details." },
                { question: "What is your delivery time?", answer: "Delivery times are specified in each package. Expedited options may be available as an extra." },
                { question: "Can you handle custom requests?", answer: "Yes, please message me before ordering to discuss your custom requirements." }
            ]
        };
    }
    if (!output.faqs || output.faqs.length < 4 || output.faqs.length > 5) {
        console.warn("AI did not return 4-5 FAQs. Adjusting or using fallback.");
        // Simple fallback - can be improved
        output.faqs = [
            { question: "What do I need to provide to get started?", answer: "Please provide all necessary details and assets specific to your project after ordering." },
            { question: "How many revisions are included?", answer: "Revision counts vary by package. Please check the package details." },
            { question: "What is your delivery time?", answer: "Delivery times are specified in each package. Expedited options may be available as an extra." },
            { question: "Can you handle custom requests?", answer: "Yes, please message me before ordering to discuss your custom requirements." }
        ].slice(0, Math.max(4, Math.min(5, output.faqs?.length || 4))); // Ensure 4-5
    }
    // Ensure a description is present, even if basic, if AI somehow omits it
    if (!output.gigDescription) {
        output.gigDescription = "Welcome to my gig! I offer professional services tailored to your needs. Please check the packages for details or contact me for custom requests."
    }
    return output;
  }
);

