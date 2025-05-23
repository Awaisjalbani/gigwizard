
// src/app/actions.ts
'use server';

import { generateGigTitle } from '@/ai/flows/generate-gig-title';
import { optimizeSearchTags } from '@/ai/flows/optimize-search-tags';
import { suggestPackagePricing } from '@/ai/flows/suggest-package-pricing';
import { generateGigDescription } from '@/ai/flows/generate-gig-description';
import { suggestRequirements } from '@/ai/flows/suggest-requirements';
import { generatePackageDetails } from '@/ai/flows/generate-package-details';
// Import types from the new central schema file
import type { GeneratePackageDetailsOutput } from '@/ai/schemas/gig-generation-schemas';


// This interface now matches the structure from generate-package-details.ts output
export interface PricingPackage {
  title: string; // Changed from name to title
  price: number;
  description: string;
  deliveryTime: string;
  revisions: string;
}

export interface GigData {
  title?: string;
  categorySuggestion?: string;
  searchTags?: string[];
  // This will now directly use the output type from the new AI flow
  pricing?: GeneratePackageDetailsOutput; // Uses the imported type
  description?: string;
  faqs?: { question: string; answer: string }[]; // Matches the updated schema
  requirements?: string[];
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
    // Initial AI calls that don't depend on each other
    const titlePromise = generateGigTitle({ mainKeyword });
    const tagsPromise = optimizeSearchTags({ mainKeyword });
    const pricingSuggestionPromise = suggestPackagePricing({ keyword: mainKeyword });
    
    const descriptionPromise = generateGigDescription({ 
      mainKeyword, 
      topGigData: `Based on analysis of top gigs for '${mainKeyword}', key features often include: comprehensive service, fast delivery, and excellent communication. Common FAQs address project scope, revisions, and delivery formats.` 
    });

    const [
      titleResult,
      tagsResult,
      pricingSuggestionResult, // This is { basic: number, standard: number, premium: number }
      descriptionResult // This is { gigDescription: string, faqs: { question: string, answer: string }[] }
    ] = await Promise.all([
      titlePromise,
      tagsPromise,
      pricingSuggestionPromise,
      descriptionPromise
    ]);

    const gigTitle = titleResult.gigTitle;
    const gigDescriptionContent = descriptionResult.gigDescription;
    
    // FAQs are now directly structured
    const formattedFaqs = descriptionResult.faqs || [];

    // Generate detailed pricing packages using the AI flow
    const detailedPricingResult = await generatePackageDetails({
      mainKeyword,
      basePrice: pricingSuggestionResult.basic,
      standardPrice: pricingSuggestionResult.standard,
      premiumPrice: pricingSuggestionResult.premium,
    });
    
    const categorySuggestion = await generateCategorySuggestion(mainKeyword);
    
    const requirementsResult = await suggestRequirements({
      gigCategory: categorySuggestion,
      gigDescription: gigDescriptionContent,
    });

    return {
      title: gigTitle,
      categorySuggestion: categorySuggestion,
      searchTags: tagsResult.searchTags,
      pricing: detailedPricingResult, // Use the result from the new AI flow
      description: gigDescriptionContent,
      faqs: formattedFaqs.length > 0 ? formattedFaqs : [{question: "What is included in this service?", answer: "This service includes comprehensive support for your project needs."}],
      requirements: requirementsResult.requirements,
    };
  } catch (e: any) {
    console.error("Error generating gig data:", e);
    const errorMessage = (e instanceof Error) ? e.message : 'Failed to generate gig data due to an unknown error.';
    return { error: errorMessage };
  }
}

