
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
export const SearchTagAnalyticsSchema = z.object({
  term: z.string().describe('A related keyword term.'),
  volume: z.enum(['High', 'Medium', 'Low']).optional().describe('Simulated search volume (High, Medium, Low).'),
  competition: z.enum(['High', 'Medium', 'Low']).optional().describe('Simulated competition level (High, Medium, Low).'),
});
export type SearchTagAnalytics = z.infer<typeof SearchTagAnalyticsSchema>;

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
    .array(SearchTagAnalyticsSchema)
    .min(1) // Expect at least one tag, ideally 5
    .describe(
      'An array of 5 optimized search tags with their (simulated) analytics. Ensure these are unique each time.'
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
export const SinglePackageDetailSchema = z.object({ 
  title: z.string().describe('The compelling title of the package (e.g., "Basic Spark", "Standard Growth", "Premium Pro"). This should be unique each time.'),
  price: z.number().describe('The price for this package.'),
  description: z.string().max(180, "Description must not exceed 180 characters.").describe('A detailed, benefit-oriented, and concise description (around 30 words, STRICTLY under 180 characters) of what is included in this package. Highlight key deliverables and unique selling points. This should be based on (simulated) deep research for the keyword and be unique each time.'),
  deliveryTime: z.string().describe('Estimated delivery time for this package (e.g., "3 Days", "1 Week").'),
  revisions: z.string().describe('Number of revisions included (e.g., "1 Revision", "3 Revisions", "Unlimited Revisions").')
});
export type SinglePackageDetail = z.infer<typeof SinglePackageDetailSchema>;


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
  basic: SinglePackageDetailSchema.extend({price: z.number().describe('Final calculated price for the basic package.')}),
  standard: SinglePackageDetailSchema.extend({price: z.number().describe('Final calculated price for the standard package.')}),
  premium: SinglePackageDetailSchema.extend({price: z.number().describe('Final calculated price for the premium package.')})
});
export type GeneratePackageDetailsOutput = z.infer<typeof GeneratePackageDetailsOutputSchema>;


// --- Gig Description & FAQ Schemas (FAQ part is still relevant) ---
export const FAQSchema = z.object({
  question: z.string().describe('A frequently asked question, concise and relevant. Must be unique each time.'),
  answer: z.string().describe('A concise and helpful answer to the question. Must be unique each time.'),
});
export type FAQ = z.infer<typeof FAQSchema>;


export const GenerateGigDescriptionInputSchema = z.object({
  mainKeyword: z.string().describe('The main keyword for the Fiverr gig.'),
  gigTitle: z.string().describe('The title of the Fiverr gig.'),
  category: z.string().describe('The suggested category for the gig.'),
  subcategory: z.string().describe('The suggested subcategory for the gig.'),
  topPerformingGigInsights: z.string().describe('Simulated insights from analyzing top-performing gigs (e.g., common features, successful copywriting angles).'),
  packageDetails: GeneratePackageDetailsOutputSchema.describe('The generated package details to inform the description (primarily for FAQ context now).'),
});
export type GenerateGigDescriptionInput = z.infer<typeof GenerateGigDescriptionInputSchema>;

export const GenerateGigDescriptionOutputSchema = z.object({
  gigDescription: z.string().describe('The generated gig description in Markdown format. Ensure this is unique each time.'),
  faqs: z.array(FAQSchema).min(4).max(5).describe('A list of 4 to 5 relevant and concise FAQs with their answers for the gig. Ensure these are unique each time.'),
});
export type GenerateGigDescriptionOutput = z.infer<typeof GenerateGigDescriptionOutputSchema>;


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


// --- Gig Image Generation Schemas (Updated to take an image prompt) ---
export const GenerateGigImageFromPromptInputSchema = z.object({
  imagePrompt: z.string().describe('A detailed prompt for an AI image generator. This prompt is expected to be generated by another flow and should instruct the image AI on style, content, dimensions, text (if any), colors, quality, and negative constraints to create a professional, unique, and Fiverr-compliant gig thumbnail.'),
});
export type GenerateGigImageFromPromptInput = z.infer<typeof GenerateGigImageFromPromptInputSchema>;

export const GenerateGigImageOutputSchema = z.object({
  imageDataUri: z.string().describe("A data URI of the generated image (e.g., 'data:image/png;base64,...'). This image should be unique and relevant to the image prompt."),
});
export type GenerateGigImageOutput = z.infer<typeof GenerateGigImageOutputSchema>;


// --- NEW: Central Title, Description, Image Prompt Schemas ---
export const GenerateTitleDescImgPromptInputSchema = z.object({
  mainKeyword: z.string().describe('The main keyword for the Fiverr gig.'),
});
export type GenerateTitleDescImgPromptInput = z.infer<typeof GenerateTitleDescImgPromptInputSchema>;

export const GenerateTitleDescImgPromptOutputSchema = z.object({
  gigTitle: z.string().describe('Generated gig title, under 80 chars, SEO-optimized, persuasive, with a unique selling point.'),
  gigDescription: z.string().describe('Generated gig description in Markdown, structured with sections (hook, about, benefits, delivery, CTA), unique angle, and chosen tone.'),
  imagePrompt: z.string().describe('A highly detailed, unique prompt for an AI image generator. It should specify ideal dimensions (e.g., 1280x769px), theme/style (e.g., modern eCommerce, professional graphic design), background, key visual elements, typography guidelines (if text is essential, keep it minimal and legible), color scheme, quality descriptors (high resolution, sharp details), and negative constraints (no copyrighted elements). The prompt aims to produce a professional, engaging, and Fiverr-compliant gig thumbnail that reflects the gig title and description.'),
});
export type GenerateTitleDescImgPromptOutput = z.infer<typeof GenerateTitleDescImgPromptOutputSchema>;

