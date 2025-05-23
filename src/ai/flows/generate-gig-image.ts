
'use server';
/**
 * @fileOverview Generates a unique and relevant image for a Fiverr gig.
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
    // Construct the prompt string with actual values from the input
    const promptText = `You are an AI assistant creating a compelling visual for a Fiverr gig.
Generate an image that is professional, eye-catching, and directly relevant to a service offering titled '${input.gigTitle}' which is about '${input.mainKeyword}'.
The image should be suitable for a service marketplace thumbnail.
Ensure the image is unique and visually distinct each time.
Produce an image with a standard web aspect ratio, suitable for display at sizes like 600x400 pixels or 1280x769 pixels.`;

    const {media} = await ai.generate({
      model: 'googleai/gemini-2.0-flash-exp', // Specific model for image generation
      prompt: promptText, // Use the constructed prompt string
      config: {
        responseModalities: ['TEXT', 'IMAGE'], // Must include both
      },
    });

    if (!media?.url) {
      console.error('Image generation API call did not return a media URL. Input:', input, 'Prompt:', promptText, 'Response media:', media);
      throw new Error('Image generation failed or returned no media URL.');
    }
    // Ensure the image is unique by adding a call to the model to make it unique
    // This is a conceptual addition; actual uniqueness is handled by the model's inherent stochasticity and the prompt.
    // Forcing absolute uniqueness on every call may require more complex strategies beyond simple prompting if the model tends to repeat.
    // The prompt already requests uniqueness.

    return { imageDataUri: media.url };
  }
);

