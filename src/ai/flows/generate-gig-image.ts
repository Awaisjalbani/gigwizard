
'use server';
/**
 * @fileOverview Generates unique and relevant images for a Fiverr gig
 * based on an array of detailed image prompts.
 *
 * - generateGigImage - A function that generates gig images from prompts.
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
  async (input: GenerateGigImageFromPromptInput): Promise<GenerateGigImageOutput> => {
    if (!input.imagePrompts || input.imagePrompts.length === 0) {
      throw new Error('No image prompts provided.');
    }

    const imageGenerationPromises = input.imagePrompts.map(async (individualPrompt, index) => {
      const imageGenPromptText = `Generate a professional, eye-catching, and highly relevant gig image based on the following detailed prompt.
Ensure the image is suitable for a service marketplace thumbnail (e.g., Fiverr).
Image Requirements: Modern, clean, professional style. Directly represent the service. Standard web aspect ratio (e.g., 1280x769 or 600x400 pixels). Visually distinct and unique. Avoid generic stock photo appearances.

Image Prompt to use:
"${individualPrompt}"`;

      try {
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
          console.error(`Image generation API call did not return a media URL for prompt ${index + 1}. Input Prompt:`, individualPrompt, 'Full Gen Prompt:', imageGenPromptText, 'Response media:', media);
          // For this iteration, we throw an error if any image fails.
          // A more sophisticated approach might return partial successes or use placeholder for failed images.
          throw new Error(`Image generation failed for prompt ${index + 1} or returned no media URL. The AI model might be unable to generate an image for the given prompt, or safety filters might have blocked it.`);
        }
        return media.url;
      } catch (error) {
         console.error(`Error generating image for prompt ${index + 1}:`, error, "Prompt Text:", imageGenPromptText);
         throw error; // Re-throw to fail the Promise.all
      }
    });

    try {
      const imageDataUris = await Promise.all(imageGenerationPromises);
      return { imageDataUris };
    } catch (error) {
      // This catch block handles failures from Promise.all (i.e., if any individual image generation promise rejects)
      console.error("One or more images failed to generate:", error);
      // Propagate the error; the calling action.ts will handle user-facing error messages.
      throw error; 
    }
  }
);
