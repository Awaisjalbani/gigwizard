
import {z} from 'genkit';

// --- Category Suggestion Schemas ---
export const SuggestGigCategoryInputSchema = z.object({
  mainKeyword: z.string().describe('The main keyword for the Fiverr gig.'),
  gigTitle: z.string().describe('The generated title of the Fiverr gig.'),
});
export type SuggestGigCategoryInput = z.infer<typeof SuggestGigCategoryInputSchema>;

export const SuggestedCategorySchema = z.object({
  category: z.string().describe('The most suitable main category for the gig (e.g., "Graphics & Design", "Programming & Tech").'),
  subcategory: z.string().describe('The most suitable subcategory for the gig (e.g., "Logo Design", "Website Development").'),
});
export type SuggestedCategory = z.infer<typeof SuggestedCategorySchema>;

export const SuggestGigCategoryOutputSchema = SuggestedCategorySchema;
export type SuggestGigCategoryOutput = z.infer<typeof SuggestGigCategoryOutputSchema>;


// --- Search Tag Optimization Schemas ---
export const OptimizeSearchTagsInputSchema = z.object({
  mainKeyword: z
    .string()
    .describe('The main keyword for which to optimize search tags.'),
  gigTitle: z.string().describe('The title of the gig, for context.'),
  category: z.string().describe('The suggested category for the gig, for context.'),
  subcategory: z.string().describe('The suggested subcategory for the gig, for context.'),
});
export type OptimizeSearchTagsInput = z.infer<typeof OptimizeSearchTagsInputSchema>;

export const OptimizeSearchTagsOutputSchema = z.object({
  searchTags: z
    .array(z.string())
    .length(5)
    .describe(
      'An array of 5 optimized search tags that are less competitive, highly relevant, and have good search volume, based on simulated deep keyword analysis. Ensure these are unique each time.'
    ),
});
export type OptimizeSearchTagsOutput = z.infer<typeof OptimizeSearchTagsOutputSchema>;

// --- Package Pricing Suggestion Schemas ---
export const SuggestPackagePricingInputSchema = z.object({
  keyword: z.string().describe('The main keyword for the Fiverr gig.'),
  category: z.string().describe('The suggested category for the gig.'),
  subcategory: z.string().describe('The suggested subcategory for the gig.'),
});
export type SuggestPackagePricingInput = z.infer<typeof SuggestPackagePricingInputSchema>;

export const SuggestPackagePricingOutputSchema = z.object({
  basic: z.number().describe('Suggested price for the basic package based on simulated competitor analysis.'),
  standard: z.number().describe('Suggested price for the standard package based on simulated competitor analysis.'),
  premium: z.number().describe('Suggested price for the premium package based on simulated competitor analysis.'),
});
export type SuggestPackagePricingOutput = z.infer<typeof SuggestPackagePricingOutputSchema>;

export const PricingPromptInputSchema = z.object({
  keyword: z.string().describe('The main keyword for the Fiverr gig.'),
  category: z.string().describe('The suggested category for the gig.'),
  subcategory: z.string().describe('The suggested subcategory for the gig.'),
  basicPrice: z.number().describe('The fetched basic price from (simulated) competitor analysis.'),
  standardPrice: z.number().describe('The fetched standard price from (simulated) competitor analysis.'),
  premiumPrice: z.number().describe('The fetched premium price from (simulated) competitor analysis.'),
});
export type PricingPromptInput = z.infer<typeof PricingPromptInputSchema>;


// --- Package Detail Generation Schemas ---
export const PackageDetailSchema = z.object({
  title: z.string().describe('The compelling title of the package (e.g., "Basic Spark", "Standard Growth", "Premium Pro"). This should be unique each time.'),
  price: z.number().describe('The price for this package.'),
  description: z.string().max(180, "Description must not exceed 180 characters.").describe('A detailed, benefit-oriented, and concise description (around 30 words, STRICTLY under 180 characters) of what is included in this package. Highlight key deliverables and unique selling points. This should be based on (simulated) deep research for the keyword and be unique each time.'),
  deliveryTime: z.string().describe('Estimated delivery time for this package (e.g., "3 Days", "1 Week").'),
  revisions: z.string().describe('Number of revisions included (e.g., "1 Revision", "3 Revisions", "Unlimited Revisions").')
});

