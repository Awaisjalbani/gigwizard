
'use server';

import { generateGigTitle } from '@/ai/flows/generate-gig-title';
import { suggestGigCategory } from '@/ai/flows/suggest-gig-category'; // New flow
import { optimizeSearchTags } from '@/ai/flows/optimize-search-tags';
import { suggestPackagePricing } from '@/ai/flows/suggest-package-pricing';
import { generatePackageDetails } from '@/ai/flows/generate-package-details';
import { generateGigDescription } from '@/ai/flows/generate-gig-description';
import { suggestRequirements } from '@/ai/flows/suggest-requirements';
import { generateGigImage } from '@/ai/flows/generate-gig-image';

import type { 
    GeneratePackageDetailsOutput,
    SuggestedCategory, // For category output
    FAQSchema as FAQ // Renamed for clarity if needed locally
} from '@/ai/schemas/gig-generation-schemas';


export interface PricingPackage {
  title: string; 
  price: number;
  description: string; // This will be the short, AI-generated description for display
  deliveryTime: string;
  revisions: string;
}

export interface GigData {
  title?: string;
  category?: string; // Main category
  subcategory?: string; // Subcategory
  searchTags?: string[];
  // pricing structure matches GeneratePackageDetailsOutput directly
  pricing?: GeneratePackageDetailsOutput; 
  description?: string; // Full gig description from AI
  faqs?: FAQ[]; // Using the imported FAQ type
  requirements?: string[];
  imageDataUri?: string;
  error?: string;
}

// Placeholder for top-performing gig insights simulation
const getSimulatedTopGigInsights = (keyword: string, category: string, subcategory: string): string => {
  return `Simulated analysis for '${keyword}' in '${category} > ${subcategory}': Top gigs emphasize clear deliverables, fast communication, and showcase portfolio examples. They often use strong calls to action and highlight unique selling propositions like '24/7 support' or '100% satisfaction guarantee'. Common FAQs address scope, revisions, and custom orders.`;
};


export async function generateFullGig(mainKeyword: string): Promise<GigData> {
  if (!mainKeyword || mainKeyword.trim() === '') {
    return { error: 'Main keyword cannot be empty.' };
  }

  try {
    // Step 1: Generate Gig Title (Independent)
    const titleResult = await generateGigTitle({ mainKeyword });
    const gigTitle = titleResult.gigTitle;
    if (!gigTitle) throw new Error("Failed to generate gig title.");

    // Step 2: Suggest Category & Subcategory (Depends on Title & Keyword)
    const categoryResult = await suggestGigCategory({ mainKeyword, gigTitle });
    const { category, subcategory } = categoryResult;
    if (!category || !subcategory) throw new Error("Failed to suggest category/subcategory.");

    // Step 3: Optimize Search Tags (Depends on Title, Keyword, Category)
    const tagsPromise = optimizeSearchTags({ mainKeyword, gigTitle, category, subcategory });

    // Step 4: Suggest Package Pricing (Depends on Keyword, Category)
    const pricingSuggestionPromise = suggestPackagePricing({ keyword: mainKeyword, category, subcategory });
    
    // Awaiting results needed for subsequent dependent calls
    const [tagsResult, pricingSuggestionResult] = await Promise.all([
        tagsPromise,
        pricingSuggestionPromise
    ]);
    const searchTags = tagsResult.searchTags;
    if (!searchTags || searchTags.length === 0) throw new Error("Failed to optimize search tags.");
    if (!pricingSuggestionResult) throw new Error("Failed to suggest package pricing.");

    // Step 5: Generate Detailed Pricing Packages (Depends on Keyword, Title, Category, and Suggested Prices)
    const detailedPricingPromise = generatePackageDetails({
      mainKeyword,
      gigTitle,
      category,
      subcategory,
      basePrice: pricingSuggestionResult.basic,
      standardPrice: pricingSuggestionResult.standard,
      premiumPrice: pricingSuggestionResult.premium,
    });

    // Step 6: Generate Gig Image (Depends on Keyword, Title, Category) - Can run in parallel with some others
    const imagePromise = generateGigImage({ mainKeyword, gigTitle, category, subcategory });
    
    // Await detailed pricing as it's needed for description
    const detailedPricingResult = await detailedPricingPromise;
    if (!detailedPricingResult) throw new Error("Failed to generate detailed pricing.");

    // Step 7: Generate Gig Description & FAQs 
    // (Depends on Keyword, Title, Category, Packages, and Simulated Insights)
    const simulatedInsights = getSimulatedTopGigInsights(mainKeyword, category, subcategory);
    const descriptionPromise = generateGigDescription({ 
      mainKeyword, 
      gigTitle,
      category,
      subcategory,
      topPerformingGigInsights: simulatedInsights,
      packageDetails: detailedPricingResult 
    });

    // Step 8: Suggest Requirements (Depends on Title, Category, Description)
    // We need the description content first.
    const descriptionResult = await descriptionPromise;
    const gigDescriptionContent = descriptionResult.gigDescription;
    const faqs = descriptionResult.faqs;
    if (!gigDescriptionContent) throw new Error("Failed to generate gig description.");
    if (!faqs || faqs.length === 0) throw new Error("Failed to generate FAQs.");

    const requirementsPromise = suggestRequirements({
      gigTitle,
      gigCategory: category,
      gigSubcategory: subcategory,
      gigDescription: gigDescriptionContent,
    });

    // Await the remaining parallel promises
    const [requirementsResult, imageResult] = await Promise.all([
        requirementsPromise,
        imagePromise
    ]);
    const requirements = requirementsResult.requirements;
    const imageDataUri = imageResult.imageDataUri; // May be undefined if generation fails
    if (!requirements || requirements.length === 0) throw new Error("Failed to suggest requirements.");
    
    return {
      title: gigTitle,
      category: category,
      subcategory: subcategory,
      searchTags: searchTags,
      pricing: detailedPricingResult, // This is GeneratePackageDetailsOutput
      description: gigDescriptionContent,
      faqs: faqs,
      requirements: requirements,
      imageDataUri: imageDataUri,
    };
  } catch (e: any) {
    console.error("Error generating full gig data:", e);
    const errorMessage = (e instanceof Error) ? e.message : 'Failed to generate gig data due to an unknown error.';
    // Specific error for image generation to guide user
    if (e.message && e.message.toLowerCase().includes("image generation failed")) {
        return { error: "Image generation failed. The AI might be unable to create an image for this specific request, or safety filters could be active. Please try a different keyword or check model capabilities." };
    }
    return { error: errorMessage };
  }
}
