
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
import { analyzeMarketAndSuggestStrategy } from '@/ai/flows/analyze-market-strategy';
import { generateIntroVideoAssets } from '@/ai/flows/generate-intro-video-assets';


import type {
    GeneratePackageDetailsOutput,
    FAQ,
    SearchTagAnalytics,
    SinglePackageDetail,
    OptimizeSearchTagsInput,
    GenerateGigImageFromPromptInput,
    GenerateGigImageOutput,
    RegenerateGigTitleInput,
    RegenerateGigTitleOutput,
    AnalyzeMarketStrategyInput,
    AnalyzeMarketStrategyOutput,
    GenerateTitleDescImgPromptInput,
    GenerateIntroVideoAssetsInput,
    GenerateIntroVideoAssetsOutput
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
  imageDataUris?: string[];
  imagePrompts?: string[];
  error?: string;
  marketAnalysis?: AnalyzeMarketStrategyOutput;
  introVideoAssets?: GenerateIntroVideoAssetsOutput; // Added for intro video
}

const getSimulatedTopGigInsights = (keyword: string, category: string, subcategory: string): string => {
  return `Simulated analysis for '${keyword}' in '${category} > ${subcategory}': Top gigs emphasize clear deliverables, fast communication, and showcase portfolio examples. They often use strong calls to action and highlight unique selling propositions like '24/7 support' or '100% satisfaction guarantee'. Common FAQs address scope, revisions, and custom orders. Ensure descriptions are SEO-friendly and packages offer clear value progression.`;
};


