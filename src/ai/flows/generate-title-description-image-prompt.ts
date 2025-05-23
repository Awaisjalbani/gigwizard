
'use server';
/**
 * @fileOverview Consolidates the generation of Gig Title, Description, and Image Prompt.
 *
 * - generateTitleDescriptionImagePrompt - A function that handles this consolidated generation.
 */

import {ai} from '@/ai/genkit';
import type { GenerateTitleDescImgPromptInput, GenerateTitleDescImgPromptOutput } from '@/ai/schemas/gig-generation-schemas';
import { GenerateTitleDescImgPromptInputSchema, GenerateTitleDescImgPromptOutputSchema } from '@/ai/schemas/gig-generation-schemas';

export async function generateTitleDescriptionImagePrompt(input: GenerateTitleDescImgPromptInput): Promise<GenerateTitleDescImgPromptOutput> {
  return generateTitleDescriptionImagePromptFlow(input);
}

const tonos = ['friendly', 'confident', 'bold', 'helpful', 'premium', 'creative', 'formal', 'humorous'];

const prompt = ai.definePrompt({
  name: 'generateTitleDescriptionImagePrompt',
  input: {schema: GenerateTitleDescImgPromptInputSchema},
  output: {schema: GenerateTitleDescImgPromptOutputSchema},
  prompt: `You are an expert Fiverr gig creator trained in SEO, psychology, and high-converting copywriting.
Based on the MAIN KEYWORD: "{{mainKeyword}}", create a unique and professional Fiverr gig package.

Ensure every time this prompt is run, the output is fresh, varied in tone/wording/structure, and not formulaic.
To achieve uniqueness:
- Randomly select a tone from the available options (e.g., {{#each tonos}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}). Apply this tone consistently.
- Swap sentence structures: sometimes start with a question, sometimes with a stat or a promise.
- Vary the Unique Selling Point (USP): Focus on speed, quality, customization, a bonus offer, niche targeting, certifications, tools used (e.g., “built with Webflow,” “Shopify Plus expert”), or experience level.

Generate the following three components:

1.  **Gig Title**:
    - Use the main keyword "{{mainKeyword}}" creatively and naturally.
    - STRICTLY keep it under 80 characters.
    - Use emotional and persuasive language.
    - Make it distinct and SEO-optimized.
    - Add a unique benefit or selling point.
    - Example format: "I will design a premium Shopify store optimized for mobile sales"

2.  **Gig Description**:
    - Apply the chosen tone consistently.
    - Format the description using Markdown and the following sections (use these exact headings in Markdown):
      - **### Opening Hook** (1 compelling sentence to grab attention)
      - **### About My Service** (Clearly explain what you do and how it relates to "{{mainKeyword}}")
      - **### Why Choose Me? (Benefits)** (Highlight unique selling points and tangible benefits for the buyer. Incorporate your chosen unique angle here.)
      - **### What You Will Get** (List key deliverables or features)
      - **### Let's Get Started! (Call to Action)** (A clear and inviting call to action)
    - Make it different from common gigs by including at least one **unique angle** (e.g., exceptional turnaround speed, specific tech stack expertise, deep experience level, a valuable bonus offer, specialized niche expertise, a unique process).
    - Example Structure:
        ### Opening Hook
        Want a stunning Shopify store that doesn't just look good — but sells?
        ### About My Service
        With 3+ years of Shopify design experience, I specialize in crafting custom stores that convert.
        ### Why Choose Me? (Benefits)
        From homepage to checkout, every page is tailored to your brand and audience, ensuring a mobile-first, conversion-focused experience. My unique angle is [mention your AI-chosen unique angle here].
        ### What You Will Get
        - Fully responsive, clean design
        - Custom homepage, product pages, about/contact
        - Speed-optimized and SEO-ready
        - Mobile-first, conversion-focused
        - [Include a specific deliverable related to your unique angle, e.g., "Bonus: Free Shopify app recommendations to boost your store’s sales" if the angle was a bonus]
        ### Let's Get Started! (Call to Action)
        💬 Let’s build a store your customers love. Message me today!

3.  **Image Prompt** (for an AI image generator like DALL·E):
    - Describe a professional Fiverr gig thumbnail image.
    - Base it on the main keyword "{{mainKeyword}}" and the style/tone of the generated Gig Description.
    - Follow Fiverr’s image best practices: clear text (if any), professional 2D design preferred over photos, relevant to business context, high contrast.
    - Make the prompt detailed and specific.
    - **Crucially, ensure this image prompt itself is distinct and substantially varied each time it is generated**, even for the same main keyword, by incorporating unique details from the generated title and description.
    - Example Image Prompt: "Fiverr gig thumbnail for Shopify store design — clean layout, modern eCommerce icons, laptop screen mockup with Shopify dashboard, bold text that says ‘Premium Shopify Store’, green and white color scheme, 2D flat design, high contrast, simple and professional"

Output a JSON object with keys "gigTitle", "gigDescription", and "imagePrompt".
`,
});

const generateTitleDescriptionImagePromptFlow = ai.defineFlow(
  {
    name: 'generateTitleDescriptionImagePromptFlow',
    inputSchema: GenerateTitleDescImgPromptInputSchema,
    outputSchema: GenerateTitleDescImgPromptOutputSchema,
  },
  async (input: GenerateTitleDescImgPromptInput) => {
    // Pass the available tones to the prompt context
    const {output} = await prompt({...input, tonos });
    if (!output?.gigTitle || !output?.gigDescription || !output?.imagePrompt) {
        throw new Error("AI failed to generate one or more components (title, description, image prompt).");
    }
    return output;
  }
);

// Add tonos to the global scope for Handlebars if not already available
// This is a workaround if direct injection isn't sufficient.
if (typeof global !== 'undefined' && (global as any).tonos === undefined) {
  (global as any).tonos = tonos;
}

