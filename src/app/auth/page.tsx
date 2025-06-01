// src/app/auth/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithGoogle } from '@/lib/firebase'; // We'll create this
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, Loader2, Mail, Phone, LogIn } from 'lucide-react';
import Image from 'next/image'; // For Google icon
import { useToast } from '@/hooks/use-toast';


// A simple SVG for Google G icon
const GoogleIcon = () => (
  <svg viewBox="0 0 48 48" width="20px" height="20px">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
    <path fill="none" d="M0 0h48v48H0z"></path>
  </svg>
);


export default function AuthPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const user = await signInWithGoogle();
      if (user) {
        toast({
          title: "Signed In Successfully!",
          description: `Welcome, ${user.displayName || 'user'}!`,
        });
        // Redirect to the gig creation page or a dashboard
        router.push('/create');
      } else {
        throw new Error("Google Sign In did not return a user.");
      }
    } catch (err: any) {
      console.error("Google Sign In Error:", err);
      setError(err.message || 'Failed to sign in with Google. Please try again.');
      toast({
        variant: "destructive",
        title: "Sign In Failed",
        description: err.message || 'Could not sign in with Google.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="inline-flex items-center justify-center p-3 bg-primary rounded-full mb-4 mx-auto">
            <LogIn className="h-8 w-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-3xl font-bold text-primary">Join GigWizard</CardTitle>
          <CardDescription className="text-md text-muted-foreground pt-1">
            Sign in to start creating AI-powered Fiverr gigs.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          {error && (
            <div className="bg-destructive/10 p-3 rounded-md flex items-center text-sm text-destructive break-words">
              <AlertTriangle className="h-4 w-4 mr-2 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <Button
            onClick={handleGoogleSignIn}
            className="w-full text-base py-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
            disabled={isLoading}
            variant="outline"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <GoogleIcon />
            )}
            <span className="ml-2">Sign in with Google</span>
          </Button>

          <div className="relative my-6">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-sm text-muted-foreground">
              OR
            </span>
          </div>

          <div className="space-y-4 text-center text-muted-foreground">
            <p className="text-sm">
              Sign in with Email or Phone (coming soon!)
            </p>
            <div className="flex justify-center gap-4">
                <Button variant="outline" disabled className="flex-1 py-3">
                    <Mail className="mr-2 h-4 w-4"/> Email
                </Button>
                <Button variant="outline" disabled className="flex-1 py-3">
                    <Phone className="mr-2 h-4 w-4"/> Phone
                </Button>
            </div>
          </div>
           <p className="text-xs text-muted-foreground text-center pt-4">
            By signing up, you agree to our (notional) Terms of Service and Privacy Policy.
          </p>
        </CardContent>
      </Card>
       <Button variant="link" className="mt-8 text-muted-foreground" onClick={() => router.push('/')}>
        Back to Home
      </Button>
    </div>
  );
}
