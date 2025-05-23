
'use client';

import { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Image from 'next/image';
import {
  AlertTriangle,
  ArrowRight,
  BadgeDollarSign,
  CheckSquare,
  FileText,
  FolderKanban,
  HelpCircle,
  ImageIcon,
  KeyRound,
  Lightbulb,
  Loader2,
  Sparkles,
  TagsIcon,
  LayersIcon, // For subcategory
  MessageSquareText // For image prompt
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
import type { SinglePackageDetail } from '@/ai/schemas/gig-generation-schemas';
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
    
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95 && !gigData) { 
          return 95;
        }
        if (prev >= 100) {
            clearInterval(progressInterval);
            return 100;
        }
        return prev + 1 > 95 && !gigData ? 95 : prev + 1; 
      });
    }, 250); 

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
    <Card key={pkg.title || tierName} className="flex flex-col shadow-md hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="bg-secondary rounded-t-lg">
        <CardTitle className="text-lg font-semibold text-primary">
            {tierName} – ${pkg.price}: <span className="text-base font-normal text-foreground">{pkg.title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow pt-4 space-y-2">
        <p className="text-sm text-muted-foreground h-20 overflow-y-auto custom-scrollbar">{pkg.description}</p>
        <div className="text-sm">
          <p><strong>Delivery:</strong> {pkg.deliveryTime}</p>
          <p><strong>Revisions:</strong> {pkg.revisions}</p>
        </div>
      </CardContent>
    </Card>
  );


  return (
    <div className="min-h-screen flex flex-col items-center p-4 md:p-8 bg-background">
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: hsl(var(--secondary)); 
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: hsl(var(--primary) / 0.7); 
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: hsl(var(--primary)); 
        }
        /* For markdown h3 */
        .markdown-content h3 {
            font-size: 1.25rem; /* text-xl */
            font-weight: 600; /* font-semibold */
            margin-top: 1rem; /* mt-4 */
            margin-bottom: 0.5rem; /* mb-2 */
            color: hsl(var(--primary)); /* text-primary */
            border-bottom: 2px solid hsl(var(--accent));
            padding-bottom: 0.25rem;
        }
        .markdown-content ul {
            list-style-type: disc;
            margin-left: 1.5rem; /* ml-6 */
            margin-bottom: 1rem; /* mb-4 */
        }
         .markdown-content p {
            margin-bottom: 0.75rem; /* mb-3 */
            line-height: 1.6;
        }
      `}</style>
      <header className="w-full max-w-4xl mb-8 text-center">
        <div className="inline-flex items-center justify-center p-3 bg-primary rounded-full mb-4 shadow-lg">
          <Sparkles className="h-10 w-10 text-primary-foreground" />
        </div>
        <h1 className="text-4xl font-bold text-primary">Fiverr Ace</h1>
        <p className="text-lg text-muted-foreground mt-2">
          Generate your perfect Fiverr gig with the power of AI.
        </p>
      </header>

      <main className="w-full max-w-4xl bg-card p-6 sm:p-8 rounded-xl shadow-2xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <Label htmlFor="mainKeyword" className="text-lg font-medium flex items-center mb-2">
              <KeyRound className="mr-2 h-5 w-5 text-primary" />
              Enter Your Main Gig Keyword
            </Label>
            <Input
              id="mainKeyword"
              type="text"
              placeholder="e.g., modern logo design, shopify store setup"
              className="text-base"
              {...register('mainKeyword')}
              disabled={isLoading}
            />
            {errors.mainKeyword && (
              <p className="text-sm text-destructive mt-1">{errors.mainKeyword.message}</p>
            )}
          </div>
          <Button type="submit" className="w-full text-lg py-3" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Generating Your Gig...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-5 w-5" />
                Create My Gig!
              </>
            )}
          </Button>
        </form>

        {isLoading && (
          <div className="mt-8 space-y-2">
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-center text-muted-foreground">AI is crafting your gig. This includes research, content generation, and image creation, which might take a moment...</p>
          </div>
        )}

        {gigData?.error && !isLoading && (
           <Alert variant="destructive" className="mt-8">
             <AlertTriangle className="h-4 w-4" />
             <AlertTitle>Generation Error</AlertTitle>
             <AlertDescription>{gigData.error}</AlertDescription>
           </Alert>
        )}

        {gigData && !gigData.error && !isLoading && (
          <div className="mt-10 space-y-8">
            <GigResultSection title="Gig Title" icon={Lightbulb}>
              <p className="text-xl font-medium p-4 bg-secondary rounded-md shadow-inner">{gigData.title}</p>
            </GigResultSection>

            <div className="grid md:grid-cols-2 gap-6">
              <GigResultSection title="Category" icon={FolderKanban}>
                <p className="p-4 bg-secondary rounded-md shadow-inner">{gigData.category}</p>
              </GigResultSection>
              <GigResultSection title="Subcategory" icon={LayersIcon}>
                <p className="p-4 bg-secondary rounded-md shadow-inner">{gigData.subcategory}</p>
              </GigResultSection>
            </div>

            <GigResultSection title="Search Tags" icon={TagsIcon}>
              <div className="flex flex-wrap gap-2 p-4 bg-secondary rounded-md shadow-inner">
                {gigData.searchTags?.map((tag) => (
                  <Badge key={tag} variant="default" className="text-sm px-3 py-1 bg-primary text-primary-foreground hover:bg-primary/90">
                    {tag}
                  </Badge>
                ))}
              </div>
            </GigResultSection>
            
            <GigResultSection title="Pricing Packages" icon={BadgeDollarSign}>
              <div className="grid md:grid-cols-3 gap-6 mt-2">
                {gigData.pricing?.basic && renderPricingPackage(gigData.pricing.basic, "Basic")}
                {gigData.pricing?.standard && renderPricingPackage(gigData.pricing.standard, "Standard")}
                {gigData.pricing?.premium && renderPricingPackage(gigData.pricing.premium, "Premium")}
              </div>
            </GigResultSection>

            <GigResultSection title="Gig Description" icon={FileText}>
              {/* Basic Markdown rendering by splitting into paragraphs. 
                  For full Markdown, a library like 'react-markdown' would be needed. */}
              <div className="p-4 bg-secondary rounded-md shadow-inner space-y-3 markdown-content custom-scrollbar max-h-[400px] overflow-y-auto">
                {gigData.description?.split('\n').map((paragraph, index) => {
                  if (paragraph.startsWith('### ')) {
                    return <h3 key={index}>{paragraph.substring(4)}</h3>;
                  }
                  if (paragraph.startsWith('- ')) {
                    // This is a simplified list item rendering.
                    // A full Markdown parser would handle nested lists and other elements better.
                    return <ul key={index} className="list-disc list-inside ml-4"><li className="text-muted-foreground">{paragraph.substring(2)}</li></ul>;
                  }
                  return <p key={index} className="text-muted-foreground">{paragraph}</p>;
                })}
              </div>
            </GigResultSection>

            <GigResultSection title="FAQs" icon={HelpCircle}>
              <Accordion type="single" collapsible className="w-full space-y-2">
                {gigData.faqs?.map((faq, index) => (
                  <AccordionItem key={index} value={`item-${index}`} className="bg-secondary rounded-md shadow-inner border-border">
                    <AccordionTrigger className="text-left hover:no-underline px-4 py-3 font-medium text-foreground">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-3 text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </GigResultSection>

            <GigResultSection title="Client Requirements" icon={CheckSquare}>
              <ul className="list-disc list-inside space-y-2 p-4 bg-secondary rounded-md shadow-inner text-muted-foreground">
                {gigData.requirements?.map((req, index) => (
                  <li key={index}>{req}</li>
                ))}
              </ul>
            </GigResultSection>

            <GigResultSection title="AI Generated Gig Image" icon={ImageIcon}>
                <div className="p-4 bg-secondary rounded-md shadow-inner flex flex-col items-center">
                {gigData.imageDataUri ? (
                  <Image
                    src={gigData.imageDataUri}
                    alt="AI Generated Gig Image"
                    width={600} 
                    height={400} // Adjusted to a common 4:3 or similar for gig images
                    className="rounded-md border border-border shadow-md object-cover"
                    data-ai-hint="professional service relevant"
                  />
                ) : (
                  <div 
                    className="w-full max-w-[600px] aspect-[3/2] bg-muted rounded-md flex items-center justify-center border border-border shadow-md" // 3:2 aspect ratio
                    data-ai-hint="placeholder service"
                  >
                    <p className="text-muted-foreground">Image loading or not available...</p>
                  </div>
                )}
                <p className="text-sm text-muted-foreground mt-4 text-center">
                  This image was AI-generated. Fiverr recommends 1280x769px. Use this as inspiration.
                </p>
              </div>
            </GigResultSection>

            {gigData.imagePrompt && (
              <GigResultSection title="Generated Image Prompt (for AI)" icon={MessageSquareText}>
                <Textarea
                  value={gigData.imagePrompt}
                  readOnly
                  className="min-h-[100px] text-sm bg-secondary rounded-md shadow-inner p-4 focus-visible:ring-accent custom-scrollbar"
                  aria-label="Generated Image Prompt"
                />
              </GigResultSection>
            )}
            
            <div className="text-center mt-12">
              <Button 
                onClick={() => {
                    setGigData(null); 
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                variant="outline"
                size="lg"
              >
                <ArrowRight className="mr-2 h-5 w-5 transform rotate-[-90deg]" />
                Back to Top & Create New
              </Button>
            </div>
          </div>
        )}
      </main>
      <footer className="w-full max-w-4xl mt-12 text-center">
        <Separator className="my-4" />
        <p className="text-sm text-muted-foreground">
          Fiverr Ace &copy; {new Date().getFullYear()}. Powered by AI.
        </p>
      </footer>
    </div>
  );
}
