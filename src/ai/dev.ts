
import { config } from 'dotenv';
config();

// Import all your flows here so Genkit can discover them
// import '@/ai/flows/generate-gig-title.ts'; // Superseded
// import '@/ai/flows/generate-gig-description.ts'; // Partially superseded, kept for FAQs
import '@/ai/flows/generate-title-description-image-prompt.ts'; // New central flow
import '@/ai/flows/suggest-gig-category.ts';
import '@/ai/flows/optimize-search-tags.ts';
import '@/ai/flows/suggest-package-pricing.ts';
import '@/ai/flows/generate-package-details.ts';
import '@/ai/flows/generate-gig-description.ts'; // Still used for FAQs
import '@/ai/flows/suggest-requirements.ts';
import '@/ai/flows/generate-gig-image.ts';
import '@/ai/flows/regenerate-gig-title.ts'; // Added for title regeneration
import '@/ai/flows/analyze-market-strategy.ts'; // Added new market analysis flow

