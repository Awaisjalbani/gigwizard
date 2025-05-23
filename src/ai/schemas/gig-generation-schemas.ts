
import {z} from 'genkit';

// From generate-gig-description.ts
export const FAQSchema = z.object({
  question: z.string().describe('A frequently asked question.'),
  answer: z.string().describe('A concise and helpful answer to the question.'),
});
export const GenerateGigDescriptionInputSchema = z.object({
  mainKeyword: z.string().describe('The main keyword for the Fiverr gig.'),
  topGigData: z
    .string()
    .describe(
      'Data from top-performing gigs in the analyzed category, including features and FAQs.  This can be the HTML content of those gigs.'
    ),
});
export type GenerateGigDescriptionInput = z.infer<typeof GenerateGigDescriptionInputSchema>;
export const GenerateGigDescriptionOutputSchema = z.object({
  gigDescription: z.string().describe('The generated gig description in Markdown format. Ensure this is unique each time.'),
  faqs: z.array(FAQSchema).min(4).max(5).describe('A list of 4 to 5 relevant and concise FAQs with their answers for the gig. Ensure these are unique each time.'),
});
export type GenerateGigDescriptionOutput = z.infer<typeof GenerateGigDescriptionOutputSchema>;

// From generate-gig-title.ts
export const GenerateGigTitleInputSchema = z.object({
  mainKeyword: z.string().describe('The main keyword for the Fiverr gig.'),
});
export type GenerateGigTitleInput = z.infer<typeof GenerateGigTitleInputSchema>;
export const GenerateGigTitleOutputSchema = z.object({
  gigTitle: z.string().describe('The generated gig title optimized for Fiverr. Ensure this is unique each time.'),
});
export type GenerateGigTitleOutput = z.infer<typeof GenerateGigTitleOutputSchema>;

// From generate-package-details.ts
export const PackageDetailSchema = z.object({
  title: z.string().describe('The compelling title of the package (e.g., "Basic Spark", "Standard Growth", "Premium Pro"). This should be unique each time.'),
  price: z.number().describe('The price for this package.'),
  description: z.string().max(180, "Description should be concise, ideally around 30 words or less, up to 180 characters max.").describe('A detailed, benefit-oriented, and concise description (around 30 words) of what is included in this package. Highlight key deliverables and unique selling points. This should be based on deep research for the keyword and be unique each time.'),
  deliveryTime: z.string().describe('Estimated delivery time for this package (e.g., "3 Days", "1 Week").'),
  revisions: z.string().describe('Number of revisions included (e.g., "1 Revision", "3 Revisions", "Unlimited Revisions").')
});
export const GeneratePackageDetailsInputSchema = z.object({
  mainKeyword: z.string().describe('The main keyword for the Fiverr gig.'),
  basePrice: z.number().describe('The AI-suggested base price for the most basic package, to be used as a reference.'),
  standardPrice: z.number().describe('The AI-suggested price for the standard package, to be used as a reference.'),
  premiumPrice: z.number().describe('The AI-suggested price for the premium package, to be used as a reference.'),
});
export type GeneratePackageDetailsInput = z.infer<typeof GeneratePackageDetailsInputSchema>;
export const GeneratePackageDetailsOutputSchema = z.object({
  basic: PackageDetailSchema.extend({price: z.number().describe('Final calculated price for the basic package.')}),
  standard: PackageDetailSchema.extend({price: z.number().describe('Final calculated price for the standard package.')}),
  premium: PackageDetailSchema.extend({price: z.number().describe('Final calculated price for the premium package.')})
});
export type GeneratePackageDetailsOutput = z.infer<typeof GeneratePackageDetailsOutputSchema>;

// From optimize-search-tags.ts
export const OptimizeSearchTagsInputSchema = z.object({
  mainKeyword: z
    .string()
    .describe('The main keyword for which to optimize search tags.'),
});
export type OptimizeSearchTagsInput = z.infer<typeof OptimizeSearchTagsInputSchema>;
export const OptimizeSearchTagsOutputSchema = z.object({
  searchTags: z
    .array(z.string())
    .length(5)
    .describe(
      'An array of 5 optimized search tags that are less competitive, highly relevant, and have good search volume. Ensure these are unique each time.'
    ),
});
export type OptimizeSearchTagsOutput = z.infer<typeof OptimizeSearchTagsOutputSchema>;

// From suggest-package-pricing.ts
export const SuggestPackagePricingInputSchema = z.object({
  keyword: z.string().describe('The main keyword for the Fiverr gig.'),
});
export type SuggestPackagePricingInput = z.infer<typeof SuggestPackagePricingInputSchema>;
export const SuggestPackagePricingOutputSchema = z.object({
  basic: z.number().describe('Suggested price for the basic package.'),
  standard: z.number().describe('Suggested price for the standard package.'),
  premium: z.number().describe('Suggested price for the premium package.'),
});
export type SuggestPackagePricingOutput = z.infer<typeof SuggestPackagePricingOutputSchema>;

export const PricingPromptInputSchema = z.object({
  keyword: z.string().describe('The main keyword for the Fiverr gig.'),
  basicPrice: z.number().describe('The fetched basic price from competitor analysis.'),
  standardPrice: z.number().describe('The fetched standard price from competitor analysis.'),
  premiumPrice: z.number().describe('The fetched premium price from competitor analysis.'),
});
export type PricingPromptInput = z.infer<typeof PricingPromptInputSchema>;


// From suggest-requirements.ts
export const SuggestRequirementsInputSchema = z.object({
  gigCategory: z.string().describe('The category of the gig.'),
  gigDescription: z.string().describe('The description of the gig.'),
});
export type SuggestRequirementsInput = z.infer<typeof SuggestRequirementsInputSchema>;
export const SuggestRequirementsOutputSchema = z.object({
  requirements: z
    .array(z.string())
    .describe('A list of suggested requirements from the client. Ensure these are unique and varied each time.'),
});
export type SuggestRequirementsOutput = z.infer<typeof SuggestRequirementsOutputSchema>;


// From generate-gig-image.ts
export const GenerateGigImageInputSchema = z.object({
  mainKeyword: z.string().describe('The main keyword for the Fiverr gig.'),
  gigTitle: z.string().describe('The title of the Fiverr gig.'),
});
export type GenerateGigImageInput = z.infer<typeof GenerateGigImageInputSchema>;
export const GenerateGigImageOutputSchema = z.object({
  imageDataUri: z.string().describe("A data URI of the generated image (e.g., 'data:image/png;base64,...'). This image should be unique."),
});
export type GenerateGigImageOutput = z.infer<typeof GenerateGigImageOutputSchema>;
