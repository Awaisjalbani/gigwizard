
'use server';

/**
 * @fileOverview Generates a compelling gig description with relevant FAQs based on gig details,
 * applying copywriting best practices and aiming for uniqueness.
 *
 * - generateGigDescription - A function that generates a gig description and FAQs.
 */

import {ai} from '@/ai/genkit';
import type { GenerateGigDescriptionInput, GenerateGigDescriptionOutput } from '@/ai/schemas/gig-generation-schemas';
import { GenerateGigDescriptionInputSchema, GenerateGigDescriptionOutputSchema } from '@/ai/schemas/gig-generation-schemas';


export async function generateGigDescription(input: GenerateGigDescriptionInput): Promise<GenerateGigDescriptionOutput> {
  return generateGigDescriptionFlow(input);
}

const generateDescriptionPrompt = ai.definePrompt({
  name: 'generateDescriptionPrompt',
  input: {schema: GenerateGigDescriptionInputSchema},
  output: {schema: GenerateGigDescriptionOutputSchema},
  prompt: `You are an expert Fiverr gig copywriter and strategist.
Your task is to generate a persuasive, clear, and benefit-driven gig description and a set of 4-5 relevant FAQs.

Gig Context:
- Main Keyword: {{{mainKeyword}}}
- Gig Title: {{{gigTitle}}}
- Category: {{{category}}} > {{{subcategory}}}
- Package Details Overview:
  - Basic: {{{packageDetails.basic.title}}} - {{{packageDetails.basic.description}}}
  - Standard: {{{packageDetails.standard.title}}} - {{{packageDetails.standard.description}}}
  - Premium: {{{packageDetails.premium.title}}} - {{{packageDetails.premium.description}}}
- Simulated Insights from Top Gigs: "{{{topPerformingGigInsights}}}"

Gig Description Requirements:
- Content:
  - Analyze the provided gig context and (simulated) insights from top-performing gigs.
  - Craft a description that is SEO optimized for the '{{{mainKeyword}}}'.
  - Clearly highlight what the buyer will get (key features and benefits derived from package details).
  - Explain why the buyer should choose this service (unique selling points, expertise).
  - Use persuasive copywriting techniques (e.g., AIDA: Attention, Interest, Desire, Action; or PAS: Problem, Agitate, Solution).
- Formatting: Use Markdown for clear structure (headings, bullet points, bold text for emphasis).
- Uniqueness: IMPORTANT! Ensure the description content is entirely unique and substantially varied each time this prompt is run, even for the same input. Avoid templated responses.

FAQs Requirements:
- Quantity: Generate a list of 4 to 5 frequently asked questions.
- Content:
  - Each FAQ must have a clear 'question' and a direct, helpful 'answer'.
  - Questions and answers should be concise and directly address potential buyer concerns related to this specific gig.
  - Base FAQs on the gig's services, category, and typical client queries.
- Uniqueness: IMPORTANT! Ensure the generated questions AND answers are unique and varied each time, even for the same input.

Output the gig description and FAQs according to the defined JSON schema.
`,
});

const generateGigDescriptionFlow = ai.defineFlow(
  {
    name: 'generateGigDescriptionFlow',
    inputSchema: GenerateGigDescriptionInputSchema,
    outputSchema: GenerateGigDescriptionOutputSchema,
  },
  async (input: GenerateGigDescriptionInput) => {
    const {output} = await generateDescriptionPrompt(input);
    if (!output) {
        throw new Error("AI failed to generate gig description and FAQs.");
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
    return output!;
  }
);
