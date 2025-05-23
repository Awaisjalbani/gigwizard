
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

const tonos = ['friendly', 'confident', 'bold', 'helpful', 'premium', 'creative', 'formal', 'humorous', 'professional', 'engaging'];
const uniqueAngleFocus = ['exceptional turnaround speed', 'specific tech stack expertise (e.g., React with Node.js backend)', 'deep experience level (e.g., 10+ years)', 'a valuable bonus offer (e.g., free consultation)', 'specialized niche expertise (e.g., SaaS landing pages)', 'a unique creative process', '24/7 support commitment'];

const prompt = ai.definePrompt({
  name: 'generateTitleDescriptionImagePrompt',
  input: {schema: GenerateTitleDescImgPromptInputSchema},
  output: {schema: GenerateTitleDescImgPromptOutputSchema},
  prompt: `You are an expert Fiverr gig creator trained in SEO, psychology, and high-converting copywriting.
Based on the MAIN KEYWORD: "{{mainKeyword}}", create a unique and professional Fiverr gig package.

Ensure every time this prompt is run, the output is fresh, varied in tone/wording/structure, and not formulaic.
To achieve uniqueness:
- Randomly select a tone from the available options: {{#each tonos}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}. Apply this tone consistently.
- Randomly select a unique angle focus from: {{#each uniqueAngleFocus}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}. Integrate this into the description.
- Swap sentence structures: sometimes start with a question, sometimes with a stat or a promise.
- Vary the Unique Selling Point (USP) based on the selected unique angle.

Generate the following three components:

1.  **Gig Title**:
    - STRICTLY start with "I will".
    - Use the main keyword "{{mainKeyword}}" creatively and naturally within the title.
    - STRICTLY keep it under 80 characters.
    - Use emotional and persuasive language and power words.
    - Make it distinct and SEO-optimized.
    - Add a unique benefit or selling point derived from the overall gig concept.
    - Example format: "I will design a premium Shopify store optimized for mobile sales"

2.  **Gig Description**:
    - Apply the chosen tone consistently.
    - Format the description using Markdown and the following sections (use these exact headings in Markdown, followed by content):
      - **### Opening Hook** (1 compelling sentence to grab attention, possibly a question or bold statement related to "{{mainKeyword}}")
      - **### About My Service** (Clearly explain what you do, how it relates to "{{mainKeyword}}", and your expertise.)
      - **### Why Choose Me? (Benefits)** (Highlight unique selling points and tangible benefits for the buyer. Incorporate your chosen unique angle here. Use bullet points with emojis like ✔ or 🏆 for emphasis where appropriate.)
      - **### What You Will Get** (List key deliverables or features. Use bullet points with emojis like ✔ or similar.)
      - **### Let's Get Started! (Call to Action)** (A clear and inviting call to action, encouraging the buyer to message or order.)
    - Make it different from common gigs by deeply integrating the selected **unique angle**.
    - Ensure the description is engaging, persuasive, and provides clear value.
    - Example Structure (for keyword: "Shopify Store Design", tone: premium, angle: exceptional turnaround):
        ### Opening Hook
        Need a stunning Shopify store that converts, delivered lightning-fast?
        ### About My Service
        I specialize in crafting high-quality, custom Shopify stores that are not only visually appealing but also engineered for sales. With expertise in "{{mainKeyword}}", I bring your e-commerce vision to life.
        ### Why Choose Me? (Benefits)
        ✔ Exceptional Turnaround: Get your premium store up and running quicker than you thought possible.
        ✔ Conversion-Focused Design: Every element is optimized to turn visitors into customers.
        ✔ Tailored to Your Brand: A unique store that reflects your business identity perfectly.
        ### What You Will Get
        ✔ Fully responsive, clean Shopify design
        ✔ Custom homepage, product pages, about/contact sections
        ✔ Speed-optimized and SEO-ready setup
        ✔ Mobile-first, conversion-focused experience
        ✔ Integration of essential apps
        ### Let's Get Started! (Call to Action)
        💬 Ready for a Shopify store that stands out and sells? Message me today to discuss your project!

3.  **Image Prompt** (for an AI image generator like DALL·E):
    - Describe a professional Fiverr gig thumbnail image.
    - Base it on the main keyword "{{mainKeyword}}" and the style/tone of the generated Gig Description and Title.
    - Follow Fiverr’s image best practices: clear text (if any, related to title/service), professional 2D design preferred over photos, relevant to business context, high contrast.
    - Make the prompt detailed and specific for generating a visually appealing and relevant gig image (e.g., "Modern flat design illustration for a '{{mainKeyword}}' gig, showcasing [key visual element related to service], using a [chosen tone, e.g., bold] color palette of [color1] and [color2]. Text overlay: '{{gigTitle}}'. Aspect ratio 16:9.").
    - **Crucially, ensure this image prompt itself is distinct and substantially varied each time it is generated**, even for the same main keyword, by incorporating unique details from the generated title and description content and style.

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
    // Pass the available tones and unique angles to the prompt context
    const {output} = await prompt({...input, tonos, uniqueAngleFocus });
    if (!output?.gigTitle || !output?.gigDescription || !output?.imagePrompt) {
        throw new Error("AI failed to generate one or more components (title, description, image prompt).");
    }
    if (!output.gigTitle.toLowerCase().startsWith("i will")) {
      output.gigTitle = "I will " + output.gigTitle;
    }
    return output;
  }
);

// Add tonos and uniqueAngleFocus to the global scope for Handlebars if not already available
// This is a workaround if direct injection isn't sufficient.
if (typeof global !== 'undefined') {
  if ((global as any).tonos === undefined) {
    (global as any).tonos = tonos;
  }
  if ((global as any).uniqueAngleFocus === undefined) {
    (global as any).uniqueAngleFocus = uniqueAngleFocus;
  }
}
