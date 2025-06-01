
import type {Metadata} from 'next';
import {Geist, Geist_Mono} from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

// !!! ACTION REQUIRED: Replace placeholder URLs and image paths below with your actual deployed domain and assets !!!
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://your-gigwizard-domain.com'; // Define your site URL, preferably via an env variable

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl), // Important for resolving relative image paths
  title: {
    template: '%s | GigWizard',
    default: 'GigWizard - AI-Powered Fiverr Gig Creator',
  },
  description: 'Craft compelling, high-converting Fiverr gigs in minutes with GigWizard. Get AI-optimized titles, descriptions, tags, pricing, and images to boost your freelance success.',
  applicationName: 'GigWizard',
  referrer: 'origin-when-cross-origin',
  keywords: ['Fiverr gig creator', 'AI gig generator', 'Fiverr SEO', 'gig optimization', 'freelance tools', 'AI writing assistant', 'Fiverr success'],
  authors: [{ name: 'GigWizard Team' }], // Optional: Add your team/name
  // creator: 'Your Name or Company', // Optional
  // publisher: 'Your Name or Company', // Optional
  
  openGraph: {
    title: 'GigWizard - AI-Powered Fiverr Gig Creator',
    description: 'Boost your Fiverr sales with AI-generated gig content. Fast, easy, and effective for freelancers.',
    url: siteUrl,
    siteName: 'GigWizard',
    images: [
      {
        url: `${siteUrl}/og-image.png`, // Replace with your actual OG image URL
        width: 1200,
        height: 630,
        alt: 'GigWizard - AI Tool for Fiverr Gigs',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GigWizard - AI-Powered Fiverr Gig Creator & Optimizer',
    description: 'Craft compelling, high-converting Fiverr gigs in minutes with GigWizard. Optimize your freelance offerings with AI.',
    // siteId: 'YourTwitterSiteID', // Optional: Your Twitter numeric ID
    // creator: '@YourTwitterHandle', // Optional
    // creatorId: 'YourTwitterCreatorID', // Optional
    images: [`${siteUrl}/twitter-image.png`], // Replace with your actual Twitter image URL
  },
  robots: {
    index: true,
    follow: true,
    nocache: false, // Change to true if content is highly dynamic and shouldn't be cached by bots
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false, // Allow Google to index images
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico', // Ensure favicon.ico is in /public
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png', // Ensure apple-touch-icon.png is in /public
    // other: [
    //   { rel: 'android-chrome-192x192', url: '/android-chrome-192x192.png' }, // Example for PWA
    //   { rel: 'android-chrome-512x512', url: '/android-chrome-512x512.png' }, // Example for PWA
    // ],
  },
  // manifest: `${siteUrl}/site.webmanifest`, // If you have a PWA manifest
  // verification: { // Optional: for Google Search Console, Bing, etc.
  //   google: 'your-google-site-verification-code',
  //   yandex: 'your-yandex-verification-code',
  //   other: {
  //     me: ['your-email@example.com', 'your-link'],
  //   },
  // },
  // appleWebApp: { // Optional: for iOS web app capabilities
  //   title: 'GigWizard',
  //   statusBarStyle: 'default', // or 'black-translucent'
  //   capable: true,
  // },
  // formatDetection: { // Optional
  //   telephone: false,
  // },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
