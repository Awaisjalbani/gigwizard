
// src/app/actions.ts
'use server';

import { generateGigTitle } from '@/ai/flows/generate-gig-title';
import { optimizeSearchTags } from '@/ai/flows/optimize-search-tags';
import { suggestPackagePricing } from '@/ai/flows/suggest-package-pricing';
import { generateGigDescription } from '@/ai/flows/generate-gig-description';
import { suggestRequirements } from '@/ai/flows/suggest-requirements';
import { generatePackageDetails } from '@/ai/flows/generate-package-details';
import { generateGigImage } from '@/ai/flows/generate-gig-image'; // New import
// Import types from the new central schema file
import type { GeneratePackageDetailsOutput } from '@/ai/schemas/gig-generation-schemas';


// This interface now matches the structure from generate-package-details.ts output
export interface PricingPackage {
  title: string; 
  price: number;
  description: string;
  deliveryTime: string;
  revisions: string;
}

export interface GigData {
  title?: string;
  categorySuggestion?: string;
  searchTags?: string[];
  pricing?: GeneratePackageDetailsOutput; 
  description?: string;
  faqs?: { question: string; answer: string }[];
  requirements?: string[];
  imageDataUri?: string; // New field for AI generated image
  error?: string;
}

// Placeholder for category suggestion. In a real app, this might be another AI call or more sophisticated logic.
const generateCategorySuggestion = async (keyword: string): Promise<string> => {
  if (keyword.toLowerCase().includes('logo')) return `Graphics & Design > Logo Design`;
  if (keyword.toLowerCase().match(/website|web design|develop/)) return `Programming & Tech > Website Development`;
  if (keyword.toLowerCase().match(/article|blog|write/)) return `Writing & Translation > Articles & Blog Posts`;
  if (keyword.toLowerCase().match(/video edit|animation/)) return `Video & Animation > Video Editing`;
  if (keyword.toLowerCase().includes('shopify')) return `eCommerce Development > Shopify`;
  return `General Services > Other (Please refine based on '${keyword}')`;
};


export async function generateFullGig(mainKeyword: string): Promise<GigData> {
  if (!mainKeyword || mainKeyword.trim() === '') {
    return { error: 'Main keyword cannot be empty.' };
  }

  try {
    // Initial AI calls that can run in parallel
    const titlePromise = generateGigTitle({ mainKeyword });
    const tagsPromise = optimizeSearchTags({ mainKeyword });
    const pricingSuggestionPromise = suggestPackagePricing({ keyword: mainKeyword });
    
    // Description and FAQs (FAQs are part of description output)
    const descriptionPromise = generateGigDescription({ 
      mainKeyword, 
      topGigData: `Based on analysis of top gigs for '${mainKeyword}', key features often include: comprehensive service, fast delivery, and excellent communication. Common FAQs address project scope, revisions, and delivery formats.` 
    });

    const [
      titleResult,
      tagsResult,
      pricingSuggestionResult, 
      descriptionResult 
    ] = await Promise.all([
      titlePromise,
      tagsPromise,
      pricingSuggestionPromise,
      descriptionPromise
    ]);

    const gigTitle = titleResult.gigTitle;
    const gigDescriptionContent = descriptionResult.gigDescription;
    const formattedFaqs = descriptionResult.faqs || [];

    // Dependent AI calls
    // Detailed pricing packages using the pricing suggestions
    const detailedPricingPromise = generatePackageDetails({
      mainKeyword,
      basePrice: pricingSuggestionResult.basic,
      standardPrice: pricingSuggestionResult.standard,
      premiumPrice: pricingSuggestionResult.premium,
    });
    
    // Category suggestion (can be improved with AI later)
    const categorySuggestion = await generateCategorySuggestion(mainKeyword);
    
    // Requirements based on category and description
    const requirementsPromise = suggestRequirements({
      gigCategory: categorySuggestion,
      gigDescription: gigDescriptionContent,
    });

    // Image generation based on title and keyword
    const imagePromise = generateGigImage({ mainKeyword, gigTitle });

    const [
        detailedPricingResult,
        requirementsResult,
        imageResult
    ] = await Promise.all([
        detailedPricingPromise,
        requirementsPromise,
        imagePromise
    ]);
    
    return {
      title: gigTitle,
      categorySuggestion: categorySuggestion,
      searchTags: tagsResult.searchTags,
      pricing: detailedPricingResult,
      description: gigDescriptionContent,
      faqs: formattedFaqs.length > 0 ? formattedFaqs : [{question: "What is included in this service?", answer: "This service includes comprehensive support for your project needs."}],
      requirements: requirementsResult.requirements,
      imageDataUri: imageResult.imageDataUri, // Add generated image
    };
  } catch (e: any) {
    console.error("Error generating gig data:", e);
    const errorMessage = (e instanceof Error) ? e.message : 'Failed to generate gig data due to an unknown error.';
    return { error: errorMessage };
  }
}
