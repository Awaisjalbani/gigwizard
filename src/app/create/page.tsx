// src/app/create/page.tsx (Old src/app/page.tsx, now for authenticated users)
'use client';

import { useState, useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { getAuth, onAuthStateChanged, type User } from 'firebase/auth';
import { app as firebaseApp } from '@/lib/firebase'; // Ensure firebase is initialized

import {
  AlertTriangle,
  ArrowRight,
  BarChart3, 
  BadgeDollarSign,
  CheckSquare,
  FileText,
  FolderKanban,
  HelpCircle,
  ImageIcon,
  KeyRound,
  LayersIcon, 
  Lightbulb,
  Loader2,
  MessageSquareText,
  Sparkles,
  TagsIcon,
  TrendingUp, 
  BookCopy,
  LogOut
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { GigResultSection } from '@/components/fiverr-ace/GigResultSection';
import { generateFullGig, type GigData } from '../actions'; // Adjusted path
import type { SinglePackageDetail, SearchTagAnalytics } from '@/ai/schemas/gig-generation-schemas';
import { useToast } from '@/hooks/use-toast';
import { signOut } from '@/lib/firebase';


const formSchema = z.object({
  mainKeyword: z.string().min(3, { message: 'Keyword must be at least 3 characters long.' }),
});
type FormData = z.infer<typeof formSchema>;

export default function CreateGigPage() {
  const [gigData, setGigData] = useState<GigData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth(firebaseApp);
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
      } else {
        setCurrentUser(null);
        toast({
          title: "Not Authenticated",
          description: "Redirecting to sign-in page...",
          variant: "destructive"
        })
        router.push('/auth'); // Redirect if not authenticated
      }
      setAuthLoading(false);
    });
    return () => unsubscribe(); // Cleanup subscription
  }, [router, toast]);


  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    if (!currentUser) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to create a gig.",
        variant: "destructive",
      });
      router.push('/auth');
      return;
    }

    setIsLoading(true);
    setGigData(null);
    setProgress(0);
    
    const progressInterval = setInterval(() => {
       setProgress((prev) => {
        if (prev >= 95 && !gigData) { 
          return 95; 
        }
        if (prev >= 100) {
            clearInterval(progressInterval);
            return 100;
        }
        const increment = gigData ? 10 : (prev < 30 ? 5 : (prev < 70 ? 2 : 1));
        return Math.min(prev + increment, 99); 
      });
    }, 300);

    try {
      const result = await generateFullGig(data.mainKeyword);
      clearInterval(progressInterval); 
      setProgress(100);

      if (result.error) {
        toast({
          variant: 'destructive',
          title: 'Error Generating Gig',
          description: result.error,
        });
        setGigData({ error: result.error });
      } else {
        setGigData(result);
        toast({
          title: 'Gig Generation Complete!',
          description: 'Your Fiverr gig components are ready.',
        });
      }
    } catch (error: any) {
      clearInterval(progressInterval);
      setProgress(100); 
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
      toast({
        variant: 'destructive',
        title: 'Generation Failed',
        description: errorMessage,
      });
      setGigData({ error: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };
  
  const renderPricingPackage = (pkg: SinglePackageDetail, tierName: string) => ( 
    <Card key={pkg.title || tierName} className="flex flex-col shadow-md hover:shadow-lg transition-shadow duration-300 bg-card">
      <CardHeader className="bg-secondary rounded-t-lg p-4">
        <CardTitle className="text-lg font-semibold text-primary">
            {tierName} – ${pkg.price}
        </CardTitle>
        <CardDescription className="text-sm text-foreground pt-1">{pkg.title}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow pt-4 space-y-2">
        <p className="text-sm text-muted-foreground h-24 overflow-y-auto custom-scrollbar">{pkg.description}</p>
        <div className="text-sm space-y-1 pt-2">
          <p><strong>Delivery:</strong> <Badge variant="outline">{pkg.deliveryTime}</Badge></p>
          <p><strong>Revisions:</strong> <Badge variant="outline">{pkg.revisions}</Badge></p>
        </div>
      </CardContent>
    </Card>
  );

  const getAnalyticsBadgeVariant = (level?: 'High' | 'Medium' | 'Low'): 'default' | 'secondary' | 'destructive' => {
    if (level === 'High') return 'default'; 
    if (level === 'Medium') return 'secondary'; 
    if (level === 'Low') return 'destructive'; 
    return 'outline';
  };
  
  const getCompetitionBadgeVariant = (level?: 'High' | 'Medium' | 'Low'): 'destructive' | 'secondary' | 'default' => {
    if (level === 'High') return 'destructive'; 
    if (level === 'Medium') return 'secondary';   
    if (level === 'Low') return 'default';    
    return 'outline';
  };

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      await signOut();
      toast({ title: "Signed Out", description: "You have been successfully signed out." });
      setCurrentUser(null);
      router.push('/auth');
    } catch (error) {
      toast({ title: "Sign Out Failed", description: "Could not sign out. Please try again.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Authenticating...</p>
      </div>
    );
  }

  if (!currentUser) {
    // This case should ideally be handled by the redirect in useEffect,
    // but it's a fallback.
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <p className="mt-4 text-lg text-foreground">Access Denied</p>
        <p className="text-muted-foreground">Please sign in to create a gig.</p>
        <Button onClick={() => router.push('/auth')} className="mt-6">
          Go to Sign In
        </Button>
      </div>
    );
  }


  return (
    <div className="min-h-screen flex flex-col items-center p-4 md:p-8 bg-background text-foreground">
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: hsl(var(--secondary)); 
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: hsl(var(--primary) / 0.6); 
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: hsl(var(--primary)); 
        }
        .markdown-content h3 {
            font-size: 1.2rem; /* text-lg */
            font-weight: 600; /* font-semibold */
            margin-top: 1.25rem; /* mt-5 */
            margin-bottom: 0.75rem; /* mb-3 */
            color: hsl(var(--primary)); 
            border-bottom: 1px solid hsl(var(--accent) / 0.7);
            padding-bottom: 0.3rem;
        }
        .markdown-content ul {
            list-style-type: disc;
            margin-left: 1.25rem; /* ml-5 */
            margin-bottom: 1rem; /* mb-4 */
            padding-left: 0.5rem;
        }
         .markdown-content p {
            margin-bottom: 0.75rem; /* mb-3 */
            line-height: 1.65;
        }
        .markdown-content strong {
            color: hsl(var(--foreground));
            font-weight: 600;
        }
      `}</style>
      <header className="w-full max-w-5xl mb-10">
        <div className="flex justify-between items-center">
            <div className="flex items-center">
                <div className="inline-flex items-center justify-center p-2.5 bg-primary rounded-full mr-3 shadow-lg">
                <Sparkles className="h-8 w-8 text-primary-foreground" />
                </div>
                <div>
                    <h1 className="text-4xl font-bold text-primary tracking-tight">Fiverr Ace</h1>
                    <p className="text-lg text-muted-foreground">
                    Craft your high-converting Fiverr gig with AI precision.
                    </p>
                </div>
            </div>
            {currentUser && (
            <Button onClick={handleSignOut} variant="outline" size="sm" disabled={isLoading}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
            </Button>
            )}
        </div>
         {currentUser && (
            <p className="text-sm text-muted-foreground mt-2 text-left">
                Signed in as: {currentUser.displayName || currentUser.email}
            </p>
        )}
      </header>

      <main className="w-full max-w-5xl bg-card p-6 sm:p-10 rounded-2xl shadow-2xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <div>
            <Label htmlFor="mainKeyword" className="text-lg font-semibold flex items-center mb-2.5 text-foreground">
              <KeyRound className="mr-2.5 h-5 w-5 text-primary" />
              Enter Your Main Gig Keyword
            </Label>
            <Input
              id="mainKeyword"
              type="text"
              placeholder="e.g., modern logo design, shopify store setup, react developer"
              className="text-base py-3 px-4 focus:border-primary focus:ring-primary"
              {...register('mainKeyword')}
              disabled={isLoading}
            />
            {errors.mainKeyword && (
              <p className="text-sm text-destructive mt-1.5">{errors.mainKeyword.message}</p>
            )}
          </div>
          <Button type="submit" className="w-full text-lg py-3.5 rounded-lg shadow-md hover:shadow-lg transition-shadow" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2.5 h-5 w-5 animate-spin" />
                Generating Your Gig...
              </>
            ) : (
              <>
                <Sparkles className="mr-2.5 h-5 w-5" />
                Create My Gig!
              </>
            )}
          </Button>
        </form>

        {isLoading && (
          <div className="mt-10 space-y-3">
            <Progress value={progress} className="w-full h-3" />
            <p className="text-md text-center text-muted-foreground">AI is crafting your gig masterpiece. Sit tight!</p>
          </div>
        )}

        {gigData?.error && !isLoading && (
           <Alert variant="destructive" className="mt-10 p-5">
             <AlertTriangle className="h-5 w-5" />
             <AlertTitle className="text-lg">Generation Error</AlertTitle>
             <AlertDescription className="text-base">{gigData.error}</AlertDescription>
           </Alert>
        )}

        {gigData && !gigData.error && !isLoading && (
          <div className="mt-12 space-y-10">
            <GigResultSection title="Optimized Gig Title" icon={Lightbulb}>
              <p className="text-xl font-semibold p-5 bg-secondary rounded-lg shadow-inner text-foreground">{gigData.title}</p>
            </GigResultSection>

            <div className="grid md:grid-cols-2 gap-8">
              <GigResultSection title="Suggested Category" icon={FolderKanban}>
                <p className="p-5 bg-secondary rounded-lg shadow-inner text-foreground">{gigData.category}</p>
              </GigResultSection>
              <GigResultSection title="Suggested Subcategory" icon={BookCopy}>
                <p className="p-5 bg-secondary rounded-lg shadow-inner text-foreground">{gigData.subcategory}</p>
              </GigResultSection>
            </div>

            <GigResultSection title="Strategic Search Tags & Analytics" icon={TagsIcon}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-1">
                {gigData.searchTags?.map((tag) => (
                  <Card key={tag.term} className="bg-secondary shadow-inner">
                    <CardContent className="p-4 space-y-2">
                      <Badge variant="default" className="text-md px-3 py-1.5 bg-primary text-primary-foreground hover:bg-primary/90 block w-full text-center truncate mb-2">
                        {tag.term}
                      </Badge>
                      <div className="text-xs text-muted-foreground space-y-1">
                        {tag.volume && (
                          <div className="flex items-center justify-between">
                            <span className="flex items-center"><BarChart3 className="w-3.5 h-3.5 mr-1.5 text-primary/80" /> Volume:</span>
                            <Badge variant={getAnalyticsBadgeVariant(tag.volume)} className="px-2 py-0.5">{tag.volume}</Badge>
                          </div>
                        )}
                        {tag.competition && (
                          <div className="flex items-center justify-between">
                            <span className="flex items-center"><TrendingUp className="w-3.5 h-3.5 mr-1.5 text-primary/80" /> Competition:</span>
                            <Badge variant={getCompetitionBadgeVariant(tag.competition)} className="px-2 py-0.5">{tag.competition}</Badge>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </GigResultSection>
            
            <GigResultSection title="High-Converting Pricing Packages" icon={BadgeDollarSign}>
              <div className="grid md:grid-cols-1 lg:grid-cols-3 gap-6 mt-2">
                {gigData.pricing?.basic && renderPricingPackage(gigData.pricing.basic, "Basic")}
                {gigData.pricing?.standard && renderPricingPackage(gigData.pricing.standard, "Standard")}
                {gigData.pricing?.premium && renderPricingPackage(gigData.pricing.premium, "Premium")}
              </div>
            </GigResultSection>

            <GigResultSection title="Compelling Gig Description" icon={FileText}>
              <div className="p-5 bg-secondary rounded-lg shadow-inner space-y-3 markdown-content custom-scrollbar max-h-[450px] overflow-y-auto text-foreground">
                {gigData.description?.split('\\n').map((paragraph, index) => {
                  if (paragraph.startsWith('### ')) {
                    return <h3 key={index}>{paragraph.substring(4)}</h3>;
                  }
                  if (paragraph.startsWith('- ')) {
                     return <ul key={index} className="list-disc list-inside ml-0"><li className="text-muted-foreground">{paragraph.substring(2)}</li></ul>;
                  }
                  if (paragraph.startsWith('✔ ')) {
                     return <p key={index} className="flex items-center text-muted-foreground"><CheckSquare className="w-4 h-4 mr-2 text-green-500 flex-shrink-0" />{paragraph.substring(2)}</p>;
                  }
                  return <p key={index} className="text-muted-foreground">{paragraph}</p>;
                })}
              </div>
            </GigResultSection>

            <GigResultSection title="Frequently Asked Questions (FAQs)" icon={HelpCircle}>
              <Accordion type="single" collapsible className="w-full space-y-3">
                {gigData.faqs?.map((faq, index) => (
                  <AccordionItem key={index} value={`item-${index}`} className="bg-secondary rounded-lg shadow-inner border-border overflow-hidden">
                    <AccordionTrigger className="text-left hover:no-underline px-5 py-3.5 font-medium text-foreground">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="px-5 pb-4 pt-1 text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </GigResultSection>

            <GigResultSection title="Essential Client Requirements" icon={CheckSquare}>
              <ul className="list-disc list-inside space-y-2.5 p-5 bg-secondary rounded-lg shadow-inner text-muted-foreground">
                {gigData.requirements?.map((req, index) => (
                  <li key={index}>{req}</li>
                ))}
              </ul>
            </GigResultSection>

            <GigResultSection title="AI Generated Gig Image" icon={ImageIcon}>
                <div className="p-5 bg-secondary rounded-lg shadow-inner flex flex-col items-center">
                {gigData.imageDataUri ? (
                  <Image
                    src={gigData.imageDataUri}
                    alt="AI Generated Gig Image"
                    width={600} 
                    height={400} 
                    className="rounded-lg border-2 border-border shadow-lg object-cover"
                    data-ai-hint="professional service relevant"
                  />
                ) : (
                  <div 
                    className="w-full max-w-[600px] aspect-[3/2] bg-muted rounded-lg flex items-center justify-center border-2 border-border shadow-md" 
                    data-ai-hint="placeholder service"
                  >
                    <ImageIcon className="w-16 h-16 text-muted-foreground/50" />
                    <p className="ml-3 text-muted-foreground">Image loading or not available...</p>
                  </div>
                )}
                <p className="text-sm text-muted-foreground mt-5 text-center max-w-md">
                  This image was AI-generated. Fiverr recommends 1280x769px. Use this as inspiration or for quick mockups.
                </p>
              </div>
            </GigResultSection>

            {gigData.imagePrompt && (
              <GigResultSection title="Generated Image Prompt (for AI)" icon={MessageSquareText}>
                <Textarea
                  value={gigData.imagePrompt}
                  readOnly
                  className="min-h-[120px] text-sm bg-secondary rounded-lg shadow-inner p-4 focus-visible:ring-primary custom-scrollbar"
                  aria-label="Generated Image Prompt"
                />
              </GigResultSection>
            )}
            
            <div className="text-center mt-16">
              <Button 
                onClick={() => {
                    setGigData(null); 
                    setProgress(0);
                    reset({ mainKeyword: '' }); // Reset the form input
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                variant="outline"
                size="lg"
                className="py-3 px-8 rounded-lg shadow-md hover:shadow-lg"
              >
                <ArrowRight className="mr-2.5 h-5 w-5 transform rotate-[270deg]" />
                Create Another Gig
              </Button>
            </div>
          </div>
        )}
      </main>
      <footer className="w-full max-w-5xl mt-16 text-center">
        <Separator className="my-6" />
        <p className="text-md text-muted-foreground">
          Fiverr Ace &copy; {new Date().getFullYear()}. AI-Powered Gig Creation.
        </p>
      </footer>
    </div>
  );
}
