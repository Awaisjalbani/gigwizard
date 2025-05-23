
'use server';
/**
 * @fileOverview Generates a unique and relevant image for a Fiverr gig
 * based on a detailed image prompt.
 *
 * - generateGigImage - A function that generates a gig image from a prompt.
 */

import {ai} from '@/ai/genkit';
import type { GenerateGigImageFromPromptInput, GenerateGigImageOutput } from '@/ai/schemas/gig-generation-schemas';
import { GenerateGigImageFromPromptInputSchema, GenerateGigImageOutputSchema } from '@/ai/schemas/gig-generation-schemas';


export async function generateGigImage(input: GenerateGigImageFromPromptInput): Promise<GenerateGigImageOutput> {
  return generateGigImageFlow(input);
}

const generateGigImageFlow = ai.defineFlow(
  {
    name: 'generateGigImageFlow',
    inputSchema: GenerateGigImageFromPromptInputSchema,
    outputSchema: GenerateGigImageOutputSchema,
  },
  async (input: GenerateGigImageFromPromptInput) => {
    // The prompt now directly uses the input.imagePrompt
    const imageGenPromptText = `Generate a professional, eye-catching, and highly relevant gig image based on the following detailed prompt.
Ensure the image is suitable for a service marketplace thumbnail (e.g., Fiverr).
Image Requirements: Modern, clean, professional style. Directly represent the service. Standard web aspect ratio (e.g., 1280x769 or 600x400 pixels). Visually distinct and unique. Avoid generic stock photo appearances.

Image Prompt to use:
"${input.imagePrompt}"`;

    const {media} = await ai.generate({
      model: 'googleai/gemini-2.0-flash-exp',
      prompt: imageGenPromptText,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
         safetySettings: [
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH'},
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        ],
      },
    });

    if (!media?.url) {
      console.error('Image generation API call did not return a media URL. Input Prompt:', input.imagePrompt, 'Full Gen Prompt:', imageGenPromptText, 'Response media:', media);
      throw new Error('Image generation failed or returned no media URL. The AI model might be unable to generate an image for the given prompt, or safety filters might have blocked it.');
    }
    
    return { imageDataUri: media.url };
  }
);
