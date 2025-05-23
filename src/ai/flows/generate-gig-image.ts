
'use server';
/**
 * @fileOverview Generates a unique and relevant image for a Fiverr gig
 * based on its title, keyword, and category.
 *
 * - generateGigImage - A function that generates a gig image.
 */

import {ai} from '@/ai/genkit';
import type { GenerateGigImageInput, GenerateGigImageOutput } from '@/ai/schemas/gig-generation-schemas';
import { GenerateGigImageInputSchema, GenerateGigImageOutputSchema } from '@/ai/schemas/gig-generation-schemas';


export async function generateGigImage(input: GenerateGigImageInput): Promise<GenerateGigImageOutput> {
  return generateGigImageFlow(input);
}

const generateGigImageFlow = ai.defineFlow(
  {
    name: 'generateGigImageFlow',
    inputSchema: GenerateGigImageInputSchema,
    outputSchema: GenerateGigImageOutputSchema,
  },
  async (input: GenerateGigImageInput) => {
    const promptText = `You are an AI assistant specialized in creating compelling visuals for Fiverr gigs.
Generate a professional, eye-catching, and highly relevant gig image.

Gig Details for Image Context:
- Title: "${input.gigTitle}"
- Main Keyword: "${input.mainKeyword}"
- Category: "${input.category} > ${input.subcategory}"

Image Requirements:
- Style: Modern, clean, and professional. Suitable for a service marketplace thumbnail.
- Content: Directly represent the service offered. For example, if it's "logo design," show an abstract, modern logo or a designer's workspace. If "website development," show a sleek website mockup. If "article writing," perhaps a stylized keyboard or document.
- Aspect Ratio & Size: Produce an image with a standard web aspect ratio, suitable for display as a Fiverr gig image (e.g., 1280x769 pixels, or a similar 16:9 or 4:3 ratio like 600x400 pixels).
- Uniqueness: Ensure the image is visually distinct and unique each time this request is made, even for similar inputs. Avoid generic stock photo appearances.

Focus on creating an image that would attract clicks and convey professionalism and quality for the service described by "${input.gigTitle}".`;

    const {media} = await ai.generate({
      model: 'googleai/gemini-2.0-flash-exp',
      prompt: promptText,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
         safetySettings: [ // Relax safety settings slightly if needed, be mindful of implications
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH'},
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        ],
      },
    });

    if (!media?.url) {
      console.error('Image generation API call did not return a media URL. Input:', input, 'Prompt:', promptText, 'Response media:', media);
      // Consider a fallback or a retry mechanism here if appropriate
      throw new Error('Image generation failed or returned no media URL. The AI model might be unable to generate an image for the given prompt, or safety filters might have blocked it.');
    }
    
    return { imageDataUri: media.url };
  }
);