export const GeneratePackageDetailsInputSchema = z.object({
  mainKeyword: z.string().describe('The main keyword for the Fiverr gig.'),
  gigTitle: z.string().describe('The title of the Fiverr gig.'),
  category: z.string().describe('The suggested category for the gig.'),
  subcategory: z.string().describe('The suggested subcategory for the gig.'),
  basePrice: z.number().describe('The AI-suggested base price for the most basic package, to be used as a reference from the pricing suggestion step.'),
  standardPrice: z.number().describe('The AI-suggested price for the standard package, to be used as a reference from the pricing suggestion step.'),
  premiumPrice: z.number().describe('The AI-suggested price for the premium package, to be used as a reference from the pricing suggestion step.'),
});
export type GeneratePackageDetailsInput = z.infer<typeof GeneratePackageDetailsInputSchema>;

export const GeneratePackageDetailsOutputSchema = z.object({
  basic: PackageDetailSchema.extend({price: z.number().describe('Final calculated price for the basic package.')}),
  standard: PackageDetailSchema.extend({price: z.number().describe('Final calculated price for the standard package.')}),
  premium: PackageDetailSchema.extend({price: z.number().describe('Final calculated price for the premium package.')})
});
export type GeneratePackageDetailsOutput = z.infer<typeof GeneratePackageDetailsOutputSchema>;


// --- Gig Description & FAQ Schemas ---
export const FAQSchema = z.object({
  question: z.string().describe('A frequently asked question, concise and relevant. Must be unique each time.'),
  answer: z.string().describe('A concise and helpful answer to the question. Must be unique each time.'),
});

export const GenerateGigDescriptionInputSchema = z.object({
  mainKeyword: z.string().describe('The main keyword for the Fiverr gig.'),
  gigTitle: z.string().describe('The title of the Fiverr gig.'),
  category: z.string().describe('The suggested category for the gig.'),
  subcategory: z.string().describe('The suggested subcategory for the gig.'),
  // This field is for providing context, simulating analyzed top gig data.
  topPerformingGigInsights: z.string().describe('Simulated insights from analyzing top-performing gigs (e.g., common features, successful copywriting angles).'),
  packageDetails: GeneratePackageDetailsOutputSchema.describe('The generated package details to inform the description.'),
});
export type GenerateGigDescriptionInput = z.infer<typeof GenerateGigDescriptionInputSchema>;

export const GenerateGigDescriptionOutputSchema = z.object({
  gigDescription: z.string().describe('The generated gig description in Markdown format, applying copywriting best practices (e.g., AIDA/PAS). Ensure this is unique each time.'),
  faqs: z.array(FAQSchema).min(4).max(5).describe('A list of 4 to 5 relevant and concise FAQs with their answers for the gig. Ensure these are unique each time.'),
});
export type GenerateGigDescriptionOutput = z.infer<typeof GenerateGigDescriptionOutputSchema>;


// --- Gig Title Generation Schemas ---
export const GenerateGigTitleInputSchema = z.object({
  mainKeyword: z.string().describe('The main keyword for the Fiverr gig.'),
});
export type GenerateGigTitleInput = z.infer<typeof GenerateGigTitleInputSchema>;

export const GenerateGigTitleOutputSchema = z.object({
  gigTitle: z.string().describe('The generated gig title optimized for Fiverr, incorporating power words and adhering to best practices. Ensure this is unique each time.'),
});
export type GenerateGigTitleOutput = z.infer<typeof GenerateGigTitleOutputSchema>;


// --- Client Requirement Suggestion Schemas ---
export const SuggestRequirementsInputSchema = z.object({
  gigTitle: z.string().describe('The title of the gig.'),
  gigCategory: z.string().describe('The category of the gig.'),
  gigSubcategory: z.string().describe('The subcategory of the gig.'),
  gigDescription: z.string().describe('The description of the gig.'),
});
export type SuggestRequirementsInput = z.infer<typeof SuggestRequirementsInputSchema>;

export const SuggestRequirementsOutputSchema = z.object({
  requirements: z
    .array(z.string())
    .describe('A list of suggested requirements from the client, tailored to the gig. Ensure these are unique and varied each time.'),
});
export type SuggestRequirementsOutput = z.infer<typeof SuggestRequirementsOutputSchema>;


// --- Gig Image Generation Schemas ---
export const GenerateGigImageInputSchema = z.object({
  mainKeyword: z.string().describe('The main keyword for the Fiverr gig.'),
  gigTitle: z.string().describe('The title of the Fiverr gig.'),
  category: z.string().describe('The suggested category for the gig.'),
  subcategory: z.string().describe('The suggested subcategory for the gig.'),
});
export type GenerateGigImageInput = z.infer<typeof GenerateGigImageInputSchema>;

export const GenerateGigImageOutputSchema = z.object({
  imageDataUri: z.string().describe("A data URI of the generated image (e.g., 'data:image/png;base64,...'). This image should be unique and relevant to the gig title and category."),
});
export type GenerateGigImageOutput = z.infer<typeof GenerateGigImageOutputSchema>;
