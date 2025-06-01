
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
  imageDataUri?: string;
  imagePrompt?: string;
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
    // Step 1: Generate Title, Description, and Image Prompt (New Central Flow)
    const titleDescImgPromptResult = await generateTitleDescriptionImagePrompt({ mainKeyword });
    incrementProgress(15); // Estimate: 15%
    const { gigTitle, gigDescription, imagePrompt } = titleDescImgPromptResult;
    if (!gigTitle || !gigDescription || !imagePrompt) {
      throw new Error("Failed to generate core gig content (title, description, or image prompt).");
    }

    // Step 2: Suggest Category & Subcategory (Depends on Title & Keyword)
    const categoryResult = await suggestGigCategory({ mainKeyword, gigTitle });
    incrementProgress(10); // Estimate: +10% = 25%
    const { category, subcategory } = categoryResult;
    if (!category || !subcategory) throw new Error("Failed to suggest category/subcategory.");

    // Step 3: Optimize Search Tags (Depends on Title, Keyword, Category, Subcategory)
    const tagsPromise = optimizeSearchTags({ mainKeyword, gigTitle, category, subcategory });

    // Step 4: Suggest Package Pricing (Depends on Keyword, Category, Subcategory)
    const pricingSuggestionPromise = suggestPackagePricing({ keyword: mainKeyword, category, subcategory });

    // Step 5: Generate Gig Image (Depends on Image Prompt from Step 1) - Start this early
    const imagePromise = generateGigImage({ imagePrompt }); // Pass the generated prompt

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

    // Step 7: Generate FAQs (using the original description flow, but primarily for its FAQ capability)
    const simulatedInsights = getSimulatedTopGigInsights(mainKeyword, category, subcategory);
    // Note: detailedPricingResult is awaited below before being passed here

    // Step 8: Suggest Requirements
    const requirementsPromise = suggestRequirements({
      gigTitle,
      gigCategory: category,
      gigSubcategory: subcategory,
      gigDescription: gigDescription, // Use the description from the new central flow
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

    const [faqResult, requirementsResult, imageResult] = await Promise.all([
        faqPromise.then(res => { incrementProgress(10); return res; }), // +10% = 80%
        requirementsPromise.then(res => { incrementProgress(10); return res; }), // +10% = 90%
        imagePromise.then(res => { incrementProgress(10); return res; }) // +10% = 100%
    ]);

    const faqs = faqResult.faqs;
    if (!faqs || faqs.length === 0) throw new Error("Failed to generate FAQs.");

    const requirements = requirementsResult.requirements;
    if (!requirements || requirements.length === 0) throw new Error("Failed to suggest requirements.");

    const imageDataUri = imageResult?.imageDataUri;

    return {
      title: gigTitle,
      category: category,
      subcategory: subcategory,
      searchTags: searchTags,
      pricing: detailedPricingResult,
      description: gigDescription,
      faqs: faqs,
      requirements: requirements,
      imageDataUri: imageDataUri,
      imagePrompt: imagePrompt,
    };
  } catch (e: any) {
    console.error("Error generating full gig data:", e);
    let errorMessage = (e instanceof Error) ? e.message : 'Failed to generate gig data due to an unknown error.';

    if (e.message) {
        const lowerMessage = e.message.toLowerCase();
        if (lowerMessage.includes("image generation failed") || lowerMessage.includes("safety filters")) {
            errorMessage = "Image generation failed. The AI might be unable to create an image for this specific request, or safety filters might have blocked it. Please try a different keyword or check model capabilities.";
        } else if (lowerMessage.includes("503") || lowerMessage.includes("overloaded") || lowerMessage.includes("service unavailable") || lowerMessage.includes("model is overloaded")) {
            errorMessage = "The AI service is currently overloaded or unavailable. This is a temporary issue. Please try again in a few moments. (Details: " + e.message + ")";
        } else if (lowerMessage.includes("auth/unauthorized-domain") || lowerMessage.includes("firebase auth error")) {
          errorMessage = e.message; // Use the detailed message from firebase.ts
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
        errorMessage = "The AI service is currently overloaded or unavailable. This is a temporary issue. Please try again in a few moments. (Details: " + e.message + ")";
    }
    return { error: errorMessage };
  }
}


export async function regenerateGigImageAction(
  input: GenerateGigImageFromPromptInput
): Promise<GenerateGigImageOutput | { error: string }> {
  if (!input.imagePrompt) {
    return { error: 'Image prompt is required to regenerate an image.' };
  }
  try {
    const result = await generateGigImage(input);
    if (!result.imageDataUri) {
      return { error: "AI failed to return an image data URI." };
    }
    return result;
  } catch (e: any) {
    console.error("Error regenerating gig image:", e);
    let errorMessage = (e instanceof Error) ? e.message : 'Failed to regenerate image due to an unknown error.';
    if (e.message) {
        const lowerMessage = e.message.toLowerCase();
        if (lowerMessage.includes("image generation failed") || lowerMessage.includes("safety filters")) {
            errorMessage = "Image regeneration failed. The AI might be unable to create an image for this specific prompt, or safety filters might have blocked it. Please try a different approach or check model capabilities.";
        } else if (lowerMessage.includes("503") || lowerMessage.includes("overloaded") || lowerMessage.includes("service unavailable") || lowerMessage.includes("model is overloaded")) {
            errorMessage = "The AI service is currently overloaded or unavailable for image generation. Please try again in a few moments. (Details: " + e.message + ")";
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
        errorMessage = "The AI service is currently overloaded or unavailable for title regeneration. Please try again in a few moments. (Details: " + e.message + ")";
    }
    return { error: errorMessage };
  }
}
