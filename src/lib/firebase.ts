
// src/lib/firebase.ts
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, type Auth } from 'firebase/auth';

// User's Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyDBP4kwaIvDxJ8VbLU-BriqGw7d80fiBz8",
  authDomain: "fiverr-ace.firebaseapp.com",
  projectId: "fiverr-ace",
  storageBucket: "fiverr-ace.firebasestorage.app",
  messagingSenderId: "353900402707",
  appId: "1:353900402707:web:1328577db049386194c7e6",
  measurementId: "G-JFE906QYQ2"
};

// Log the config being used, especially the authDomain, for easier debugging
if (typeof window !== 'undefined') {
  console.log("Firebase Config Initializing:", JSON.stringify({ authDomain: firebaseConfig.authDomain, projectId: firebaseConfig.projectId }, null, 2));
  console.log("Current window.location.hostname:", window.location.hostname);
}

let app: FirebaseApp;
let auth: Auth;

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
  if (typeof window !== 'undefined') {
    console.log("Firebase App newly initialized.");
  }
} else {
  app = getApps()[0];
  if (typeof window !== 'undefined') {
    console.log("Firebase App already initialized, using existing instance.");
  }
}

auth = getAuth(app);

const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  try {
    if (typeof window !== 'undefined') {
      console.log("Attempting Google Sign-In. SDK Auth Domain:", auth.config.authDomain, "Current Hostname:", window.location.hostname);
    }
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    console.error("Error during Google sign-in (raw):", error); // Log the raw error object
    
    if (error.code === 'auth/unauthorized-domain') {
        const currentHostname = typeof window !== 'undefined' ? window.location.hostname : 'UNKNOWN_HOSTNAME (not in browser)';
        const detailedMessage = `FIREBASE AUTH ERROR: The domain '${currentHostname}' is not authorized for your Firebase project ('${firebaseConfig.projectId}'). 
        
To fix this:
1. Go to your Firebase Console.
2. Select project: '${firebaseConfig.projectId}'.
3. Navigate to 'Authentication' > 'Sign-in method' tab.
4. Scroll to 'Authorized domains' and click 'Add domain'.
5. Add this exact domain: ${currentHostname}

This is a Firebase project configuration issue, not an application code bug.`;
        console.error(detailedMessage); // Log detailed message to console
        throw new Error(detailedMessage); // Throw new error with detailed message for UI
    }
    // For other errors, throw a generic message or the original one
    throw new Error(error.message || 'An unexpected error occurred during sign-in.');
  }
};

export const signOut = async () => {
  try {
    await auth.signOut();
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
};

export { app, auth };
