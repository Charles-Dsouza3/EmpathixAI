import { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { auth, googleProvider } from "../firebase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  const signInWithGoogle = () => signInWithPopup(auth, googleProvider);

  const signUpWithEmail = (email, password) =>
    createUserWithEmailAndPassword(auth, email, password);

  const signInWithEmail = (email, password) =>
    signInWithEmailAndPassword(auth, email, password);

  const setupRecaptcha = (containerId) => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
        size: "invisible",
      });
    }
    return window.recaptchaVerifier;
  };

  const sendPhoneOtp = async (phoneNumber, containerId) => {
    const verifier = setupRecaptcha(containerId);
    const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, verifier);
    window.confirmationResult = confirmationResult;
    return confirmationResult;
  };

  const confirmPhoneOtp = async (code) => {
    if (!window.confirmationResult) {
      throw new Error("No OTP request in progress. Please request a code first.");
    }
    return window.confirmationResult.confirm(code);
  };

  const signOut = () => firebaseSignOut(auth);

  const getIdToken = async () => {
    if (!auth.currentUser) return null;
    return auth.currentUser.getIdToken();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithGoogle,
        signUpWithEmail,
        signInWithEmail,
        sendPhoneOtp,
        confirmPhoneOtp,
        signOut,
        getIdToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}