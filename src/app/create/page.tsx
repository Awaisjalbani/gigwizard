
// src/app/create/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm, type SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { getAuth, onAuthStateChanged, type User } from 'firebase/auth';
import { app as firebaseApp } from '@/lib/firebase';

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
  PenLine,
  ListChecks,
  Search,
  Target,
  ClipboardList,
  Users,
  Award,
  Handshake,
  Brain,
  Video,
  Clapperboard,
  Music2,
  Clock,
  Megaphone,
  Wand2,
  PlayCircle,
  Volume2,
  Mic,
  Captions,
  CheckCircle,
  X, // Ensured X is imported
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { GigResultSection } from '@/components/fiverr-ace/GigResultSection';
import { generateFullGig, type GigData, refreshSearchTagsAction, regenerateGigImageAction, regenerateTitleAction, analyzeMarketStrategyAction, generateIntroVideoAssetsAction } from '../actions';
import type { SinglePackageDetail, SearchTagAnalytics, AnalyzeMarketStrategyOutput, HypotheticalCompetitorProfile, GenerateIntroVideoAssetsOutput } from '@/ai/schemas/gig-generation-schemas';
import { useToast } from '@/hooks/use-toast';
import { signOut } from '@/lib/firebase';


const formSchema = z.object({
  mainKeyword: z.string().min(3, { message: 'Keyword must be at least 3 characters long.' }),
  userGigConcept: z.string().optional(),
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
  const [userGigConcept, setUserGigConcept] = useState<string>('');

  const [isRefreshingTags, setIsRefreshingTags] = useState(false);
  const [isRecreatingImage, setIsRecreatingImage] = useState(false);
  const [isRegeneratingTitle, setIsRegeneratingTitle] = useState(false);

  const [marketAnalysisData, setMarketAnalysisData] = useState<AnalyzeMarketStrategyOutput | null>(null);
  const [isAnalyzingMarket, setIsAnalyzingMarket] = useState(false);
  const [marketAnalysisError, setMarketAnalysisError] = useState<string | null>(null);

  const [introVideoAssets, setIntroVideoAssets] = useState<GenerateIntroVideoAssetsOutput | null>(null);
  const [isGeneratingIntroVideoAssets, setIsGeneratingIntroVideoAssets] = useState(false);
  const [introVideoAssetsError, setIntroVideoAssetsError] = useState<string | null>(null);
  const [generatedVideoSceneImages, setGeneratedVideoSceneImages] = useState<{[key: number]: string | 'loading' | null}>({});

  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [currentPreviewSceneIndex, setCurrentPreviewSceneIndex] = useState(0);
  const sceneTimerRef = useRef<NodeJS.Timeout | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const [currentSpokenText, setCurrentSpokenText] = useState<string>('');
  
  const voicesLoadedRef = useRef(false);
  const voiceLoadTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scriptSentencesRef = useRef<string[]>([]); // To store parsed sentences for captioning


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
        router.push('/auth');
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, [router, toast]);


  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
    reset,
    setValue,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        mainKeyword: "",
        userGigConcept: ""
    }
  });

  const watchedMainKeyword = watch("mainKeyword");

  const handleMarketAnalysis = async () => {
    const keyword = watchedMainKeyword;
    const concept = userGigConcept;

    if (!keyword || keyword.trim().length < 3) {
        toast({
            variant: 'destructive',
            title: 'Keyword Required',
            description: 'Please enter a main keyword (at least 3 characters) to analyze the market.',
        });
        return;
    }

    setIsAnalyzingMarket(true);
    setMarketAnalysisData(null);
    setMarketAnalysisError(null);
    setGigData(null);
    setIntroVideoAssets(null);
    setIntroVideoAssetsError(null);
    setGeneratedVideoSceneImages({});


    try {
        const result = await analyzeMarketStrategyAction({ mainKeyword: keyword, userGigConcept: concept });
        if ('error' in result) {
            setMarketAnalysisError(result.error);
            toast({
                variant: 'destructive',
                title: 'Market Analysis Failed',
                description: result.error,
            });
        } else {
            setMarketAnalysisData(result);
            toast({
                title: (
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 mr-2 text-primary" />
                    Market Analysis Complete!
                  </div>
                ),
                description: 'Strategic insights are ready for your review.',
            });
        }
    } catch (error: any) {
        const msg = error.message || 'An unexpected error occurred during market analysis.';
        setMarketAnalysisError(msg);
        toast({
            variant: 'destructive',
            title: 'Analysis Error',
            description: msg,
        });
    } finally {
        setIsAnalyzingMarket(false);
    }
  };


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
    setIntroVideoAssets(null);
    setIntroVideoAssetsError(null);
    setGeneratedVideoSceneImages({});
    setIsPreviewModalOpen(false);


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
      const result = await generateFullGig(data.mainKeyword, marketAnalysisData || undefined);
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
        setCurrentMainKeyword(data.mainKeyword);
        toast({
          title: (
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 text-primary" />
              Gig Generation Complete!
            </div>
          ),
          description: 'Your GigWizard components are ready.',
        });
      }
    } catch (error: any) {
      clearInterval(progressInterval);
      setProgress(100);
      let errorMessage = (error instanceof Error) ? error.message : 'An unexpected error occurred.';
      if (error.message && (error.message.includes("auth/unauthorized-domain") || error.message.includes("FIREBASE AUTH ERROR"))) {
        errorMessage = error.message;
      } else if (error.message && (error.message.includes("503") || error.message.includes("overloaded") || error.message.includes("service unavailable") || error.message.includes("model is overloaded") || error.message.includes("failed_precondition"))) {
        errorMessage = "The AI service is currently overloaded or unavailable. This is a temporary issue. Please try again in a few moments.";
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
        setGigData(prevData => ({ ...prevData!, searchTags: newTagsResult, error: undefined }));
        toast({
          title: (
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 text-primary" />
              Search Tags Refreshed!
            </div>
          ),
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

  const handleRecreateImage = async (imagePromptsToUse?: string[]) => {
    const prompts = imagePromptsToUse || gigData?.imagePrompts;
    if (!prompts || prompts.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Cannot Recreate Images',
        description: 'Image prompts are missing.',
      });
      return null;
    }

    setIsRecreatingImage(true);
    let generatedUris: string[] | null = null;
    try {
      const result = await regenerateGigImageAction({ imagePrompts: prompts });
      if (result.imageDataUris && result.imageDataUris.length > 0) {
        if (!imagePromptsToUse) {
            setGigData(prevData => ({ ...prevData!, imageDataUris: result.imageDataUris, error: undefined }));
        }
        toast({
          title: (
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 text-primary" />
              Images Recreated!
            </div>
          ),
          description: 'New gig images have been generated.',
        });
        generatedUris = result.imageDataUris;
      } else if (result.error) {
         toast({
          variant: 'destructive',
          title: 'Error Recreating Images',
          description: result.error,
        });
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to Recreate Images',
        description: error.message || 'An unexpected error occurred while recreating the images.',
      });
    } finally {
      setIsRecreatingImage(false);
    }
    return generatedUris;
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
        setGigData(prevData => ({ ...prevData!, title: result.newGigTitle, error: undefined }));
        toast({
          title: (
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 text-primary" />
              Title Regenerated!
            </div>
          ),
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

  const handleGenerateVideoSceneImage = async (prompt: string, sceneIndex: number, isAutoGeneration = false) => {
    setGeneratedVideoSceneImages(prev => ({...prev, [sceneIndex]: 'loading'}));
    const imageDataUris = await handleRecreateImage([prompt]);
    if (imageDataUris && imageDataUris[0]) {
        setGeneratedVideoSceneImages(prev => ({...prev, [sceneIndex]: imageDataUris[0]}));
        return imageDataUris[0];
    } else {
        setGeneratedVideoSceneImages(prev => ({...prev, [sceneIndex]: null}));
        if (!isAutoGeneration) {
          toast({
              variant: 'destructive',
              title: `Scene Image Failed (Scene ${sceneIndex + 1})`,
              description: 'Could not generate image for this scene prompt.',
          });
        }
        return null;
    }
  };

  const handleGenerateIntroVideoAssets = async () => {
    if (!gigData || !gigData.title || !gigData.description || !currentMainKeyword) {
      toast({
        variant: 'destructive',
        title: 'Cannot Generate Video Assets',
        description: 'Key gig information (title, description, keyword) is missing. Please generate the main gig first.',
      });
      return;
    }
    setIsGeneratingIntroVideoAssets(true);
    setIntroVideoAssets(null);
    setIntroVideoAssetsError(null);
    setGeneratedVideoSceneImages({});

    try {
      const result = await generateIntroVideoAssetsAction({
        mainKeyword: currentMainKeyword,
        gigTitle: gigData.title,
        gigDescription: gigData.description,
        targetAudience: marketAnalysisData?.winningApproachSummary || userGigConcept,
      });

      if ('error' in result) {
        setIntroVideoAssetsError(result.error);
        toast({
          variant: 'destructive',
          title: 'Video Assets Generation Failed',
          description: result.error,
        });
         setIsGeneratingIntroVideoAssets(false);
         return;
      } else {
        setIntroVideoAssets(result);
        setGigData(prev => ({...prev!, introVideoAssets: result}));
        
        if (result.script) { // Pre-parse script into sentences
            scriptSentencesRef.current = result.script.match(/[^.!?]+[.!?]*/g) || [result.script];
        } else {
            scriptSentencesRef.current = [];
        }

        toast({
          title: (
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 text-primary" />
              Intro Video Blueprint Generated!
            </div>
          ),
          description: 'Attempting to generate scene images automatically...',
        });

        const imageGenPromises = result.visualPrompts.map((prompt, index) =>
          handleGenerateVideoSceneImage(prompt, index, true)
        );
        const images = await Promise.allSettled(imageGenPromises);
        const allSucceeded = images.every(imgResult => imgResult.status === 'fulfilled' && imgResult.value !== null);
        const anySucceeded = images.some(imgResult => imgResult.status === 'fulfilled' && imgResult.value !== null);

        if (allSucceeded) {
          toast({
            title: (
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 mr-2 text-primary" />
                All Scene Images Generated!
              </div>
            ),
            description: 'Visuals for your video blueprint are ready.',
          });
        } else if (anySucceeded) {
           toast({
            variant: 'default',
            title: 'Some Scene Images Generated',
            description: 'Some scene images were generated, but others failed. You can try regenerating them individually.',
          });
        } else {
           toast({
            variant: 'destructive',
            title: 'Scene Image Generation Failed',
            description: 'Could not automatically generate images for the video scenes. Please try regenerating them individually.',
          });
        }
      }
    } catch (error: any) {
      const msg = error.message || 'An unexpected error occurred during video asset generation.';
      setIntroVideoAssetsError(msg);
      toast({
        variant: 'destructive',
        title: 'Video Assets Error',
        description: msg,
      });
    } finally {
      setIsGeneratingIntroVideoAssets(false);
    }
  };


  // Refs to hold the latest state for async callbacks
  const isPlayingPreviewRef = useRef(isPlayingPreview);
  const isPreviewModalOpenRef = useRef(isPreviewModalOpen);
  const currentPreviewSceneIndexRef = useRef(currentPreviewSceneIndex);

  useEffect(() => {
    isPlayingPreviewRef.current = isPlayingPreview;
  }, [isPlayingPreview]);
  useEffect(() => {
    isPreviewModalOpenRef.current = isPreviewModalOpen;
  }, [isPreviewModalOpen]);
   useEffect(() => {
    currentPreviewSceneIndexRef.current = currentPreviewSceneIndex;
  }, [currentPreviewSceneIndex]);


  const closePreviewModal = () => {
    console.log("[closePreviewModal] Called.");
    setIsPlayingPreview(false); // This will trigger the useEffect for !isPlayingPreview
    setIsPreviewModalOpen(false); // This will trigger onOpenChange for the Dialog
    // Further cleanup is handled in useEffect[!isPlayingPreview] and Dialog's onOpenChange(false)
  };

  // Animation and scene transition logic
  useEffect(() => {
    console.log(`[Animation useEffect] Triggered. isPlaying=${isPlayingPreview}, modalOpen=${isPreviewModalOpen}, sceneIndex=${currentPreviewSceneIndex}`);
    if (sceneTimerRef.current) {
        console.log("[Animation useEffect] Clearing existing scene timer.");
        clearTimeout(sceneTimerRef.current);
        sceneTimerRef.current = null;
    }

    if (isPlayingPreview && isPreviewModalOpen && introVideoAssets && introVideoAssets.visualPrompts && introVideoAssets.visualPrompts.length > 0) {
      const numScenes = introVideoAssets.visualPrompts.length;
      if (numScenes === 0) {
          console.warn("[Animation useEffect] No scenes to play. Stopping preview.");
          setIsPlayingPreview(false);
          return;
      }
      const totalDurationMs = (introVideoAssets.suggestedDurationSeconds || 20) * 1000;
      const durationPerSceneMs = Math.max(1000, totalDurationMs / numScenes);
      console.log(`[Animation useEffect] Playing scene ${currentPreviewSceneIndex + 1}/${numScenes}. Duration per scene: ${durationPerSceneMs}ms`);

      if (currentPreviewSceneIndex < numScenes - 1) {
        sceneTimerRef.current = setTimeout(() => {
          // Check refs before updating state from timeout
          if (isPlayingPreviewRef.current && isPreviewModalOpenRef.current) {
            console.log(`[Animation Timer] Advancing to scene ${currentPreviewSceneIndexRef.current + 2}`);
            setCurrentPreviewSceneIndex(prevIndex => prevIndex + 1);
          } else {
            console.log("[Animation Timer] Conditions no longer met for advancing scene (e.g., preview stopped).");
          }
        }, durationPerSceneMs);
      } else { // Last scene has played
        sceneTimerRef.current = setTimeout(() => {
          if (isPlayingPreviewRef.current && isPreviewModalOpenRef.current) {
            console.log("[Animation Timer] Last scene finished visually. Speech status:", window.speechSynthesis.speaking);
            // If speech is still going, its onend handler will eventually set isPlayingPreview to false.
            // If no speech or speech ended early, stop preview here.
            if (!window.speechSynthesis.speaking || !utteranceRef.current) {
                console.log("[Animation Timer] Speech not active or utterance cleared, stopping preview.");
                setIsPlayingPreview(false); // This will trigger the !isPlayingPreview effect for cleanup
            } else {
                 console.log("[Animation Timer] Speech still active, onend will handle stopping preview if not already handled.");
            }
          }
        }, durationPerSceneMs + 500); // Add a little buffer for the last caption/speech
      }
    } else if (!isPlayingPreview) {
        console.log("[Animation useEffect] isPlayingPreview is false. Ensuring timer is cleared.");
        // This cleanup is now more robustly handled in the effect for !isPlayingPreview
    }

    // Cleanup for this effect instance (e.g., if dependencies change mid-timer)
    return () => {
      if (sceneTimerRef.current) {
        console.log("[Animation useEffect cleanup] Clearing scene timer due to re-run or unmount.");
        clearTimeout(sceneTimerRef.current);
        sceneTimerRef.current = null;
      }
    };
  }, [isPlayingPreview, currentPreviewSceneIndex, isPreviewModalOpen, introVideoAssets]);


  // Effect to stop everything if modal is closed OR preview stopped by other means
  useEffect(() => {
    if (!isPlayingPreview) {
      console.log("[useEffect !isPlayingPreview] Preview stopped. Cleaning up speech, timers, and utterance.");
      if (typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis.speaking) {
        console.log("[useEffect !isPlayingPreview] Cancelling active speech synthesis.");
        window.speechSynthesis.cancel(); // Stop any ongoing speech
      }
      setCurrentSpokenText(''); // Clear captions

      if (sceneTimerRef.current) {
        console.log("[useEffect !isPlayingPreview] Clearing scene timer.");
        clearTimeout(sceneTimerRef.current);
        sceneTimerRef.current = null;
      }
      if (utteranceRef.current) {
        console.log("[useEffect !isPlayingPreview] Clearing utterance event handlers and ref.");
        utteranceRef.current.onboundary = null;
        utteranceRef.current.onend = null;
        utteranceRef.current.onerror = null;
        utteranceRef.current = null;
      }
       if (voiceLoadTimeoutRef.current) {
        console.log("[useEffect !isPlayingPreview] Clearing voice load timeout.");
        clearTimeout(voiceLoadTimeoutRef.current);
        voiceLoadTimeoutRef.current = null;
      }
      voicesLoadedRef.current = false; // Reset voice loaded flag
    }
  }, [isPlayingPreview]);

  const speakLogic = () => {
    console.log("[speakLogic] Attempting to speak.");
    if (!introVideoAssets || !introVideoAssets.script) {
      console.warn("[speakLogic] No script available to speak.");
      setCurrentSpokenText("Voiceover: Script not available.");
      return;
    }
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      console.warn("[speakLogic] Speech synthesis not supported by browser.");
      setCurrentSpokenText("Voiceover: Not supported by browser.");
      toast({ variant: "default", title: "Text-to-Speech Not Available", description: "Your browser does not support speech synthesis." });
      return;
    }

    // Cancel any previous speech before starting a new one
    window.speechSynthesis.cancel();
    if (utteranceRef.current) { // Clear previous utterance handlers
        utteranceRef.current.onboundary = null;
        utteranceRef.current.onend = null;
        utteranceRef.current.onerror = null;
    }

    const utterance = new SpeechSynthesisUtterance(introVideoAssets.script);
    utteranceRef.current = utterance; // Store the current utterance

    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
        voicesLoadedRef.current = true;
        let selectedVoice = voices.find(voice => voice.lang.startsWith('en') && voice.localService);
        if (!selectedVoice) selectedVoice = voices.find(voice => voice.lang.startsWith('en'));
        if (!selectedVoice && voices.some(voice => voice.localService)) selectedVoice = voices.find(voice => voice.localService);
        if (!selectedVoice && voices.length > 0) selectedVoice = voices[0];

        if (selectedVoice) {
            utterance.voice = selectedVoice;
            console.log('[speakLogic] Using voice:', selectedVoice.name, selectedVoice.lang);
        } else {
            console.warn('[speakLogic] Could not find a suitable voice, using browser default.');
        }
    } else {
        console.warn('[speakLogic] No speech synthesis voices available at speak time (should have been caught by voiceschanged).');
        setCurrentSpokenText("Voiceover: No voices available.");
        // Allow visual preview to continue without audio
    }

    utterance.onboundary = (event) => {
        if (!isPlayingPreviewRef.current || !isPreviewModalOpenRef.current || !utteranceRef.current) return;
        if (event.name === 'sentence' || event.name === 'word') { // Prefer sentence, fallback to word
            const scriptText = introVideoAssets?.script || "";
            let currentSentence = "";
            
            // Try to find the current sentence in the pre-parsed sentences
            if (scriptSentencesRef.current.length > 0) {
                let charCounter = 0;
                for (const sentence of scriptSentencesRef.current) {
                    if (event.charIndex >= charCounter && event.charIndex < charCounter + sentence.length) {
                        currentSentence = sentence;
                        break;
                    }
                    charCounter += sentence.length;
                }
            }

            // Fallback if pre-parsed sentence not found or not working well
            if (!currentSentence && scriptText) {
                const start = event.charIndex;
                let end = scriptText.length;
                // Find next punctuation mark from start
                const PUNC = /[.!?;\n]/;
                const match = PUNC.exec(scriptText.substring(start));
                if (match) {
                    end = start + match.index + match[0].length;
                }
                currentSentence = scriptText.substring(start, end).trim();
            }

            if (currentSentence) {
                console.log(`[SpeakLogic onboundary] Caption: "${currentSentence}" (charIndex: ${event.charIndex})`);
                setCurrentSpokenText(currentSentence);
            }
        }
    };

    utterance.onend = () => {
        console.log('[speakLogic onend] Speech finished.');
        setCurrentSpokenText(''); // Clear caption at the end
        if (utteranceRef.current) { // Clear handlers from this specific utterance
            utteranceRef.current.onboundary = null;
            utteranceRef.current.onend = null;
            utteranceRef.current.onerror = null;
            utteranceRef.current = null; // Clear ref
        }
        // The visual animation's useEffect will handle stopping isPlayingPreview if it's the last scene.
    };

    utterance.onerror = (event) => {
        console.error('[speakLogic onerror] SpeechSynthesisUtterance.onerror:', event);
        toast({
            variant: "destructive",
            title: "Voiceover Error",
            description: `Could not play voiceover: ${event.error}. Ensure browser voice services are enabled.`,
        });
        setCurrentSpokenText(`Voiceover error: ${event.error}`);
        // Do not set isPlayingPreview to false here; let visual preview attempt to continue.
        if (utteranceRef.current) { // Clear handlers
            utteranceRef.current.onboundary = null;
            utteranceRef.current.onend = null;
            utteranceRef.current.onerror = null;
            utteranceRef.current = null; // Clear ref
        }
    };
    
    if (isPlayingPreviewRef.current && isPreviewModalOpenRef.current) {
        console.log("[speakLogic] Calling window.speechSynthesis.speak()");
        window.speechSynthesis.speak(utterance);
    } else {
        console.log("[speakLogic] Conditions for speaking not met (preview stopped or modal closed).");
    }
  };


  const startPreview = () => {
    console.log("[startPreview] Called.");
    console.log("[startPreview] Current introVideoAssets:", introVideoAssets);
    console.log("[startPreview] Current generatedVideoSceneImages:", generatedVideoSceneImages);

    if (!introVideoAssets || !introVideoAssets.script || !introVideoAssets.visualPrompts || introVideoAssets.visualPrompts.length === 0) {
        toast({ variant: "destructive", title: "Preview Error", description: "Video assets are incomplete or missing (no script or visual prompts). Cannot start preview." });
        console.error("[startPreview] Video assets incomplete. Aborting.");
        closePreviewModal();
        return;
    }

    const allImagesReady = introVideoAssets.visualPrompts.every((_,index) => typeof generatedVideoSceneImages[index] === 'string');
    if (!allImagesReady) {
        toast({ variant: "destructive", title: "Preview Error", description: "Not all scene images are generated yet. Please wait or regenerate missing ones." });
        console.error("[startPreview] Not all scene images are ready. Aborting.");
        // Don't close modal, let user see which images are missing.
        // Ensure isPlayingPreview is false if we abort here.
        if (isPlayingPreview) setIsPlayingPreview(false); 
        return;
    }
    
    if (scriptSentencesRef.current.length === 0 && introVideoAssets.script) {
        scriptSentencesRef.current = introVideoAssets.script.match(/[^.!?]+[.!?]*/g) || [introVideoAssets.script];
        console.log("[startPreview] Parsed script into sentences:", scriptSentencesRef.current);
    }


    // setIsPreviewModalOpen(true); // This should be handled by Dialog's onOpenChange or button click
    setCurrentPreviewSceneIndex(0);
    setCurrentSpokenText(''); 
    console.log("[startPreview] Before setIsPlayingPreview(true). Current isPlayingPreviewRef:", isPlayingPreviewRef.current);
    setIsPlayingPreview(true); // This should trigger the animation useEffect
    console.log("[startPreview] After setIsPlayingPreview(true) call. State will update in next render.");


    // Voice loading logic
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        if (window.speechSynthesis.getVoices().length === 0 && !voicesLoadedRef.current) {
            console.log("[startPreview speak] Voices not loaded, waiting for 'voiceschanged' or timeout.");
            setCurrentSpokenText("Voiceover: Loading voices...");

            const voiceChangedHandler = () => {
                console.log("[startPreview VoiceChangedHandler] 'voiceschanged' event fired.");
                window.speechSynthesis.removeEventListener('voiceschanged', voiceChangedHandler);
                if (voiceLoadTimeoutRef.current) clearTimeout(voiceLoadTimeoutRef.current);
                voiceLoadTimeoutRef.current = null;
                voicesLoadedRef.current = true;
                if (isPlayingPreviewRef.current && isPreviewModalOpenRef.current) speakLogic(); else console.log("[startPreview VoiceChangedHandler] Conditions no longer met for speaking.");
            };
            window.speechSynthesis.addEventListener('voiceschanged', voiceChangedHandler);

            if (voiceLoadTimeoutRef.current) clearTimeout(voiceLoadTimeoutRef.current);
            voiceLoadTimeoutRef.current = setTimeout(() => {
                console.log("[startPreview VoiceLoadTimeout] Fallback timer fired.");
                window.speechSynthesis.removeEventListener('voiceschanged', voiceChangedHandler);
                if (!voicesLoadedRef.current && window.speechSynthesis.getVoices().length > 0) {
                     console.log("[startPreview VoiceLoadTimeout] Voices found after timeout.");
                     voicesLoadedRef.current = true;
                } else if (!voicesLoadedRef.current) {
                    console.warn("[startPreview VoiceLoadTimeout] Voices still not loaded. TTS may fail.");
                    setCurrentSpokenText("Voiceover: Failed to load voices in time.");
                }
                if (isPlayingPreviewRef.current && isPreviewModalOpenRef.current) speakLogic(); else console.log("[startPreview VoiceLoadTimeout] Conditions no longer met for speaking post-timeout.");
            }, 2500); // 2.5 seconds fallback
        } else {
            console.log("[startPreview speak] Voices already available or previously loaded. Calling speakLogic directly.");
            voicesLoadedRef.current = true;
            speakLogic();
        }
    } else {
        console.warn("[startPreview] Speech synthesis not available. Proceeding with visual preview only.");
        setCurrentSpokenText("Voiceover: Not supported.");
        // Visual preview will still run based on isPlayingPreview being true.
    }
};


  const allSceneImagesGenerated = introVideoAssets && introVideoAssets.visualPrompts && introVideoAssets.visualPrompts.every((_, index) => typeof generatedVideoSceneImages[index] === 'string');


  const renderPricingPackage = (pkg: SinglePackageDetail, tierName: string) => (
    <Card key={pkg.title || tierName} className="flex flex-col shadow-md hover:shadow-lg transition-all duration-300 bg-card transform hover:-translate-y-1">
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
            <h4 className="text-xs font-semibold text-primary mb-1.5 flex items-center">
              <ListChecks className="w-3.5 h-3.5 mr-1.5 text-primary" />
              Key Features:
            </h4>
            <ul className="list-none pl-0 text-xs text-muted-foreground space-y-1">
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
      toast({
        title: (
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 text-primary" />
              Signed Out
            </div>
          ),
        description: "You have been successfully signed out." });
      setCurrentUser(null);
      router.push('/auth');
    } catch (error) {
      toast({ title: "Sign Out Failed", description: "Could not sign out. Please try again.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

 const handleDownloadImage = (imageDataUri: string | undefined | null, index: number, type: 'hero' | 'sample' | 'video-scene') => {
    if (typeof imageDataUri === 'string') {
      const link = document.createElement('a');
      link.href = imageDataUri;
      const mimeType = imageDataUri.substring(imageDataUri.indexOf(':') + 1, imageDataUri.indexOf(';'));
      const extension = mimeType.split('/')[1] || 'png';
      link.download = `gigwizard-gig-${type}-image-${index + 1}.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({ title: 'Image Download Started', description: `Downloading gigwizard-gig-${type}-image-${index + 1}.${extension}` });
    } else {
      toast({ variant: 'destructive', title: 'Download Failed', description: 'Image data is not available.' });
    }
  };

  const formatDescription = (description: string | undefined): string => {
    if (!description) return '';
    return description
      .replace(/\\n/g, '\n')
      .replace(/\n/g, '<br/>')
      .replace(/^### (.*?)(<br\s*\/?>|$)/gm, (match, content) => `<h3 class="text-lg font-semibold mt-5 mb-3 text-primary border-b border-accent/70 pb-1.5">${content.trim()}</h3>`)
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/__(.*?)__/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/_(.*?)_/g, '<em>$1</em>')
      .replace(/^(?:✔|🏆|-)\s*(.*?)(<br\s*\/?>|$)/gm, (match, content) => {
        let bullet = '';
        if (match.startsWith('✔')) bullet = '<span class="text-primary font-bold mr-1.5">✔</span> ';
        else if (match.startsWith('🏆')) bullet = '<span class="text-primary font-bold mr-1.5">🏆</span> ';
        else if (match.startsWith('-')) bullet = '<span class="text-primary font-bold mr-1.5">•</span> ';
        return `<ul style="list-style: none; padding-left: 0; margin-bottom: 0;"><li style="padding-left: 1.5em; text-indent: -1.5em; margin-bottom: 0.65rem; line-height: 1.65; color: hsl(var(--muted-foreground));">${bullet}${content.trim()}</li></ul>`;
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

  const anyActionLoading = isLoading || isRefreshingTags || isRecreatingImage || isRegeneratingTitle || isAnalyzingMarket || isGeneratingIntroVideoAssets;

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
        .script-content {
          white-space: pre-wrap;
          font-family: var(--font-geist-sans);
          line-height: 1.7;
          color: hsl(var(--muted-foreground));
          background-color: hsl(var(--secondary));
          padding: 1rem;
          border-radius: 0.5rem;
          box-shadow: inset 0 2px 4px 0 rgba(0,0,0,0.05);
        }
        .preview-image-container {
          width: 100%;
          height: 100%;
          background-color: #000; 
          border-radius: 0.5rem; 
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          position: relative;
        }
        .preview-image {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain; 
        }
        .preview-caption-overlay {
          position: absolute;
          bottom: 5%; 
          left: 50%;
          transform: translateX(-50%);
          width: 90%; 
          padding: 0.5rem 1rem;
          background-color: rgba(0, 0, 0, 0.7); 
          color: white;
          text-align: center;
          border-radius: 0.375rem; 
          font-size: 1rem; 
          line-height: 1.5;
          max-height: 25%; 
          overflow-y: auto; 
          opacity: 0; 
          transition: opacity 0.3s ease-in-out;
          pointer-events: none; 
        }
        .preview-caption-overlay.visible {
          opacity: 1;
        }
      `}</style>
      <header className="w-full max-w-5xl mb-10 p-4 rounded-lg bg-card shadow-md">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center space-x-3">
                <div className="inline-flex items-center justify-center p-2.5 bg-primary rounded-full shadow-lg">
                  <Sparkles className="h-7 w-7 text-primary-foreground" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-primary tracking-tight">GigWizard</h1>
                    <p className="text-md text-muted-foreground">
                    Craft your high-converting Fiverr gig with AI precision.
                    </p>
                </div>
            </div>
            {currentUser && (
              <div className="flex flex-col xs:flex-row items-center gap-2 xs:gap-4">
                <div className="text-center xs:text-right">
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

      <main className="w-full max-w-5xl bg-card p-6 sm:p-10 rounded-2xl shadow-2xl" data-state={gigData && !gigData.error && !isLoading ? "open" : "closed"}>
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

          <div>
            <Label htmlFor="userGigConcept" className="text-lg font-semibold flex items-center mb-2.5 text-foreground">
                <Lightbulb className="mr-2.5 h-5 w-5 text-primary" />
                Briefly describe your gig idea or concept (Optional)
            </Label>
            <Textarea
                id="userGigConcept"
                placeholder="e.g., I want to offer premium Shopify theme customization focused on speed and mobile experience."
                className="text-base py-3 px-4 focus:border-primary focus:ring-primary min-h-[80px]"
                value={userGigConcept}
                onChange={(e) => setUserGigConcept(e.target.value)}
                disabled={anyActionLoading}
            />
            <p className="text-xs text-muted-foreground mt-1.5">Providing this helps the AI generate more tailored market strategies.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button type="button" onClick={handleMarketAnalysis} variant="outline" className="w-full text-lg py-3.5 rounded-lg shadow-md hover:shadow-lg transition-shadow" disabled={anyActionLoading || !watchedMainKeyword || watchedMainKeyword.trim().length < 3}>
              {isAnalyzingMarket ? (
                <>
                  <Loader2 className="mr-2.5 h-5 w-5 animate-spin" />
                  Analyzing Market...
                </>
              ) : (
                <>
                  <Search className="mr-2.5 h-5 w-5" />
                  Analyze Market & Strategy
                </>
              )}
            </Button>

            <Button type="submit" className="w-full text-lg py-3.5 rounded-lg shadow-md hover:shadow-lg transition-shadow" disabled={anyActionLoading || !watchedMainKeyword || watchedMainKeyword.trim().length < 3}>
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
          </div>
        </form>

        {isAnalyzingMarket && (
             <div className="mt-10 space-y-3">
                <Progress value={progress} className="w-full h-3" /> {}
                <p className="text-md text-center text-muted-foreground">AI is researching the market... This might take a moment.</p>
            </div>
        )}

        {marketAnalysisError && !isAnalyzingMarket && (
           <Alert variant="destructive" className="mt-10 p-5">
             <AlertTriangle className="h-5 w-5" />
             <AlertTitle className="text-lg">Market Analysis Error</AlertTitle>
             <AlertDescription className="text-base">{marketAnalysisError}</AlertDescription>
           </Alert>
        )}

        {marketAnalysisData && !isAnalyzingMarket && (
          <div className="mt-12 space-y-10 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:duration-500">
            <Separator />
            <h2 className="text-2xl font-bold text-center text-primary flex items-center justify-center">
                <Brain className="mr-3 h-7 w-7" /> Market Analysis & Strategic Insights
            </h2>

            <GigResultSection title="Simulated Top Competitor Profiles" icon={Users} contentClassName="p-4 sm:p-5">
                <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-6 mt-2">
                    {marketAnalysisData.simulatedCompetitorProfiles.map((profile, index) => (
                        <Card key={index} className="flex flex-col shadow-md hover:shadow-lg transition-all duration-300 bg-card transform hover:-translate-y-1">
                            <CardHeader className="bg-secondary rounded-t-lg p-4">
                                <CardTitle className="text-md font-semibold text-primary">{profile.gigTitle}</CardTitle>
                                <CardDescription className="text-xs text-foreground pt-1">Primary Offering: {profile.primaryOffering}</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-grow pt-4 space-y-2">
                                <div>
                                    <strong className="text-xs text-muted-foreground">Key Selling Points:</strong>
                                    <ul className="list-disc list-inside text-xs text-muted-foreground ml-4 mt-1">
                                        {profile.keySellingPoints.map((point, i) => <li key={i}>{point}</li>)}
                                    </ul>
                                </div>
                                <p className="text-xs text-muted-foreground"><strong>Price Range:</strong> {profile.estimatedPriceRange}</p>
                                <p className="text-xs text-muted-foreground"><strong>Targets:</strong> {profile.targetAudienceHint}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </GigResultSection>

            <GigResultSection title="Observed Success Factors" icon={TrendingUp} contentClassName="p-4 sm:p-5">
                <ul className="list-disc list-inside space-y-2 p-5 bg-secondary rounded-lg shadow-inner text-muted-foreground">
                    {marketAnalysisData.observedSuccessFactors.map((factor, index) => (
                        <li key={index}>{factor}</li>
                    ))}
                </ul>
            </GigResultSection>

            <GigResultSection title="Strategic Recommendations for You" icon={Target} contentClassName="p-4 sm:p-5">
                <ul className="list-disc list-inside space-y-2 p-5 bg-secondary rounded-lg shadow-inner text-muted-foreground">
                    {marketAnalysisData.strategicRecommendationsForUser.map((rec, index) => (
                        <li key={index}>{rec}</li>
                    ))}
                </ul>
            </GigResultSection>

            <GigResultSection title="Overall Market Summary" icon={ClipboardList} contentClassName="p-4 sm:p-5">
                <p className="p-5 bg-secondary rounded-lg shadow-inner text-muted-foreground">{marketAnalysisData.overallMarketSummary}</p>
            </GigResultSection>

            <GigResultSection title="Outreach Tip" icon={Handshake} contentClassName="p-4 sm:p-5">
                <p className="p-5 bg-secondary rounded-lg shadow-inner text-muted-foreground">{marketAnalysisData.outreachTip}</p>
            </GigResultSection>

            <GigResultSection title="Winning Approach Summary" icon={Award} contentClassName="p-4 sm:p-5">
                <p className="p-5 bg-secondary rounded-lg shadow-inner text-muted-foreground">{marketAnalysisData.winningApproachSummary}</p>
            </GigResultSection>
            <Separator />
          </div>
        )}


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
          <div className="mt-12 space-y-10 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:duration-500">
             <h2 className="text-2xl font-bold text-center text-primary flex items-center justify-center">
                <Sparkles className="mr-3 h-7 w-7" /> Your Generated Gig Components
            </h2>
            <GigResultSection title="Optimized Gig Title" icon={Lightbulb} contentClassName="p-4 sm:p-5">
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
              <GigResultSection title="Suggested Category" icon={FolderKanban} contentClassName="p-4 sm:p-5">
                <p className="p-5 bg-secondary rounded-lg shadow-inner text-foreground">{gigData.category}</p>
              </GigResultSection>
              <GigResultSection title="Suggested Subcategory" icon={BookCopy} contentClassName="p-4 sm:p-5">
                <p className="p-5 bg-secondary rounded-lg shadow-inner text-foreground">{gigData.subcategory}</p>
              </GigResultSection>
            </div>

            <GigResultSection title="Strategic Search Tags & Analytics" icon={TagsIcon} contentClassName="p-4 sm:p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-1">
                {gigData.searchTags?.map((tag) => (
                  <Card key={tag.term} className="bg-secondary shadow-inner transition-all duration-300 hover:scale-105 hover:shadow-md">
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

            <GigResultSection title="High-Converting Pricing Packages" icon={BadgeDollarSign} contentClassName="p-4 sm:p-5">
              <div className="grid md:grid-cols-1 lg:grid-cols-3 gap-6 mt-2">
                {gigData.pricing?.basic && renderPricingPackage(gigData.pricing.basic, "Basic")}
                {gigData.pricing?.standard && renderPricingPackage(gigData.pricing.standard, "Standard")}
                {gigData.pricing?.premium && renderPricingPackage(gigData.pricing.premium, "Premium")}
              </div>
            </GigResultSection>

            <GigResultSection title="Compelling Gig Description" icon={FileText} contentClassName="p-4 sm:p-5">
                <div
                    className="p-5 bg-secondary rounded-lg shadow-inner space-y-3 markdown-content custom-scrollbar max-h-[450px] overflow-y-auto text-foreground"
                    dangerouslySetInnerHTML={{ __html: formatDescription(gigData.description) }}
                />
            </GigResultSection>

            <GigResultSection title="Frequently Asked Questions (FAQs)" icon={HelpCircle} contentClassName="p-4 sm:p-5">
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

            <GigResultSection title="Essential Client Requirements" icon={CheckSquare} contentClassName="p-4 sm:p-5">
              <ul className="list-disc list-inside space-y-2.5 p-5 bg-secondary rounded-lg shadow-inner text-muted-foreground">
                {gigData.requirements?.map((req, index) => (
                  <li key={index}>{req}</li>
                ))}
              </ul>
            </GigResultSection>

           <GigResultSection title="AI Generated Gig Images" icon={ImageIcon} contentClassName="p-4 sm:p-5">
             <div className="p-5 bg-secondary rounded-lg shadow-inner flex flex-col items-center space-y-8">
                {gigData.imageDataUris && gigData.imageDataUris.length > 0 ? (
                    <div className="w-full space-y-10">
                        {gigData.imageDataUris[0] && (
                            <div className="flex flex-col items-center w-full">
                                <h4 className="text-md font-semibold text-muted-foreground mb-3">
                                    Main Hero Image
                                </h4>
                                <div className="w-full max-w-2xl mx-auto">
                                    <img
                                        src={gigData.imageDataUris[0]}
                                        alt="AI Generated Gig Hero Image"
                                        className="rounded-lg border-2 border-border shadow-lg object-cover w-full h-auto aspect-[3/2]"
                                        data-ai-hint="professional service hero"
                                    />
                                </div>
                                <Button onClick={() => handleDownloadImage(gigData.imageDataUris && gigData.imageDataUris[0], 0, 'hero')} variant="outline" size="sm" className="mt-4 shadow-md" disabled={anyActionLoading}>
                                    <Download className="mr-2 h-4 w-4" />
                                    Download Hero Image
                                </Button>
                            </div>
                        )}

                        {gigData.imageDataUris.length > 1 && (
                             <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mt-10">
                                {gigData.imageDataUris.slice(1).map((uri, index) => (
                                    <div key={`sample-image-container-${index}`} className="flex flex-col items-center w-full">
                                        <h4 className="text-md font-semibold text-muted-foreground mb-3">
                                            Sample Image {index + 1}
                                        </h4>
                                        <div className="w-full">
                                            <img
                                                src={uri}
                                                alt={`AI Generated Gig Sample Image ${index + 1}`}
                                                className="rounded-lg border-2 border-border shadow-lg object-cover w-full h-auto aspect-[3/2]"
                                                data-ai-hint="professional service sample"
                                            />
                                        </div>
                                         <Button onClick={() => handleDownloadImage(uri, index, 'sample')} variant="outline" size="sm" className="mt-4 shadow-md" disabled={anyActionLoading}>
                                            <Download className="mr-2 h-4 w-4" />
                                            Download Sample {index + 1}
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                  <div className="w-full max-w-[600px] aspect-[3/2] bg-muted rounded-lg flex items-center justify-center border-2 border-border shadow-md" data-ai-hint="placeholder service">
                    <ImageIcon className="w-16 h-16 text-muted-foreground/50" />
                    <p className="ml-3 text-muted-foreground">Images loading or not available...</p>
                  </div>
                )}
                {(gigData.imageDataUris && gigData.imageDataUris.length > 0) && (
                    <div className="flex flex-col sm:flex-row sm:space-x-3 space-y-3 sm:space-y-0 mt-8 w-full justify-center">
                        <Button onClick={() => handleRecreateImage()} variant="outline" className="shadow-md w-full sm:w-auto" disabled={anyActionLoading}>
                            {isRecreatingImage ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <RefreshCw className="mr-2 h-4 w-4" />
                            )}
                          Recreate All Images
                        </Button>
                    </div>
                )}
                <p className="text-xs text-muted-foreground text-center max-w-md px-4 pt-6">
                  Fiverr recommended size: 1280x769px. Min: 712x430px. Use these AI images as inspiration or for mockups.
                </p>
            </div>
        </GigResultSection>

            {gigData && !gigData.error && !isLoading && (
            <GigResultSection title="AI-Generated Intro Video Blueprint" icon={Video} contentClassName="p-4 sm:p-5">
                {!introVideoAssets && !isGeneratingIntroVideoAssets && !introVideoAssetsError && (
                <div className="text-center py-4">
                    <Button onClick={handleGenerateIntroVideoAssets} disabled={anyActionLoading}>
                    <Wand2 className="mr-2 h-5 w-5" />
                    Generate Intro Video Blueprint
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">Create assets for a short (15-30s) intro video for your gig.</p>
                </div>
                )}
                {isGeneratingIntroVideoAssets && !introVideoAssets && (
                    <div className="flex items-center justify-center py-6">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="ml-3 text-muted-foreground">AI is drafting your video blueprint...</p>
                    </div>
                )}
                {introVideoAssetsError && !isGeneratingIntroVideoAssets && (
                <Alert variant="destructive" className="my-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Video Blueprint Error</AlertTitle>
                    <AlertDescription>{introVideoAssetsError}</AlertDescription>
                     <Button onClick={handleGenerateIntroVideoAssets} variant="outline" size="sm" className="mt-3" disabled={anyActionLoading}>
                        <RefreshCw className="mr-2 h-4 w-4" /> Try Again
                    </Button>
                </Alert>
                )}
                {introVideoAssets && !introVideoAssetsError && (
                <div className="space-y-6 p-4 bg-secondary rounded-lg shadow-inner">
                    <div>
                    <h4 className="text-md font-semibold text-primary mb-1 flex items-center"><Clapperboard className="w-5 h-5 mr-2" />Video Concept:</h4>
                    <p className="text-sm text-muted-foreground">{introVideoAssets.videoConcept}</p>
                    </div>
                    <div>
                    <h4 className="text-md font-semibold text-primary mb-1 flex items-center"><Clock className="w-5 h-5 mr-2" />Suggested Duration:</h4>
                    <p className="text-sm text-muted-foreground">{introVideoAssets.suggestedDurationSeconds} seconds</p>
                    </div>
                    <div>
                    <h4 className="text-md font-semibold text-primary mb-1 flex items-center"><FileText className="w-5 h-5 mr-2" />Script / Talking Points:</h4>
                    <div className="text-sm script-content">{introVideoAssets.script}</div>
                    </div>
                    <div>
                    <h4 className="text-md font-semibold text-primary mb-1 flex items-center"><Music2 className="w-5 h-5 mr-2" />Audio Suggestion (for final video):</h4>
                    <p className="text-sm text-muted-foreground">{introVideoAssets.audioSuggestion}</p>
                    </div>
                    {introVideoAssets.callToAction && (
                        <div>
                            <h4 className="text-md font-semibold text-primary mb-1 flex items-center"><Megaphone className="w-5 h-5 mr-2" />Suggested Call to Action:</h4>
                            <p className="text-sm text-muted-foreground">{introVideoAssets.callToAction}</p>
                        </div>
                    )}
                    <div>
                        <h4 className="text-md font-semibold text-primary mb-2 flex items-center">
                            <ImageIcon className="w-5 h-5 mr-2" />Visual Scene Assets:
                            {isGeneratingIntroVideoAssets && Object.values(generatedVideoSceneImages).some(s => s === 'loading') && (
                                <span className="ml-2 text-xs text-muted-foreground flex items-center">
                                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                    Generating images ({Object.values(generatedVideoSceneImages).filter(s => typeof s === 'string').length}/{introVideoAssets.visualPrompts.length})...
                                </span>
                            )}
                        </h4>
                        <div className="space-y-4">
                            {introVideoAssets.visualPrompts.map((prompt, index) => (
                            <Card key={index} className="bg-card p-3 shadow-sm">
                                <p className="text-xs italic text-muted-foreground mb-2">Prompt for Scene {index + 1}: "{prompt}"</p>
                                {generatedVideoSceneImages[index] === 'loading' && (
                                    <div className="flex items-center text-sm text-muted-foreground">
                                        <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Generating image...
                                    </div>
                                )}
                                {generatedVideoSceneImages[index] === null && (
                                     <div className="flex flex-col items-start">
                                        <p className="text-xs text-destructive mb-2">Image generation failed for this scene.</p>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleGenerateVideoSceneImage(prompt, index)}
                                            disabled={isRecreatingImage || isGeneratingIntroVideoAssets}
                                            className="w-full sm:w-auto text-xs"
                                        >
                                            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                                            Retry Scene Image {index + 1}
                                        </Button>
                                    </div>
                                )}
                                {typeof generatedVideoSceneImages[index] === 'string' && (
                                    <div className="mt-3 flex flex-col items-center">
                                        <img
                                            src={generatedVideoSceneImages[index] as string}
                                            alt={`Generated image for video scene ${index + 1}`}
                                            className="rounded-md border border-border object-cover aspect-video w-full max-w-[300px] h-auto"
                                        />
                                        <div className="flex gap-2 mt-2">
                                            <Button
                                                onClick={() => handleGenerateVideoSceneImage(prompt, index)}
                                                variant="outline"
                                                size="xs"
                                                className="text-xs"
                                                disabled={isRecreatingImage || isGeneratingIntroVideoAssets}
                                            >
                                                <RefreshCw className="mr-1.5 h-3 w-3" /> Regenerate
                                            </Button>
                                            <Button
                                                onClick={() => handleDownloadImage(generatedVideoSceneImages[index], index, 'video-scene')}
                                                variant="outline"
                                                size="xs"
                                                className="text-xs"
                                                disabled={anyActionLoading}
                                            >
                                                <Download className="mr-1.5 h-3 w-3" /> Download
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </Card>
                            ))}
                        </div>
                    </div>
                   {allSceneImagesGenerated && introVideoAssets && introVideoAssets.visualPrompts.length > 0 && (
                    <div className="mt-6 text-center">
                         <Button
                            onClick={() => {
                                // The Dialog's onOpenChange will handle calling startPreview if modal opens
                                if (isPlayingPreviewRef.current) { // If already playing, restart it
                                    closePreviewModal(); 
                                    setTimeout(() => {
                                        setIsPreviewModalOpen(true); 
                                    }, 100); 
                                } else {
                                    setIsPreviewModalOpen(true); 
                                }
                            }}
                            disabled={anyActionLoading || (isGeneratingIntroVideoAssets && !allSceneImagesGenerated) || (!introVideoAssets?.visualPrompts?.length)}
                        >
                            {isPlayingPreviewRef.current ? <RefreshCw className="mr-2 h-5 w-5 animate-spin" /> : <PlayCircle className="mr-2 h-5 w-5" />}
                            {isPlayingPreviewRef.current ? "Restart Preview" : "Play Animated Preview with Voice"}
                        </Button>
                    </div>
                )}
                </div>
                )}
            </GigResultSection>
            )}

          <Dialog 
            open={isPreviewModalOpen} 
            onOpenChange={(isOpen) => {
                setIsPreviewModalOpen(isOpen); // Sync state with dialog
                if (isOpen) {
                    console.log("Dialog onOpenChange: Opening modal, calling startPreview.");
                    startPreview(); // Call startPreview when modal opens
                } else {
                    console.log("Dialog onOpenChange: Closing modal, calling closePreviewModal.");
                    closePreviewModal();
                }
            }}
        >
            <DialogContent className="w-[95vw] max-w-[95vw] h-[90vh] max-h-[90vh] p-0 flex flex-col bg-black text-white overflow-hidden">
                <DialogHeader className="p-3 border-b border-gray-700 flex-shrink-0 bg-gray-900">
                <div className="flex justify-between items-center">
                    <DialogTitle className="text-lg flex items-center text-gray-200">
                        <PlayCircle className="w-5 h-5 mr-2 text-primary" />
                        Intro Video Preview
                    </DialogTitle>
                    {/* The default X button from DialogContent will be used here */}
                </div>
                    <DialogDescription className="text-xs text-gray-400 flex items-center gap-2 pt-1">
                        <span className="flex items-center"><Mic className="w-3.5 h-3.5 mr-1" /> Voiceover: {isPlayingPreviewRef.current ? (currentSpokenText ? "Playing" : "Loading/Buffering...") : "Paused/Stopped"}</span>
                        <span className="flex items-center"><Captions className="w-3.5 h-3.5 mr-1" /> {currentSpokenText ? "Live Caption" : "Captions will appear here"}</span>
                    </DialogDescription>
                </DialogHeader>
                <div className="flex-grow flex items-center justify-center overflow-hidden relative p-0 m-0 bg-black">
                {isPlayingPreviewRef.current && introVideoAssets && currentPreviewSceneIndexRef.current < introVideoAssets.visualPrompts.length && typeof generatedVideoSceneImages[currentPreviewSceneIndexRef.current] === 'string' ? (
                    <div className="preview-image-container w-full h-full">
                    <img
                        src={generatedVideoSceneImages[currentPreviewSceneIndexRef.current] as string}
                        alt={`Preview Scene ${currentPreviewSceneIndexRef.current + 1}`}
                        className="preview-image"
                    />
                        {currentSpokenText && (
                        <div className={`preview-caption-overlay ${currentSpokenText ? 'visible' : ''} custom-scrollbar`}>
                            {currentSpokenText}
                        </div>
                    )}
                    </div>
                ) : (
                    <div className="preview-image-container w-full h-full flex flex-col items-center justify-center">
                    <ImageIcon className="w-24 h-24 text-gray-600" />
                    <p className="mt-2 text-gray-500">
                        {isPlayingPreviewRef.current ? `Loading scene ${currentPreviewSceneIndexRef.current + 1}...` : "Preview will play here."}
                    </p>
                    </div>
                )}
                </div>
                <div className="p-3 border-t border-gray-700 flex justify-between items-center flex-shrink-0 bg-gray-900">
                    {introVideoAssets && (
                            <p className="text-xs text-gray-400">
                            Scene {isPlayingPreviewRef.current && introVideoAssets.visualPrompts.length > 0 ? currentPreviewSceneIndexRef.current + 1 : '-' } of {introVideoAssets.visualPrompts.length > 0 ? introVideoAssets.visualPrompts.length : '-'}
                            {' | '}
                            Duration: {introVideoAssets.suggestedDurationSeconds}s
                            {' | '}
                            Music: {introVideoAssets.audioSuggestion || "Not specified"} (manual add)
                        </p>
                    )}
                </div>
            </DialogContent>
            </Dialog>


            <div className="text-center mt-16">
              <Button
                onClick={() => {
                    setGigData(null);
                    setMarketAnalysisData(null);
                    setMarketAnalysisError(null);
                    setIntroVideoAssets(null);
                    setIntroVideoAssetsError(null);
                    setGeneratedVideoSceneImages({});
                    setProgress(0);
                    setCurrentMainKeyword(null);
                    setUserGigConcept('');
                    reset({ mainKeyword: '', userGigConcept: '' });
                    if (isPreviewModalOpen) closePreviewModal(); // Ensure preview is fully reset if open
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                variant="outline"
                size="lg"
                className="py-3 px-8 rounded-lg shadow-md hover:shadow-lg"
                disabled={anyActionLoading}
              >
                <ArrowRight className="mr-2.5 h-5 w-5 transform rotate-[270deg]" />
                Start Over / New Gig
              </Button>
            </div>
          </div>
        )}
      </main>
      <footer className="w-full max-w-5xl mt-16 text-center">
        <Separator className="my-6" />
        <p className="text-md text-muted-foreground">
          GigWizard &copy; {new Date().getFullYear()}. AI-Powered Gig Creation.
        </p>
      </footer>
    </div>
  );
}

