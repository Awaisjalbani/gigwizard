
'use server';
/**
 * @fileOverview Generates assets for a short gig intro video.
 * This includes a video concept, script, visual prompts for scenes,
 * audio suggestions, and a suggested duration.
 *
 * - generateIntroVideoAssets - A function that orchestrates this generation.
 */

import {ai} from '@/ai/genkit';
import {
  GenerateIntroVideoAssetsInputSchema,
  GenerateIntroVideoAssetsOutputSchema,
  type GenerateIntroVideoAssetsInput,
  type GenerateIntroVideoAssetsOutput,
} from '@/ai/schemas/gig-generation-schemas';

export async function generateIntroVideoAssets(
  input: GenerateIntroVideoAssetsInput
): Promise<GenerateIntroVideoAssetsOutput> {
  return generateIntroVideoAssetsFlow(input);
}

const generateVideoAssetsPrompt = ai.definePrompt({
  name: 'generateIntroVideoAssetsPrompt',
  input: {schema: GenerateIntroVideoAssetsInputSchema},
  output: {schema: GenerateIntroVideoAssetsOutputSchema},
  prompt: `You are an expert video marketing strategist and scriptwriter, specializing in short, engaging promotional videos for Fiverr gigs.

Given the following gig details:
- Main Keyword: "{{mainKeyword}}"
- Gig Title: "{{gigTitle}}"
- Gig Description:
  \`\`\`
  {{{gigDescription}}}
  \`\`\`
{{#if targetAudience}}- Target Audience: "{{targetAudience}}"{{/if}}

Your task is to create a comprehensive blueprint for a short intro video (aim for around 15-30 seconds, but you will suggest a specific duration).

Generate the following components:

1.  **Video Concept (\\\`videoConcept\\\`)**:
    *   A very short (1-2 sentences) and catchy theme or core idea for the video. What's the main message or feeling it should convey?
    *   Example: "Showcase your expertise in solving [problem related to mainKeyword] quickly and professionally."

2.  **Script (\\\`script\\\`)**:
    *   A concise voiceover script or list of key talking points for the video.
    *   This script should be engaging and fit within the suggested video duration (approximately 15-30 seconds).
    *   It should highlight the main benefits of the gig and align with the video concept.
    *   Focus on clarity and impact.

3.  **Visual Prompts (\\\`visualPrompts\\\` - Array of 2 to 4 strings)**:
    *   Generate 2 to 4 distinct, detailed image prompts for an AI image generator (like DALL·E or Gemini).
    *   Each prompt should describe a key visual or scene for the video. These scenes should align with the script.
    *   Prompts should specify: style (e.g., "modern flat illustration," "dynamic screen recording mockup," "professional stock photo style"), key elements, colors (if important), and overall mood.
    *   Ensure these prompts are suitable for creating professional, high-quality images for a gig video.
    *   Example for a 'logo design' gig:
        *   Prompt 1: "Dynamic split screen: left side shows a chaotic, poorly designed logo; right side shows a sleek, modern, professionally designed logo representing the transformation. Bright, contrasting colors. Professional studio lighting."
        *   Prompt 2: "Close-up of a designer's hand sketching a logo concept on a tablet, with digital tools visible. Warm, creative studio environment. Focus on precision and creativity."

4.  **Audio Suggestion (\\\`audioSuggestion\\\`)**:
    *   Suggest a type of background music or sound effects that would complement the video's concept and tone.
    *   Example: "Upbeat and optimistic corporate background music," or "Modern and clean electronic track with subtle whoosh sound effects for transitions."

5.  **Suggested Duration (\\\`suggestedDurationSeconds\\\`)**:
    *   Recommend an ideal total duration for the video in seconds (e.g., 15, 20, 25, 30). This should be realistic for a short intro.

6.  **Call to Action (\\\`callToAction\\\`)** (Optional but Recommended):
    *   A brief, compelling call to action text or voiceover line for the end of the video.
    *   Example: "Ready for an amazing [mainKeyword]? Order Now!" or "Let's discuss your project today!"

CRITICAL: Ensure all generated content is fresh, unique, and tailored to the provided gig details. The video blueprint should be practical and help the user create an effective intro video.
Output strictly adheres to the GenerateIntroVideoAssetsOutputSchema JSON format.
`,
});

const generateIntroVideoAssetsFlow = ai.defineFlow(
  {
    name: 'generateIntroVideoAssetsFlow',
    inputSchema: GenerateIntroVideoAssetsInputSchema,
    outputSchema: GenerateIntroVideoAssetsOutputSchema,
  },
  async (input: GenerateIntroVideoAssetsInput): Promise<GenerateIntroVideoAssetsOutput> => {
    const {output} = await generateVideoAssetsPrompt(input);

    if (!output) {
      throw new Error('AI failed to generate intro video assets.');
    }

    // Basic fallbacks to ensure schema compliance if AI omits something critical
    if (!output.videoConcept) {
      output.videoConcept = `Highlighting expertise in ${input.mainKeyword}.`;
    }
    if (!output.script) {
      output.script = `Need help with ${input.mainKeyword}? I offer professional ${input.gigTitle}. Get high-quality results, fast. Contact me to get started!`;
    }
    if (!output.visualPrompts || output.visualPrompts.length < 2) {
      output.visualPrompts = [
        `Dynamic visual representing success related to "${input.mainKeyword}". Modern and clean style.`,
        `Illustration or mockup showcasing a key benefit of the service "${input.gigTitle}". Professional look.`,
      ];
    }
     if (output.visualPrompts.length > 4) {
        output.visualPrompts = output.visualPrompts.slice(0, 4);
    }
    if (!output.audioSuggestion) {
      output.audioSuggestion = "Upbeat and professional background music.";
    }
    if (!output.suggestedDurationSeconds || output.suggestedDurationSeconds < 10 || output.suggestedDurationSeconds > 60) {
      output.suggestedDurationSeconds = 20; // Default to 20 seconds
    }
     if (!output.callToAction) {
      output.callToAction = "Order my gig today!";
    }

    return output;
  }
);
