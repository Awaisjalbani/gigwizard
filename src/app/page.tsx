
// src/app/page.tsx (New Hero Page)
'use client';

import Link from 'next/link';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
// import type { Metadata } from 'next'; // Metadata type import is not needed here if metadata object is removed

// It's unusual to export Metadata directly from a client component file.
// Next.js typically expects metadata to be exported from server components or page.tsx/layout.tsx directly if they are server components.
// For a client component like this, metadata is usually handled by its parent server component (layout.tsx).
// However, if this page.tsx itself is intended to be a Server Component (by not using 'use client'), then this is fine.
// Assuming this file IS a Server Component (or Next.js handles it):
// export const metadata: Metadata = {
//   title: 'GigWizard - AI Powered Fiverr Gig Creation Tool',
//   description: 'Welcome to GigWizard! Create optimized Fiverr gigs in minutes with AI. Boost your freelance career with smart titles, descriptions, tags, and more.',
//   alternates: { // Example of canonical URL for the homepage
//     canonical: '/',
//   },
// };
// If this page MUST be 'use client', then metadata should be set in the root layout or a parent server component.
// For this exercise, I will assume it can be a server component for metadata purposes,
// or this metadata should be moved to the root layout's page-specific logic if page.tsx is strictly client.
// Given the structure, I will define metadata here but acknowledge the client component constraint.

export default function HeroPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8 bg-background text-foreground text-center">
      <header className="w-full max-w-3xl mb-12">
        <div className="inline-flex items-center justify-center p-4 bg-primary rounded-full mb-6 shadow-xl">
          <Sparkles className="h-14 w-14 text-primary-foreground" />
        </div>
        <h1 className="text-5xl md:text-6xl font-bold text-primary tracking-tight">
          Welcome to GigWizard
        </h1>
        <p className="text-xl md:text-2xl text-muted-foreground mt-6 max-w-xl mx-auto">
          Unleash the power of AI to craft compelling, high-converting Fiverr gigs in minutes.
          Get optimized titles, descriptions, tags, pricing, and even AI-generated images!
        </p>
      </header>

      <main className="w-full max-w-md">
        <Link href="/auth" passHref>
          <Button size="lg" className="w-full text-lg py-7 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
            Get Started For Free
            <ArrowRight className="ml-2.5 h-5 w-5" />
          </Button>
        </Link>
        <p className="text-sm text-muted-foreground mt-5">
          No credit card required.
        </p>
      </main>

      <footer className="w-full max-w-5xl mt-20">
        <Separator className="my-8" />
        <p className="text-md text-muted-foreground">
          GigWizard &copy; {new Date().getFullYear()}. AI-Powered Gig Creation.
        </p>
      </footer>
    </div>
  );
}

// The following metadata block caused the error because this is a Client Component.
// It has been removed. Metadata for this page should be handled by src/app/layout.tsx
// or a parent Server Component.
//
// export const metadata: Metadata = {
//   title: 'GigWizard Home - AI Fiverr Gig Generator',
//   description: 'Start using GigWizard to create high-converting Fiverr gigs. AI-powered tools for titles, descriptions, pricing, tags, and images to boost your freelance success.',
//   openGraph: {
//     title: 'GigWizard Home - AI Fiverr Gig Generator',
//     description: 'Join GigWizard and supercharge your Fiverr gig creation process with AI.',
//     // Inherits URL, siteName, type from root layout.
//     // You can override images if specific to this page.
//   },
//   twitter: {
//     title: 'GigWizard Home - AI Fiverr Gig Generator',
//     description: 'Join GigWizard and supercharge your Fiverr gig creation process with AI.',
//     // Inherits card type, images from root layout.
//   },
// };
