
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
  LogOut,
  Download,
  RefreshCw,
  PenLine, // New icon for title regeneration
  ListChecks, // Icon for features
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
import { generateFullGig, type GigData, refreshSearchTagsAction, regenerateGigImageAction, regenerateTitleAction } from '../actions'; // Adjusted path
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
  const [currentMainKeyword, setCurrentMainKeyword] = useState<string | null>(null);
  const [isRefreshingTags, setIsRefreshingTags] = useState(false);
  const [isRecreatingImage, setIsRecreatingImage] = useState(false);
  const [isRegeneratingTitle, setIsRegeneratingTitle] = useState(false);


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
    setCurrentMainKeyword(null);
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
        setCurrentMainKeyword(null);
      } else {
        setGigData(result);
        setCurrentMainKeyword(data.mainKeyword); // Store the keyword
        toast({
          title: 'Gig Generation Complete!',
          description: 'Your Fiverr gig components are ready.',
        });
      }
    } catch (error: any) {
      clearInterval(progressInterval);
      setProgress(100);
      let errorMessage = (error instanceof Error) ? error.message : 'An unexpected error occurred.';
      if (error.message && (error.message.includes("auth/unauthorized-domain") || error.message.includes("FIREBASE AUTH ERROR"))) {
        errorMessage = error.message;
      } else if (error.message && (error.message.includes("503") || error.message.includes("overloaded") || error.message.includes("service unavailable") || error.message.includes("model is overloaded"))) {
        errorMessage = "The AI service is currently overloaded or unavailable. This is a temporary issue. Please try again in a few moments. (Details: " + error.message + ")";
      }

      toast({
        variant: 'destructive',
        title: 'Generation Failed',
        description: errorMessage,
      });
      setGigData({ error: errorMessage });
      setCurrentMainKeyword(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshTags = async () => {
    if (!currentMainKeyword || !gigData || !gigData.title || !gigData.category || !gigData.subcategory) {
      toast({
        variant: 'destructive',
        title: 'Cannot Refresh Tags',
        description: 'Initial gig data is missing. Please generate a gig first.',
      });
      return;
    }

    setIsRefreshingTags(true);
    try {
      const newTagsResult = await refreshSearchTagsAction({
        mainKeyword: currentMainKeyword,
        gigTitle: gigData.title,
        category: gigData.category,
        subcategory: gigData.subcategory,
      });

      if (Array.isArray(newTagsResult)) {
        setGigData(prevData => ({ ...prevData, searchTags: newTagsResult, error: undefined }));
        toast({
          title: 'Search Tags Refreshed!',
          description: 'A new set of optimized tags has been generated.',
        });
      } else if (newTagsResult.error) {
        toast({
          variant: 'destructive',
          title: 'Error Refreshing Tags',
          description: newTagsResult.error,
        });
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to Refresh Tags',
        description: error.message || 'An unexpected error occurred.',
      });
    } finally {
      setIsRefreshingTags(false);
    }
  };

  const handleRecreateImage = async () => {
    if (!gigData || !gigData.imagePrompt) {
      toast({
        variant: 'destructive',
        title: 'Cannot Recreate Image',
        description: 'Image prompt is missing. Please generate a gig first.',
      });
      return;
    }

    setIsRecreatingImage(true);
    try {
      const result = await regenerateGigImageAction({ imagePrompt: gigData.imagePrompt });
      if (result.imageDataUri) {
        setGigData(prevData => ({ ...prevData, imageDataUri: result.imageDataUri, error: undefined }));
        toast({
          title: 'Image Recreated!',
          description: 'A new gig image has been generated.',
        });
      } else if (result.error) {
         toast({
          variant: 'destructive',
          title: 'Error Recreating Image',
          description: result.error,
        });
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to Recreate Image',
        description: error.message || 'An unexpected error occurred while recreating the image.',
      });
    } finally {
      setIsRecreatingImage(false);
    }
  };

  const handleRegenerateTitle = async () => {
    if (!currentMainKeyword || !gigData) {
      toast({
        variant: 'destructive',
        title: 'Cannot Regenerate Title',
        description: 'Main keyword or initial gig data is missing.',
      });
      return;
    }
    setIsRegeneratingTitle(true);
    try {
      const result = await regenerateTitleAction({
        mainKeyword: currentMainKeyword,
        currentTitle: gigData.title,
      });

      if (result.newGigTitle) {
        setGigData(prevData => ({ ...prevData, title: result.newGigTitle, error: undefined }));
        toast({
          title: 'Title Regenerated!',
          description: 'A new gig title has been crafted.',
        });
      } else if (result.error) {
        toast({
          variant: 'destructive',
          title: 'Error Regenerating Title',
          description: result.error,
        });
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to Regenerate Title',
        description: error.message || 'An unexpected error occurred.',
      });
    } finally {
      setIsRegeneratingTitle(false);
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
      <CardContent className="flex-grow pt-4 space-y-3">
        <div className="text-sm text-muted-foreground h-16 overflow-y-auto custom-scrollbar" dangerouslySetInnerHTML={{ __html: (pkg.description || "").replace(/\n/g, '<br/>') }} />
        
        {pkg.features && pkg.features.length > 0 && (
          <div className="mt-3 pt-3 border-t border-border/30">
            <h4 className="text-xs font-semibold text-muted-foreground mb-1.5 flex items-center">
              <ListChecks className="w-3.5 h-3.5 mr-1.5 text-primary/80" />
              Key Features:
            </h4>
            <ul className="list-none pl-0 text-xs text-muted-foreground space-y-1 custom-scrollbar max-h-24 overflow-y-auto">
              {pkg.features.map((feature, idx) => (
                <li key={idx} className="flex items-start">
                  <span className="text-primary/90 mr-1.5 mt-0.5">✔</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="text-sm space-y-1 pt-3 border-t border-border/30 mt-3">
          <div><strong>Delivery:</strong> <Badge variant="outline">{pkg.deliveryTime}</Badge></div>
          <div><strong>Revisions:</strong> <Badge variant="outline">{pkg.revisions}</Badge></div>
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

  const handleDownloadImage = () => {
    if (gigData?.imageDataUri) {
      const link = document.createElement('a');
      link.href = gigData.imageDataUri;
      const mimeType = gigData.imageDataUri.substring(gigData.imageDataUri.indexOf(':') + 1, gigData.imageDataUri.indexOf(';'));
      const extension = mimeType.split('/')[1] || 'png';
      link.download = `fiverr-ace-gig-image.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({ title: 'Image Download Started', description: `Downloading fiverr-ace-gig-image.${extension}` });
    } else {
      toast({ variant: 'destructive', title: 'Download Failed', description: 'Image data is not available.' });
    }
  };

  const formatDescription = (description: string | undefined): string => {
    if (!description) return '';
    return description
      .replace(/\\n/g, '\n') 
      .replace(/\n/g, '<br/>') 
      .replace(/^### (.*?)(<br\s*\/?>|$)/gm, '<h3>$1</h3>') 
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') 
      .replace(/__(.*?)__/g, '<strong>$1</strong>')     
      .replace(/\*(.*?)\*/g, '<em>$1</em>')       
      .replace(/_(.*?)_/g, '<em>$1</em>')         
      .replace(/^(?:✔|🏆|-)\s*(.*?)(<br\s*\/?>|$)/gm, (match, content) => {
        let bullet = '';
        if (match.startsWith('✔')) bullet = '<span class="emoji-bullet">✔</span> ';
        else if (match.startsWith('🏆')) bullet = '<span class="emoji-bullet">🏆</span> ';
        else if (match.startsWith('-')) bullet = '<span class="emoji-bullet">•</span> '; 
        return `<ul><li>${bullet}${content.trim()}</li></ul>`;
      });
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

  const anyActionLoading = isLoading || isRefreshingTags || isRecreatingImage || isRegeneratingTitle;

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
            list-style-type: none;
            margin-left: 0;
            margin-bottom: 0; 
            padding-left: 0;
        }
        .markdown-content ul li {
            padding-left: 1.5em;
            text-indent: -1.5em;
            margin-bottom: 0.65rem;
            line-height: 1.65;
            color: hsl(var(--muted-foreground));
        }
        .markdown-content ul li .emoji-bullet {
            color: hsl(var(--primary));
            font-weight: bold;
            display: inline-block; 
            margin-right: 0.3em; 
        }
        .markdown-content ul li:not(:has(.emoji-bullet))::before {
            content: "•"; 
            color: hsl(var(--primary));
            font-weight: bold;
            display: inline-block;
            width: 1.5em; 
            text-align: left; 
        }
         .markdown-content p {
            margin-bottom: 0.75rem;
            line-height: 1.65;
            color: hsl(var(--muted-foreground));
        }
        .markdown-content strong {
            color: hsl(var(--foreground));
            font-weight: 600;
        }
        .markdown-content em {
          font-style: italic;
        }
      `}</style>
      <header className="w-full max-w-5xl mb-10 p-4 rounded-lg bg-card shadow-md">
        <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
                <div className="inline-flex items-center justify-center p-2.5 bg-primary rounded-full shadow-lg">
                  <Sparkles className="h-7 w-7 text-primary-foreground" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-primary tracking-tight">Fiverr Ace</h1>
                    <p className="text-md text-muted-foreground">
                    Craft your high-converting Fiverr gig with AI precision.
                    </p>
                </div>
            </div>
            {currentUser && (
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground">{currentUser.displayName || 'User'}</p>
                  <p className="text-xs text-muted-foreground">{currentUser.email}</p>
                </div>
                <Button onClick={handleSignOut} variant="outline" size="sm" disabled={anyActionLoading}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                </Button>
              </div>
            )}
        </div>
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
              disabled={anyActionLoading}
            />
            {errors.mainKeyword && (
              <p className="text-sm text-destructive mt-1.5">{errors.mainKeyword.message}</p>
            )}
          </div>
          <Button type="submit" className="w-full text-lg py-3.5 rounded-lg shadow-md hover:shadow-lg transition-shadow" disabled={anyActionLoading}>
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
              <div className="flex items-center justify-between p-5 bg-secondary rounded-lg shadow-inner">
                <p className="text-xl font-semibold text-foreground flex-grow">{gigData.title}</p>
                <Button
                  onClick={handleRegenerateTitle}
                  variant="outline"
                  size="sm"
                  className="ml-4 flex-shrink-0"
                  disabled={isRegeneratingTitle || !currentMainKeyword || anyActionLoading}
                >
                  {isRegeneratingTitle ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <PenLine className="mr-2 h-4 w-4" />
                  )}
                  Regenerate
                </Button>
              </div>
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
              <div className="mt-6 text-center">
                <Button
                  onClick={handleRefreshTags}
                  variant="outline"
                  disabled={isRefreshingTags || !currentMainKeyword || !gigData.title || anyActionLoading}
                >
                  {isRefreshingTags ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  Refresh Tags
                </Button>
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
                <div
                    className="p-5 bg-secondary rounded-lg shadow-inner space-y-3 markdown-content custom-scrollbar max-h-[450px] overflow-y-auto text-foreground"
                    dangerouslySetInnerHTML={{ __html: formatDescription(gigData.description) }}
                />
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
                <div className="p-5 bg-secondary rounded-lg shadow-inner flex flex-col items-center space-y-4">
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
                {gigData.imageDataUri && (
                  <div className="flex space-x-3 mt-2">
                    <Button onClick={handleDownloadImage} variant="outline" className="shadow-md" disabled={anyActionLoading}>
                      <Download className="mr-2 h-4 w-4" />
                      Download Image
                    </Button>
                    <Button onClick={handleRecreateImage} variant="outline" className="shadow-md" disabled={anyActionLoading}>
                        {isRecreatingImage ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <RefreshCw className="mr-2 h-4 w-4" />
                        )}
                      Recreate Image
                    </Button>
                  </div>
                )}
                <p className="text-xs text-muted-foreground text-center max-w-md px-4">
                  Fiverr recommended size: 1280x769px. Min: 712x430px. Use this AI image as inspiration or for mockups.
                </p>
              </div>
            </GigResultSection>

            {/*
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
            */}

            <div className="text-center mt-16">
              <Button
                onClick={() => {
                    setGigData(null);
                    setProgress(0);
                    setCurrentMainKeyword(null);
                    reset({ mainKeyword: '' }); 
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                variant="outline"
                size="lg"
                className="py-3 px-8 rounded-lg shadow-md hover:shadow-lg"
                disabled={anyActionLoading}
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

    

    