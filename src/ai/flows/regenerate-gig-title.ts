
'use server';
/**
 * @fileOverview Regenerates a Fiverr gig title, aiming for a different and improved version.
 *
 * - regenerateGigTitle - A function that handles the gig title regeneration process.
 */

import {ai} from '@/ai/genkit';
import type { RegenerateGigTitleInput, RegenerateGigTitleOutput } from '@/ai/schemas/gig-generation-schemas';
import { RegenerateGigTitleInputSchema, RegenerateGigTitleOutputSchema } from '@/ai/schemas/gig-generation-schemas';

export async function regenerateGigTitle(input: RegenerateGigTitleInput): Promise<RegenerateGigTitleOutput> {
  return regenerateGigTitleFlow(input);
}

const prompt = ai.definePrompt({
  name: 'regenerateGigTitlePrompt',
  input: {schema: RegenerateGigTitleInputSchema},
  output: {schema: RegenerateGigTitleOutputSchema},
  prompt: `You are an expert in creating highly optimized Fiverr gig titles.
The main keyword is "{{mainKeyword}}".
{{#if currentTitle}}The current title, which you should try to differ from, is: "{{currentTitle}}"{{/if}}

Generate ONE NEW and DIFFERENT compelling gig title that:
- Is significantly different from the current title (if provided).
- STRICTLY starts with "I will".
- Is optimized for Fiverr search (incorporate the main keyword naturally).
- Uses a different set or style of power words, or takes a unique angle compared to what might be implied by the current title.
- Is clear, concise, and accurately reflects the service offered.
- Adheres to Fiverr's character limits (ideally 60-80 characters).
- Avoids all caps and excessive special characters.
- Is unique and substantially varied each time this prompt is run, even for the same input.

Output a JSON object with a single key "newGigTitle" containing the title string. For example:
{
  "newGigTitle": "I will craft a professional and unique logo for your brand"
}
`,
});

const regenerateGigTitleFlow = ai.defineFlow(
  {
    name: 'regenerateGigTitleFlow',
    inputSchema: RegenerateGigTitleInputSchema,
    outputSchema: RegenerateGigTitleOutputSchema,
  },
  async (input: RegenerateGigTitleInput) => {
    const {output} = await prompt(input);
    if (!output?.newGigTitle) {
        throw new Error("AI failed to regenerate a new gig title.");
    }
    // Ensure it starts with "I will"
    if (!output.newGigTitle.toLowerCase().startsWith("i will")) {
      output.newGigTitle = "I will " + output.newGigTitle;
    }
    return output;
  }
);
