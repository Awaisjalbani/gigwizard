
import { config } from 'dotenv';
config();

import '@/ai/flows/optimize-search-tags.ts';
import '@/ai/flows/suggest-requirements.ts';
import '@/ai/flows/generate-gig-description.ts';
import '@/ai/flows/suggest-package-pricing.ts';
import '@/ai/flows/generate-gig-title.ts';
import '@/ai/flows/generate-package-details.ts'; // Added new flow
