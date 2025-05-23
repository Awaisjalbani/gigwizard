
// src/lib/firebase.ts
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, type Auth } from 'firebase/auth';

// User's Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyDBP4kwaIvDxJ8VbLU-BriqGw7d80fiBz8",
  authDomain: "fiverr-ace.firebaseapp.com",
  projectId: "fiverr-ace",
  storageBucket: "fiverr-ace.firebasestorage.app", // Reverted to user's originally provided value
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
    console.error("Error during Google sign-in:", error.code, error.message);
    if (error.code === 'auth/unauthorized-domain') {
        console.error("FIREBASE AUTH ERROR: The domain " + window.location.hostname + " is not authorized for this Firebase project. Please verify your Firebase console's Authentication -> Sign-in method -> Authorized domains settings. Ensure it includes exactly: " + window.location.hostname);
    }
    throw error;
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
