
'use server';

import { generateTitleDescriptionImagePrompt } from '@/ai/flows/generate-title-description-image-prompt';
import { suggestGigCategory } from '@/ai/flows/suggest-gig-category';
import { optimizeSearchTags } from '@/ai/flows/optimize-search-tags';
import { suggestPackagePricing } from '@/ai/flows/suggest-package-pricing';
import { generatePackageDetails } from '@/ai/flows/generate-package-details';
import { generateGigDescription as generateFaqsOnly } from '@/ai/flows/generate-gig-description';
import { suggestRequirements } from '@/ai/flows/suggest-requirements';
import { generateGigImage } from '@/ai/flows/generate-gig-image';
import { regenerateGigTitle } from '@/ai/flows/regenerate-gig-title';


import type {
    GeneratePackageDetailsOutput,
    FAQ,
    SearchTagAnalytics,
    SinglePackageDetail,
    OptimizeSearchTagsInput,
    GenerateGigImageFromPromptInput,
    GenerateGigImageOutput,
    RegenerateGigTitleInput,
    RegenerateGigTitleOutput
} from '@/ai/schemas/gig-generation-schemas';


export interface PricingPackageUi extends SinglePackageDetail {
  tierName: string;
}

export interface GigData {
  title?: string;
  category?: string;
  subcategory?: string;
  searchTags?: SearchTagAnalytics[];
  pricing?: GeneratePackageDetailsOutput;
  description?: string;
  faqs?: FAQ[];
  requirements?: string[];
  imageDataUris?: string[]; // Changed from imageDataUri to imageDataUris (array)
  imagePrompts?: string[]; // Changed from imagePrompt to imagePrompts (array)
  error?: string;
}

const getSimulatedTopGigInsights = (keyword: string, category: string, subcategory: string): string => {
  return `Simulated analysis for '${keyword}' in '${category} > ${subcategory}': Top gigs emphasize clear deliverables, fast communication, and showcase portfolio examples. They often use strong calls to action and highlight unique selling propositions like '24/7 support' or '100% satisfaction guarantee'. Common FAQs address scope, revisions, and custom orders. Ensure descriptions are SEO-friendly and packages offer clear value progression.`;
};


export async function generateFullGig(mainKeyword: string): Promise<GigData> {
  if (!mainKeyword || mainKeyword.trim() === '') {
    return { error: 'Main keyword cannot be empty.' };
  }

  let progress = 0;
  const incrementProgress = (amount: number) => { progress += amount; /* console.log(`Progress: ${progress}%`); */ };

  try {
    // Step 1: Generate Title, Description, and Image Prompts (Array)
    const titleDescImgPromptResult = await generateTitleDescriptionImagePrompt({ mainKeyword });
    incrementProgress(15); // Estimate: 15%
    const { gigTitle, gigDescription, imagePrompts } = titleDescImgPromptResult; // imagePrompts is now an array
    if (!gigTitle || !gigDescription || !imagePrompts || imagePrompts.length !== 3) {
      throw new Error("Failed to generate core gig content (title, description, or 3 image prompts).");
    }

    // Step 2: Suggest Category & Subcategory
    const categoryResult = await suggestGigCategory({ mainKeyword, gigTitle });
    incrementProgress(10); // Estimate: +10% = 25%
    const { category, subcategory } = categoryResult;
    if (!category || !subcategory) throw new Error("Failed to suggest category/subcategory.");

    // Step 3: Optimize Search Tags
    const tagsPromise = optimizeSearchTags({ mainKeyword, gigTitle, category, subcategory });

    // Step 4: Suggest Package Pricing
    const pricingSuggestionPromise = suggestPackagePricing({ keyword: mainKeyword, category, subcategory });

    // Step 5: Generate Gig Images (plural, takes array of prompts)
    const imagesPromise = generateGigImage({ imagePrompts }); // Pass the array of prompts

    // Awaiting results needed for subsequent dependent calls
    const [tagsResult, pricingSuggestionResult] = await Promise.all([
        tagsPromise.then(res => { incrementProgress(15); return res; }), // +15% = 40%
        pricingSuggestionPromise.then(res => { incrementProgress(10); return res; }), // +10% = 50%
    ]);

    const searchTags = tagsResult.searchTags;
    if (!searchTags || searchTags.length === 0) throw new Error("Failed to optimize search tags.");
    if (!pricingSuggestionResult) throw new Error("Failed to suggest package pricing.");

    // Step 6: Generate Detailed Pricing Packages
    const detailedPricingPromise = generatePackageDetails({
      mainKeyword,
      gigTitle,
      category,
      subcategory,
      basePrice: pricingSuggestionResult.basic,
      standardPrice: pricingSuggestionResult.standard,
      premiumPrice: pricingSuggestionResult.premium,
    });

    // Step 7: Generate FAQs
    const simulatedInsights = getSimulatedTopGigInsights(mainKeyword, category, subcategory);

    // Step 8: Suggest Requirements
    const requirementsPromise = suggestRequirements({
      gigTitle,
      gigCategory: category,
      gigSubcategory: subcategory,
      gigDescription: gigDescription,
    });

    // Await remaining promises
    const detailedPricingResult = await detailedPricingPromise;
    incrementProgress(20); // +20% = 70%
    if (!detailedPricingResult) throw new Error("Failed to generate detailed pricing.");

    const faqPromise = generateFaqsOnly({
      mainKeyword,
      gigTitle,
      category,
      subcategory,
      topPerformingGigInsights: simulatedInsights,
      packageDetails: detailedPricingResult
    });

    const [faqResult, requirementsResult, imagesResult] = await Promise.all([ // imagesResult (plural)
        faqPromise.then(res => { incrementProgress(10); return res; }), // +10% = 80%
        requirementsPromise.then(res => { incrementProgress(10); return res; }), // +10% = 90%
        imagesPromise.then(res => { incrementProgress(10); return res; }) // +10% = 100%
    ]);

    const faqs = faqResult.faqs;
    if (!faqs || faqs.length === 0) throw new Error("Failed to generate FAQs.");

    const requirements = requirementsResult.requirements;
    if (!requirements || requirements.length === 0) throw new Error("Failed to suggest requirements.");

    const imageDataUris = imagesResult?.imageDataUris; // imageDataUris (plural)
    if(!imageDataUris || imageDataUris.length === 0) throw new Error("Failed to generate gig images.");


    return {
      title: gigTitle,
      category: category,
      subcategory: subcategory,
      searchTags: searchTags,
      pricing: detailedPricingResult,
      description: gigDescription,
      faqs: faqs,
      requirements: requirements,
      imageDataUris: imageDataUris, // Store array of image URIs
      imagePrompts: imagePrompts, // Store array of image prompts
    };
  } catch (e: any) {
    console.error("Error generating full gig data:", e);
    let errorMessage = (e instanceof Error) ? e.message : 'Failed to generate gig data due to an unknown error.';

    if (e.message) {
        const lowerMessage = e.message.toLowerCase();
        if (lowerMessage.includes("image generation failed") || lowerMessage.includes("safety filters") || lowerMessage.includes("returned no media url")) {
            errorMessage = "Image generation failed. The AI might be unable to create an image for this specific request, or safety filters might have blocked it. Please try a different keyword or check model capabilities.";
        } else if (lowerMessage.includes("503") || lowerMessage.includes("overloaded") || lowerMessage.includes("service unavailable") || lowerMessage.includes("model is overloaded")) {
            errorMessage = "The AI service is currently experiencing high load or is temporarily unavailable. This is usually a temporary issue. Please try again in a few moments.";
        } else if (lowerMessage.includes("auth/unauthorized-domain") || lowerMessage.includes("firebase auth error")) {
          errorMessage = e.message;
        }
    }
    return { error: errorMessage };
  }
}

