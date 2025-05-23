
import { config } from 'dotenv';
config();

// Import all your flows here so Genkit can discover them
import '@/ai/flows/generate-gig-title.ts';
import '@/ai/flows/suggest-gig-category.ts'; // New category flow
import '@/ai/flows/optimize-search-tags.ts';
import '@/ai/flows/suggest-package-pricing.ts';
import '@/ai/flows/generate-package-details.ts';
import '@/ai/flows/generate-gig-description.ts';
import '@/ai/flows/suggest-requirements.ts';
import '@/ai/flows/generate-gig-image.ts';