export async function generateFullGig(mainKeyword: string, marketAnalysis?: AnalyzeMarketStrategyOutput): Promise<GigData> {
  if (!mainKeyword || mainKeyword.trim() === '') {
    return { error: 'Main keyword cannot be empty.' };
  }

  let progress = 0;
  const incrementProgress = (amount: number) => { progress += amount; /* console.log(`Progress: ${progress}%`); */ };

  try {
    const titleDescImgPromptInput: GenerateTitleDescImgPromptInput = {
        mainKeyword,
        ...(marketAnalysis?.strategicRecommendationsForUser && { strategicRecommendations: marketAnalysis.strategicRecommendationsForUser }),
        ...(marketAnalysis?.overallMarketSummary && { overallMarketSummary: marketAnalysis.overallMarketSummary }),
    };

    const titleDescImgPromptResult = await generateTitleDescriptionImagePrompt(titleDescImgPromptInput);
    incrementProgress(15);
    const { gigTitle, gigDescription, imagePrompts } = titleDescImgPromptResult;
    if (!gigTitle || !gigDescription || !imagePrompts || imagePrompts.length !== 3) {
      throw new Error("Failed to generate core gig content (title, description, or 3 image prompts).");
    }

    const categoryResult = await suggestGigCategory({ mainKeyword, gigTitle });
    incrementProgress(10);
    const { category, subcategory } = categoryResult;
    if (!category || !subcategory) throw new Error("Failed to suggest category/subcategory.");

    const tagsPromise = optimizeSearchTags({ mainKeyword, gigTitle, category, subcategory });
    const pricingSuggestionPromise = suggestPackagePricing({ keyword: mainKeyword, category, subcategory });
    const imagesPromise = generateGigImage({ imagePrompts });

    const [tagsResult, pricingSuggestionResult] = await Promise.all([
        tagsPromise.then(res => { incrementProgress(15); return res; }),
        pricingSuggestionPromise.then(res => { incrementProgress(10); return res; }),
    ]);

    const searchTags = tagsResult.searchTags;
    if (!searchTags || searchTags.length === 0) throw new Error("Failed to optimize search tags.");
    if (!pricingSuggestionResult) throw new Error("Failed to suggest package pricing.");

    const detailedPricingPromise = generatePackageDetails({
      mainKeyword,
      gigTitle,
      category,
      subcategory,
      basePrice: pricingSuggestionResult.basic,
      standardPrice: pricingSuggestionResult.standard,
      premiumPrice: pricingSuggestionResult.premium,
    });

    const insightsForFaq = marketAnalysis?.overallMarketSummary || getSimulatedTopGigInsights(mainKeyword, category, subcategory);


    const requirementsPromise = suggestRequirements({
      gigTitle,
      gigCategory: category,
      gigSubcategory: subcategory,
      gigDescription: gigDescription,
    });

    const detailedPricingResult = await detailedPricingPromise;
    incrementProgress(20);
    if (!detailedPricingResult) throw new Error("Failed to generate detailed pricing.");

    const faqPromise = generateFaqsOnly({
      mainKeyword,
      gigTitle,
      category,
      subcategory,
      topPerformingGigInsights: insightsForFaq,
      packageDetails: detailedPricingResult
    });

    const [faqResult, requirementsResult, imagesResult] = await Promise.all([
        faqPromise.then(res => { incrementProgress(10); return res; }),
        requirementsPromise.then(res => { incrementProgress(10); return res; }),
        imagesPromise.then(res => { incrementProgress(10); return res; })
    ]);

    const faqs = faqResult.faqs;
    if (!faqs || faqs.length === 0) throw new Error("Failed to generate FAQs.");

    const requirements = requirementsResult.requirements;
    if (!requirements || requirements.length === 0) throw new Error("Failed to suggest requirements.");

    const imageDataUris = imagesResult?.imageDataUris;
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
      imageDataUris: imageDataUris,
      imagePrompts: imagePrompts,
      marketAnalysis: marketAnalysis
    };
  } catch (e: any) {
    console.error("Error generating full gig data:", e);
    let errorMessage = (e instanceof Error) ? e.message : 'Failed to generate gig data due to an unknown error.';
     if (e.message) {
        const lowerMessage = e.message.toLowerCase();
        if (lowerMessage.includes("image generation failed") || lowerMessage.includes("safety filters") || lowerMessage.includes("returned no media url")) {
            errorMessage = "Image generation failed. The AI might be unable to create an image for this specific request, or safety filters might have blocked it. Please try a different keyword or check model capabilities.";
        } else if (lowerMessage.includes("503") || lowerMessage.includes("overloaded") || lowerMessage.includes("service unavailable") || lowerMessage.includes("model is overloaded") || lowerMessage.includes("failed_precondition")) {
            errorMessage = "The AI service is currently experiencing high load or is temporarily unavailable. This is usually a temporary issue. Please try again in a few moments.";
        } else if (lowerMessage.includes("auth/unauthorized-domain") || lowerMessage.includes("firebase auth error")) {
          errorMessage = e.message;
        } else if (lowerMessage.includes("invalid_argument") && lowerMessage.includes("schema validation failed")) {
            errorMessage = `Schema validation failed. This often means the AI's response didn't match the expected format (e.g., text too long, missing fields). Details: ${e.message.substring(0, 200)}...`;
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
     if (e.message && (e.message.includes("503") || e.message.includes("overloaded") || e.message.includes("service unavailable") || e.message.includes("model is overloaded") || e.message.includes("failed_precondition"))) {
        errorMessage = "The AI service for search tag optimization is currently experiencing high load or is temporarily unavailable. Please try again in a few moments.";
    }
    return { error: errorMessage };
  }
}


export async function regenerateGigImageAction(
  input: GenerateGigImageFromPromptInput
): Promise<GenerateGigImageOutput | { error: string }> {
  if (!input.imagePrompts || input.imagePrompts.length === 0) {
    return { error: 'Image prompts are required to regenerate images.' };
  }
  try {
    const result = await generateGigImage(input);
    if (!result.imageDataUris || result.imageDataUris.length === 0) {
      return { error: "AI failed to return any image data URIs." };
    }
    return result;
  } catch (e: any) {
    console.error("Error regenerating gig images:", e);
    let errorMessage = (e instanceof Error) ? e.message : 'Failed to regenerate images due to an unknown error.';
    if (e.message) {
        const lowerMessage = e.message.toLowerCase();
        if (lowerMessage.includes("image generation failed") || lowerMessage.includes("safety filters") || lowerMessage.includes("returned no media url")) {
            errorMessage = "Image regeneration failed. The AI might be unable to create an image for this specific prompt, or safety filters might have blocked it. Please try a different approach or check model capabilities.";
        } else if (lowerMessage.includes("503") || lowerMessage.includes("overloaded") || lowerMessage.includes("service unavailable") || lowerMessage.includes("model is overloaded") || lowerMessage.includes("failed_precondition")) {
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
    if (e.message && (e.message.includes("503") || e.message.includes("overloaded") || e.message.includes("service unavailable") || e.message.includes("model is overloaded") || e.message.includes("failed_precondition"))) {
        errorMessage = "The AI service for title regeneration is currently experiencing high load or is temporarily unavailable. Please try again in a few moments.";
    }
    return { error: errorMessage };
  }
}


export async function analyzeMarketStrategyAction(
  input: AnalyzeMarketStrategyInput
): Promise<AnalyzeMarketStrategyOutput | { error: string }> {
  if (!input.mainKeyword || input.mainKeyword.trim() === '') {
    return { error: 'Main keyword cannot be empty for market analysis.' };
  }
  try {
    const result = await analyzeMarketAndSuggestStrategy(input);
    if (!result) {
        throw new Error("AI failed to return market analysis data.");
    }
    return result;
  } catch (e: any) {
    console.error("Error analyzing market strategy:", e);
    let errorMessage = (e instanceof Error) ? e.message : 'Failed to analyze market strategy due to an unknown error.';
     if (e.message) {
        const lowerMessage = e.message.toLowerCase();
        if (lowerMessage.includes("503") || lowerMessage.includes("overloaded") || lowerMessage.includes("service unavailable") || lowerMessage.includes("model is overloaded") || lowerMessage.includes("failed_precondition")) {
            errorMessage = "The AI service for market analysis is currently experiencing high load or is temporarily unavailable. Please try again in a few moments.";
        } else if (lowerMessage.includes("invalid_argument") && lowerMessage.includes("schema validation failed")) {
             errorMessage = `Schema validation failed for market analysis. This often means the AI's response didn't match the expected format. Details: ${e.message.substring(0, 200)}...`;
        }
    }
    return { error: errorMessage };
  }
}

export async function generateIntroVideoAssetsAction(
  input: GenerateIntroVideoAssetsInput
): Promise<GenerateIntroVideoAssetsOutput | { error: string }> {
  if (!input.mainKeyword || !input.gigTitle || !input.gigDescription) {
    return { error: 'Main keyword, gig title, and gig description are required to generate video assets.' };
  }
  try {
    const result = await generateIntroVideoAssets(input);
    if (!result) {
        throw new Error("AI failed to return intro video assets data.");
    }
    return result;
  } catch (e: any) {
    console.error("Error generating intro video assets:", e);
    let errorMessage = (e instanceof Error) ? e.message : 'Failed to generate intro video assets due to an unknown error.';
     if (e.message) {
        const lowerMessage = e.message.toLowerCase();
        if (lowerMessage.includes("503") || lowerMessage.includes("overloaded") || lowerMessage.includes("service unavailable") || lowerMessage.includes("model is overloaded") || lowerMessage.includes("failed_precondition")) {
            errorMessage = "The AI service for video asset generation is currently experiencing high load or is temporarily unavailable. Please try again in a few moments.";
        } else if (lowerMessage.includes("invalid_argument") && lowerMessage.includes("schema validation failed")) {
             errorMessage = `Schema validation failed for video assets. This often means the AI's response didn't match the expected format. Details: ${e.message.substring(0, 200)}...`;
        }
    }
    return { error: errorMessage };
  }
}
