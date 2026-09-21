"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  User,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  isMockUser: boolean;
  enableGuestMode: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMockUser, setIsMockUser] = useState(false);

  useEffect(() => {
    // Check local storage for mock guest session
    const savedGuest = localStorage.getItem("crabbytab_guest_user");
    if (savedGuest) {
      setUser(JSON.parse(savedGuest));
      setIsMockUser(true);
      setLoading(false);
      return;
    }

    try {
      if (auth && typeof auth.onAuthStateChanged === "function") {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
          if (firebaseUser) {
            setUser(firebaseUser);
            setIsMockUser(false);
          } else {
            // Default to local tab master user so the app is immediately usable
            const localMaster = {
              uid: "tab-director-local",
              email: "tabdirector@tournament.org",
              displayName: "Tab Director",
            } as User;
            setUser(localMaster);
            setIsMockUser(true);
          }
          setLoading(false);
        });
        return () => unsubscribe();
      } else {
        // Fallback for offline mode
        const localMaster = {
          uid: "tab-director-local",
          email: "tabdirector@tournament.org",
          displayName: "Tab Director",
        } as User;
        setUser(localMaster);
        setIsMockUser(true);
        setLoading(false);
      }
    } catch (e) {
      console.warn("Auth initialization fallback:", e);
      setLoading(false);
    }
  }, []);

  const signInWithGoogle = async () => {
    if (auth && auth.name) {
      await signInWithPopup(auth, googleProvider);
    } else {
      enableGuestMode();
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    if (auth && auth.name) {
      await signInWithEmailAndPassword(auth, email, pass);
    } else {
      enableGuestMode();
    }
  };

  const signUpWithEmail = async (email: string, pass: string) => {
    if (auth && auth.name) {
      await createUserWithEmailAndPassword(auth, email, pass);
    } else {
      enableGuestMode();
    }
  };

  const logout = async () => {
    localStorage.removeItem("crabbytab_guest_user");
    if (auth && auth.name) {
      await signOut(auth);
    }
    setUser(null);
  };

  const enableGuestMode = () => {
    const guest = {
      uid: `guest-${Date.now()}`,
      email: "director@tabbycat.local",
      displayName: "Tab Master",
    } as User;
    localStorage.setItem("crabbytab_guest_user", JSON.stringify(guest));
    setUser(guest);
    setIsMockUser(true);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        logout,
        isMockUser,
        enableGuestMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
