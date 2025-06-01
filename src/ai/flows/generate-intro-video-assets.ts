
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

Generate the following components. Each component's content MUST be unique and substantially varied each time this prompt is run, even for identical input gig details.

1.  **Video Concept (\\\`videoConcept\\\`)**:
    *   A very short (1-2 sentences) and catchy theme or core idea for the video. What's the main message or feeling it should convey? This concept must be fresh each time.
    *   Example: "Showcase your expertise in solving [problem related to mainKeyword] quickly and professionally."

2.  **Script (\\\`script\\\`)**:
    *   A concise voiceover script or list of key talking points for the video.
    *   This script should be engaging and fit within the suggested video duration (approximately 15-30 seconds).
    *   It should highlight the main benefits of the gig and align with the video concept.
    *   Focus on clarity and impact. The wording and structure must be unique to this generation.

3.  **Visual Prompts (\\\`visualPrompts\\\` - Array of 2 to 4 strings)**:
    *   Generate 2 to 4 distinct, detailed image prompts for an AI image generator (like DALL·E or Gemini).
    *   Each prompt should describe a key visual or scene for the video. These scenes should align with the script.
    *   Prompts should specify: style (e.g., "modern flat illustration," "dynamic screen recording mockup," "professional stock photo style"), key elements, colors (if important), and overall mood.
    *   Ensure these prompts are suitable for creating professional, high-quality images for a gig video.
    *   Each visual prompt (style, content, composition) must be unique to this generation and different from the other prompts in this array.
    *   Example for a 'logo design' gig:
        *   Prompt 1: "Dynamic split screen: left side shows a chaotic, poorly designed logo; right side shows a sleek, modern, professionally designed logo representing the transformation. Bright, contrasting colors. Professional studio lighting."
        *   Prompt 2: "Close-up of a designer's hand sketching a logo concept on a tablet, with digital tools visible. Warm, creative studio environment. Focus on precision and creativity."

4.  **Audio Suggestion (\\\`audioSuggestion\\\`)**:
    *   Suggest a type of background music or sound effects that would complement the video's concept and tone. This suggestion should be varied each time.
    *   Example: "Upbeat and optimistic corporate background music," or "Modern and clean electronic track with subtle whoosh sound effects for transitions."

5.  **Suggested Duration (\\\`suggestedDurationSeconds\\\`)**:
    *   Recommend an ideal total duration for the video in seconds (e.g., 15, 20, 25, 30). This should be realistic for a short intro.

6.  **Call to Action (\\\`callToAction\\\`)** (Optional but Recommended):
    *   A brief, compelling call to action text or voiceover line for the end of the video. This CTA should be freshly phrased.
    *   Example: "Ready for an amazing [mainKeyword]? Order Now!" or "Let's discuss your project today!"

CRITICAL: Ensure all generated content is fresh, unique, and tailored to the provided gig details. The video blueprint should be practical and help the user create an effective intro video that doesn't resemble previous generations.
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
    const randomSuffix = () => `(Gen ${Math.random().toString(36).substring(7)})`;

    // Basic fallbacks to ensure schema compliance if AI omits something critical, with added uniqueness
    if (!output.videoConcept) {
      output.videoConcept = `Highlighting expertise in ${input.mainKeyword}. Unique angle: ${randomSuffix()}`;
    }
    if (!output.script) {
      output.script = `Need expert ${input.mainKeyword}? I offer professional ${input.gigTitle}. Get top-tier results, efficiently. Contact me for your project needs ${randomSuffix()}!`;
    }
    if (!output.visualPrompts || output.visualPrompts.length < 2) {
      output.visualPrompts = [
        `Dynamic visual representing success and expertise related to "${input.mainKeyword}". Modern, clean, and unique style ${randomSuffix()}.`,
        `Illustration or mockup showcasing a key benefit of the service "${input.gigTitle}". Professional look and distinct from other visuals ${randomSuffix()}.`,
      ];
    }
     if (output.visualPrompts.length > 4) {
        output.visualPrompts = output.visualPrompts.slice(0, 4);
    }
    if (!output.audioSuggestion) {
      output.audioSuggestion = `Upbeat and professional background music, perhaps with a ${['modern', 'classic', 'techy'][Math.floor(Math.random()*3)]} feel ${randomSuffix()}.`;
    }
    if (!output.suggestedDurationSeconds || output.suggestedDurationSeconds < 10 || output.suggestedDurationSeconds > 60) {
      output.suggestedDurationSeconds = (Math.floor(Math.random() * 5) + 3) * 5; // 15, 20, 25, 30, 35
    }
     if (!output.callToAction) {
      output.callToAction = `Let's elevate your ${input.mainKeyword}! Order today ${randomSuffix()}!`;
    }

    return output;
  }
);

