
'use client';

import { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Image from 'next/image';
import {
  AlertTriangle,
  ArrowRight,
  BarChart3, // For search volume/competition
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
  TrendingUp, // For opportunity/competition
  BookCopy // For subcategory
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
import { generateFullGig, type GigData } from './actions';
import type { SinglePackageDetail, SearchTagAnalytics } from '@/ai/schemas/gig-generation-schemas';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  mainKeyword: z.string().min(3, { message: 'Keyword must be at least 3 characters long.' }),
});
type FormData = z.infer<typeof formSchema>;

export default function FiverrAcePage() {
  const [gigData, setGigData] = useState<GigData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    setIsLoading(true);
    setGigData(null);
    setProgress(0);
    
    const totalSteps = 8; // Approximate number of steps in generateFullGig
    let completedSteps = 0;

    const progressInterval = setInterval(() => {
      // Simulate progress based on an estimate of how many calls are made in generateFullGig
      // This is a rough estimation. A more accurate way would be to get progress from the server action.
       setProgress((prev) => {
        if (prev >= 95 && !gigData) { 
          return 95; // Hold at 95% if still loading
        }
        if (prev >= 100) {
            clearInterval(progressInterval);
            return 100;
        }
        // Make progress slower if not much is happening
        const increment = gigData ? 10 : (prev < 30 ? 5 : (prev < 70 ? 2 : 1));
        return Math.min(prev + increment, 99); 
      });
    }, 300); // Adjusted interval for smoother perceived progress

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
    if (level === 'High') return 'default'; // Primary color for high
    if (level === 'Medium') return 'secondary'; // Accent or secondary
    if (level === 'Low') return 'destructive'; // Muted or gray for low
    return 'outline';
  };
  
  const getCompetitionBadgeVariant = (level?: 'High' | 'Medium' | 'Low'): 'destructive' | 'secondary' | 'default' => {
    if (level === 'High') return 'destructive'; // Red for high competition (bad)
    if (level === 'Medium') return 'secondary';   // Yellow/Orange for medium
    if (level === 'Low') return 'default';    // Green for low competition (good)
    return 'outline';
  };


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
      <header className="w-full max-w-5xl mb-10 text-center">
        <div className="inline-flex items-center justify-center p-3.5 bg-primary rounded-full mb-5 shadow-xl">
          <Sparkles className="h-12 w-12 text-primary-foreground" />
        </div>
        <h1 className="text-5xl font-bold text-primary tracking-tight">Fiverr Ace</h1>
        <p className="text-xl text-muted-foreground mt-3">
          Craft your high-converting Fiverr gig with AI precision.
        </p>
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
            <p className="text-md text-center text-muted-foreground">AI is crafting your gig masterpiece. This includes research, content generation, and image creation – sit tight!</p>
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
                {gigData.description?.split('\n').map((paragraph, index) => {
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
                    // Manually reset the form if you need to clear the input field
                    // This requires access to the reset function from react-hook-form
                    // e.g., if you get `reset` from `useForm()`: reset({ mainKeyword: '' });
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
