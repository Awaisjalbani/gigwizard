// src/app/page.tsx (New Hero Page)
'use client';

import Link from 'next/link';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

export default function HeroPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8 bg-background text-foreground text-center">
      <header className="w-full max-w-3xl mb-12">
        <div className="inline-flex items-center justify-center p-4 bg-primary rounded-full mb-6 shadow-xl">
          <Sparkles className="h-14 w-14 text-primary-foreground" />
        </div>
        <h1 className="text-5xl md:text-6xl font-bold text-primary tracking-tight">
          Welcome to Fiverr Ace
        </h1>
        <p className="text-xl md:text-2xl text-muted-foreground mt-6 max-w-xl mx-auto">
          Unleash the power of AI to craft compelling, high-converting Fiverr gigs in minutes.
          Get optimized titles, descriptions, tags, pricing, and even AI-generated images!
        </p>
      </header>

      <main className="w-full max-w-md">
        <Link href="/auth" passHref>
          <Button size="lg" className="w-full text-lg py-7 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
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
          Fiverr Ace &copy; {new Date().getFullYear()}. AI-Powered Gig Creation.
        </p>
      </footer>
    </div>
  );
}
