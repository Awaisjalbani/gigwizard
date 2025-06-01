
'use server';
/**
 * @fileOverview Consolidates the generation of Gig Title, Description, and an array of Image Prompts (hero and samples).
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

Ensure every time this prompt is run, the output is fresh, varied in tone/wording/structure, and not formulaic. Your response MUST be substantially different from any previous generation, even with the same input.
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
    - Use emotional and persuasive language and power words, varying them from previous generations.
    - Make it distinct, SEO-optimized, and unique compared to any prior output.
    - Add a unique benefit or selling point derived from the overall gig concept, ensuring this benefit is also freshly conceived.
    - Example format: "I will design a premium Shopify store optimized for mobile sales"

2.  **Gig Description**:
    - Apply the chosen tone consistently.
    - Format the description using Markdown and the following sections (use these exact headings in Markdown, followed by content):
      - **### Opening Hook** (1 compelling sentence to grab attention, possibly a question or bold statement related to "{{mainKeyword}}". Must be unique each time.)
      - **### About My Service** (Clearly explain what you do, how it relates to "{{mainKeyword}}", and your expertise. Phrasing must be unique each time.)
      - **### Why Choose Me? (Benefits)** (Highlight unique selling points and tangible benefits for the buyer. Incorporate your chosen unique angle here. Use bullet points with emojis like ✔ or 🏆 for emphasis where appropriate. The benefits listed must be articulated differently each time.)
      - **### What You Will Get** (List key deliverables or features. Use bullet points with emojis like ✔ or similar. These deliverables should be presented with fresh wording each time.)
      - **### Let's Get Started! (Call to Action)** (A clear and inviting call to action, encouraging the buyer to message or order. Must be phrased uniquely each time.)
    - Make it different from common gigs by deeply integrating the selected **unique angle**.
    - Ensure the description is engaging, persuasive, provides clear value, and is entirely unique compared to previous generations.

3.  **Image Prompts (Array of 3 strings)**:
    Generate an array of THREE distinct, detailed image prompts for an AI image generator (like DALL·E or Gemini).
    Each prompt must be substantially unique and creative, reflecting the specific details and unique angle of the Gig Title and Description that were just generated. The prompts should not be mere variations of previous prompts for the same keyword; aim for genuinely different concepts, styles, or compositions.
    The prompts should guide the creation of professional, high-quality, visually striking, and highly relevant Fiverr gig images.
    All images should aim for dimensions like 1280x769px or 1200x800px, suitable for Fiverr thumbnails.

    **Prompt 1: Hero Image**
    - **Objective:** Describe the main gig thumbnail. It should be professional, eye-catching, and clearly represent the overall service offered, incorporating the main keyword "{{mainKeyword}}" conceptually. The artistic style and composition MUST be unique for this generation.
    - **Style:** Modern, clean, professional (e.g., "Modern eCommerce theme," "Sleek tech infographic style," "Professional graphic design"). Choose a style that is different from what might have been used before for this keyword.
    - **Content:** Include key visual elements that broadly represent the service, arranged in a fresh composition.
    - **Text (If Essential):** Minimal text, e.g., "{{mainKeyword}}" or 2-3 impactful words like "Expert Web Design." Specify font style ("Bold, clean sans-serif like Montserrat"). Warn that AI struggles with text.
    - **Example (for 'Shopify Store Design'):** "Professional Fiverr gig hero image for Shopify store design, 1280x769px. Artistic concept: a blueprint of a Shopify store transforming into a fully realized, vibrant digital storefront. Split-screen effect not used. Colors: deep blues, teals, and a contrasting vibrant orange accent. High resolution, cinematic lighting. No copyrighted logos."

    **Prompt 2: Sample Project Image 1**
    - **Objective:** Describe a high-quality image showcasing a *specific example* of the work or a key feature in action. This must be visually distinct from the hero image and any previous sample image prompts. Focus on a fresh scenario.
    - **Focus:** Detail a concrete outcome or a specific use-case relevant to "{{mainKeyword}}", depicted in a novel way.
    - **Example (for 'Shopify Store Design'):** "Overhead shot of a customer's hand interacting with a Shopify store on a tablet, focusing on a seamless checkout process for a unique, handcrafted product. Background is a cozy artisan workshop. Style: Warm, inviting, emphasizing user trust and ease of purchase. High resolution, soft lighting."

    **Prompt 3: Sample Project Image 2 (or Infographic Element)**
    - **Objective:** Describe another, *different* high-quality image. This could be another project sample, or a simple infographic-style image highlighting a key benefit or process step. Distinct from Hero and Sample 1, and unique to this generation.
    - **Focus:** Illustrate a different facet of the service or a unique selling point, using a creative visual metaphor if possible.
    - **Example (for 'Shopify Store Design' - infographic style):** "Abstract infographic, 1280x769px, dark textured background. A glowing, stylized representation of a sales graph trending sharply upwards, originating from a mobile phone icon displaying a Shopify interface. Keywords like 'Conversion', 'Growth', 'Mobile-First' subtly integrated as background design elements. Colors: neon accents on dark. Professional, data-driven, yet artistic feel."

    **General Instructions for ALL Image Prompts:**
    - **Specificity & Detail:** Be very specific about theme, style, background, key elements, typography (if any, minimal), color scheme, quality descriptors (High resolution, Sharp details, Well-lit, Visually balanced), and negative constraints (No copyrighted logos/characters, avoid clutter).
    - **Fiverr Compliance:** Ensure the described image would be compliant with Fiverr's image guidelines.
    - **Uniqueness:** CRITICAL! Each of the three image prompts MUST be substantially unique from the others and creative. They should explore different visual ideas each time.

Output a JSON object with keys "gigTitle", "gigDescription", and "imagePrompts" (an array of 3 strings).
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
    if (!output?.gigTitle || !output?.gigDescription || !output?.imagePrompts || output.imagePrompts.length !== 3) {
        throw new Error("AI failed to generate one or more components (title, description, or 3 image prompts). Ensure all parts are freshly generated and unique.");
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

