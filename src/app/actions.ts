
'use server';

import { generateTitleDescriptionImagePrompt } from '@/ai/flows/generate-title-description-image-prompt';
import { suggestGigCategory } from '@/ai/flows/suggest-gig-category';
import { optimizeSearchTags } from '@/ai/flows/optimize-search-tags';
import { suggestPackagePricing } from '@/ai/flows/suggest-package-pricing';
import { generatePackageDetails } from '@/ai/flows/generate-package-details';
import { generateGigDescription as generateFaqsOnly } from '@/ai/flows/generate-gig-description'; // Renamed for clarity
import { suggestRequirements } from '@/ai/flows/suggest-requirements';
import { generateGigImage } from '@/ai/flows/generate-gig-image';

import type { 
    GeneratePackageDetailsOutput,
    FAQSchema as FAQ
} from '@/ai/schemas/gig-generation-schemas';


export interface PricingPackage {
  title: string; 
  price: number;
  description: string;
  deliveryTime: string;
  revisions: string;
}

export interface GigData {
  title?: string;
  category?: string;
  subcategory?: string;
  searchTags?: string[];
  pricing?: GeneratePackageDetailsOutput; 
  description?: string; // Main gig description
  faqs?: FAQ[];
  requirements?: string[];
  imageDataUri?: string;
  imagePrompt?: string; // For potential display or debugging
  error?: string;
}

// Placeholder for top-performing gig insights simulation (used for FAQ context)
const getSimulatedTopGigInsights = (keyword: string, category: string, subcategory: string): string => {
  return `Simulated analysis for '${keyword}' in '${category} > ${subcategory}': Top gigs emphasize clear deliverables, fast communication, and showcase portfolio examples. They often use strong calls to action and highlight unique selling propositions like '24/7 support' or '100% satisfaction guarantee'. Common FAQs address scope, revisions, and custom orders.`;
};


export async function generateFullGig(mainKeyword: string): Promise<GigData> {
  if (!mainKeyword || mainKeyword.trim() === '') {
    return { error: 'Main keyword cannot be empty.' };
  }

  try {
    // Step 1: Generate Title, Description, and Image Prompt (New Central Flow)
    const titleDescImgPromptResult = await generateTitleDescriptionImagePrompt({ mainKeyword });
    const { gigTitle, gigDescription, imagePrompt } = titleDescImgPromptResult;
    if (!gigTitle || !gigDescription || !imagePrompt) {
      throw new Error("Failed to generate core gig content (title, description, or image prompt).");
    }

    // Step 2: Suggest Category & Subcategory (Depends on Title & Keyword)
    const categoryResult = await suggestGigCategory({ mainKeyword, gigTitle });
    const { category, subcategory } = categoryResult;
    if (!category || !subcategory) throw new Error("Failed to suggest category/subcategory.");

    // Step 3: Optimize Search Tags (Depends on Title, Keyword, Category)
    const tagsPromise = optimizeSearchTags({ mainKeyword, gigTitle, category, subcategory });

    // Step 4: Suggest Package Pricing (Depends on Keyword, Category)
    const pricingSuggestionPromise = suggestPackagePricing({ keyword: mainKeyword, category, subcategory });
    
    // Step 5: Generate Gig Image (Depends on Image Prompt from Step 1)
    const imagePromise = generateGigImage({ imagePrompt });

    // Awaiting results needed for subsequent dependent calls
    const [tagsResult, pricingSuggestionResult] = await Promise.all([
        tagsPromise,
        pricingSuggestionPromise,
    ]);

    const searchTags = tagsResult.searchTags;
    if (!searchTags || searchTags.length === 0) throw new Error("Failed to optimize search tags.");
    if (!pricingSuggestionResult) throw new Error("Failed to suggest package pricing.");

    // Step 6: Generate Detailed Pricing Packages 
    // (Depends on Keyword, Title, Category, and Suggested Prices)
    const detailedPricingPromise = generatePackageDetails({
      mainKeyword,
      gigTitle,
      category,
      subcategory,
      basePrice: pricingSuggestionResult.basic,
      standardPrice: pricingSuggestionResult.standard,
      premiumPrice: pricingSuggestionResult.premium,
    });
    
    const detailedPricingResult = await detailedPricingPromise;
    if (!detailedPricingResult) throw new Error("Failed to generate detailed pricing.");

    // Step 7: Generate FAQs (Uses old description flow, but primarily for FAQs)
    // Context for FAQs might still benefit from package details and simulated insights.
    const simulatedInsights = getSimulatedTopGigInsights(mainKeyword, category, subcategory);
    const faqPromise = generateFaqsOnly({ 
      mainKeyword, 
      gigTitle,
      category,
      subcategory,
      topPerformingGigInsights: simulatedInsights,
      packageDetails: detailedPricingResult 
    });

    // Step 8: Suggest Requirements (Depends on Title, Category, new Description)
    const requirementsPromise = suggestRequirements({
      gigTitle,
      gigCategory: category,
      gigSubcategory: subcategory,
      gigDescription: gigDescription, // Use the description from the new central flow
    });

    // Await the remaining parallel promises (FAQs, Requirements, Image)
    const [faqResult, requirementsResult, imageResult] = await Promise.all([
        faqPromise,
        requirementsPromise,
        imagePromise // Already awaited if sequential, but Promise.all handles it
    ]);
    
    const faqs = faqResult.faqs;
    if (!faqs || faqs.length === 0) throw new Error("Failed to generate FAQs.");

    const requirements = requirementsResult.requirements;
    if (!requirements || requirements.length === 0) throw new Error("Failed to suggest requirements.");
    
    const imageDataUri = imageResult.imageDataUri;
    // imageDataUri can be undefined if image generation fails, handle gracefully.
    
    return {
      title: gigTitle,
      category: category,
      subcategory: subcategory,
      searchTags: searchTags,
      pricing: detailedPricingResult,
      description: gigDescription, // Use description from the new central flow
      faqs: faqs,
      requirements: requirements,
      imageDataUri: imageDataUri,
      imagePrompt: imagePrompt, // Return the image prompt for reference
    };
  } catch (e: any) {
    console.error("Error generating full gig data:", e);
    let errorMessage = (e instanceof Error) ? e.message : 'Failed to generate gig data due to an unknown error.';
    
    if (e.message && e.message.toLowerCase().includes("image generation failed")) {
        errorMessage = "Image generation failed. The AI might be unable to create an image for this specific request, or safety filters could be active. Please try a different keyword or check model capabilities.";
    }
    return { error: errorMessage };
  }
}
