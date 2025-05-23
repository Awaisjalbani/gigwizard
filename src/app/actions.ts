// src/app/actions.ts
'use server';

import { generateGigTitle } from '@/ai/flows/generate-gig-title';
import { optimizeSearchTags } from '@/ai/flows/optimize-search-tags';
import { suggestPackagePricing } from '@/ai/flows/suggest-package-pricing';
import { generateGigDescription } from '@/ai/flows/generate-gig-description';
import { suggestRequirements } from '@/ai/flows/suggest-requirements';

export interface PricingPackage {
  name: string;
  price: number;
  description: string; // A brief description or key features for this package
  deliveryTime: string; // e.g., "3 days"
  revisions: string; // e.g., "Unlimited" or "2"
}

export interface GigData {
  title?: string;
  categorySuggestion?: string;
  searchTags?: string[];
  pricing?: {
    basic: PricingPackage;
    standard: PricingPackage;
    premium: PricingPackage;
  };
  description?: string;
  faqs?: { question: string; answer: string }[];
  requirements?: string[];
  error?: string;
}

// Placeholder for category suggestion. In a real app, this might be another AI call or more sophisticated logic.
const generateCategorySuggestion = async (keyword: string): Promise<string> => {
  // Simple suggestion based on keyword.
  // For example: "Programming & Tech > Web Development" if keyword is "website design"
  // This is highly dependent on the keyword and would ideally use a more robust categorization.
  if (keyword.toLowerCase().includes('logo')) return `Graphics & Design > Logo Design`;
  if (keyword.toLowerCase().match(/website|web design|develop/)) return `Programming & Tech > Website Development`;
  if (keyword.toLowerCase().match(/article|blog|write/)) return `Writing & Translation > Articles & Blog Posts`;
  if (keyword.toLowerCase().match(/video edit|animation/)) return `Video & Animation > Video Editing`;
  return `General Services > Other (Please refine based on '${keyword}')`;
};

// Placeholder for generating package details.
// In a real app, this would be more dynamic or AI-driven.
const generatePackageDetails = (basePrice: number, keyword: string): { basic: PricingPackage; standard: PricingPackage; premium: PricingPackage } => {
  const serviceType = keyword.toLowerCase();
  let basicDesc = "Basic package to get you started.";
  let stdDesc = "Standard package with more features.";
  let premDesc = "Premium package for the best results.";

  if (serviceType.includes("logo")) {
    basicDesc = "1 Basic Logo Concept";
    stdDesc = "2 Standard Logo Concepts + Source File";
    premDesc = "3 Premium Logo Concepts + Source File + Social Media Kit";
  } else if (serviceType.includes("article")) {
    basicDesc = "500 Word Article";
    stdDesc = "1000 Word Article + SEO Optimization";
    premDesc = "1500 Word Article + SEO Optimization + 2 Revisions";
  }


  return {
    basic: { name: "Basic", price: basePrice, description: basicDesc, deliveryTime: "3 Days", revisions: "1" },
    standard: { name: "Standard", price: Math.round(basePrice * 1.8), description: stdDesc, deliveryTime: "5 Days", revisions: "2" },
    premium: { name: "Premium", price: Math.round(basePrice * 3), description: premDesc, deliveryTime: "7 Days", revisions: "Unlimited" },
  };
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
    
    // Description needs topGigData - simplified for now
    const descriptionPromise = generateGigDescription({ 
      mainKeyword, 
      topGigData: `Based on analysis of top gigs for '${mainKeyword}', key features often include: comprehensive service, fast delivery, and excellent communication. Common FAQs address project scope, revisions, and delivery formats.` 
    });

    // Await initial promises
    const [
      titleResult,
      tagsResult,
      pricingSuggestionResult, // This is { basic: number, standard: number, premium: number }
      descriptionResult // This is GenerateGigDescriptionOutput { gigDescription: string, faqs: string[] }
    ] = await Promise.all([
      titlePromise,
      tagsPromise,
      pricingSuggestionPromise,
      descriptionPromise
    ]);

    const gigTitle = titleResult.gigTitle;
    const gigDescriptionContent = descriptionResult.gigDescription;
    
    // Format FAQs from string[] to { question: string, answer: string }[]
    // Assuming FAQs are in "Q: Question A: Answer" or similar format, or just a list of Q&A pairs.
    // For simplicity, let's assume FAQs from AI are just strings that need pairing up or are pre-formatted.
    // If AI returns "Q: question \n A: answer", we need to parse.
    // The AI flow for generateGigDescription returns `faqs: z.array(z.string())`. We need to interpret this.
    // Let's assume each string is a "Question: Answer" pair or needs to be split.
    // For now, we'll take pairs of strings if the array length is even, or treat each as a Q/A block.
    const formattedFaqs: { question: string; answer: string }[] = [];
    const rawFaqs = descriptionResult.faqs || [];
    for (let i = 0; i < rawFaqs.length; i++) {
      // Attempt to split by a common pattern or assume Q/A pairs
      const parts = rawFaqs[i].split(/A:|Answer:/i);
      if (parts.length > 1) {
        formattedFaqs.push({ question: parts[0].replace(/Q:|Question:/i, '').trim(), answer: parts.slice(1).join('A:').trim() });
      } else {
        // If no clear split, and we have pairs, assume Q, A, Q, A...
        if (i + 1 < rawFaqs.length && rawFaqs.length % 2 === 0) {
          formattedFaqs.push({ question: rawFaqs[i], answer: rawFaqs[i+1] });
          i++; // skip next item as it's used as answer
        } else {
          // Fallback: treat as a single block or a question with no answer
          formattedFaqs.push({ question: rawFaqs[i], answer: "Details to be provided." });
        }
      }
    }


    // Generate detailed pricing packages using the suggested base price
    const detailedPricing = generatePackageDetails(pricingSuggestionResult.basic, mainKeyword);
    
    // Suggest category
    const categorySuggestion = await generateCategorySuggestion(mainKeyword);
    
    // Requirements depend on category and description
    const requirementsResult = await suggestRequirements({
      gigCategory: categorySuggestion, // Using the generated suggestion
      gigDescription: gigDescriptionContent,
    });

    return {
      title: gigTitle,
      categorySuggestion: categorySuggestion,
      searchTags: tagsResult.searchTags,
      pricing: detailedPricing,
      description: gigDescriptionContent,
      faqs: formattedFaqs.length > 0 ? formattedFaqs : [{question: "What is included in the gig?", answer: "This gig includes..."}], // Ensure FAQs is not empty
      requirements: requirementsResult.requirements,
    };
  } catch (e: any) {
    console.error("Error generating gig data:", e);
    // Check if e is an error object with a message property
    const errorMessage = (e instanceof Error) ? e.message : 'Failed to generate gig data due to an unknown error.';
    return { error: errorMessage };
  }
}
