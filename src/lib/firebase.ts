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

let app: FirebaseApp;
let auth: Auth;

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

auth = getAuth(app);

const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    // const credential = GoogleAuthProvider.credentialFromResult(result);
    // const token = credential?.accessToken;
    // const user = result.user;
    return result.user;
  } catch (error) {
    console.error("Error during Google sign-in:", error);
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