export async function refreshSearchTagsAction(input: OptimizeSearchTagsInput): Promise<SearchTagAnalytics[] | { error: string }> {
  if (!input.mainKeyword || !input.gigTitle || !input.category || !input.subcategory) {
    return { error: 'Missing required input for refreshing search tags.' };
  }
  try {
    const result = await optimizeSearchTags(input);
    if (!result.searchTags || result.searchTags.length === 0) {
      return { error: "AI failed to return any search tags." };
    }
    return result.searchTags;
  } catch (e: any) {
    console.error("Error refreshing search tags:", e);
    let errorMessage = (e instanceof Error) ? e.message : 'Failed to refresh search tags due to an unknown error.';
     if (e.message && (e.message.includes("503") || e.message.includes("overloaded") || e.message.includes("service unavailable") || e.message.includes("model is overloaded"))) {
        errorMessage = "The AI service for search tag optimization is currently experiencing high load or is temporarily unavailable. Please try again in a few moments.";
    }
    return { error: errorMessage };
  }
}


export async function regenerateGigImageAction(
  input: GenerateGigImageFromPromptInput // Accepts array of prompts
): Promise<GenerateGigImageOutput | { error: string }> { // Returns array of URIs
  if (!input.imagePrompts || input.imagePrompts.length === 0) {
    return { error: 'Image prompts are required to regenerate images.' };
  }
  try {
    const result = await generateGigImage(input);
    if (!result.imageDataUris || result.imageDataUris.length === 0) {
      return { error: "AI failed to return any image data URIs." };
    }
    return result; // Contains imageDataUris array
  } catch (e: any) {
    console.error("Error regenerating gig images:", e);
    let errorMessage = (e instanceof Error) ? e.message : 'Failed to regenerate images due to an unknown error.';
    if (e.message) {
        const lowerMessage = e.message.toLowerCase();
        if (lowerMessage.includes("image generation failed") || lowerMessage.includes("safety filters") || lowerMessage.includes("returned no media url")) {
            errorMessage = "Image regeneration failed. The AI might be unable to create an image for this specific prompt, or safety filters might have blocked it. Please try a different approach or check model capabilities.";
        } else if (lowerMessage.includes("503") || lowerMessage.includes("overloaded") || lowerMessage.includes("service unavailable") || lowerMessage.includes("model is overloaded")) {
            errorMessage = "The AI service for image generation is currently experiencing high load or is temporarily unavailable. Please try again in a few moments.";
        }
    }
    return { error: errorMessage };
  }
}

export async function regenerateTitleAction(
  input: RegenerateGigTitleInput
): Promise<RegenerateGigTitleOutput | { error: string }> {
  if (!input.mainKeyword) {
    return { error: 'Main keyword is required to regenerate a title.' };
  }
  try {
    const result = await regenerateGigTitle(input);
    if (!result.newGigTitle) {
      return { error: "AI failed to return a new gig title." };
    }
    return result;
  } catch (e: any) {
    console.error("Error regenerating gig title:", e);
    let errorMessage = (e instanceof Error) ? e.message : 'Failed to regenerate title due to an unknown error.';
    if (e.message && (e.message.includes("503") || e.message.includes("overloaded") || e.message.includes("service unavailable") || e.message.includes("model is overloaded"))) {
        errorMessage = "The AI service for title regeneration is currently experiencing high load or is temporarily unavailable. Please try again in a few moments.";
    }
    return { error: errorMessage };
  }
}
