import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

export const AUTHORIZED_ADMIN_EMAILS = ['teleahmad768@gmail.com', 'hkwpro@gmail.com'];

interface AuthActionResult {
  ok: boolean;
  error?: string;
  needsConsoleSetup?: boolean;
}

interface AdminAuthContextValue {
  user: FirebaseUser | null;
  authLoading: boolean;
  isAdmin: boolean;
  signInWithGoogle: () => Promise<AuthActionResult>;
  signInWithPassword: (email: string, password: string) => Promise<AuthActionResult>;
  signOutAdmin: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  const isAdmin = Boolean(
    user?.email && AUTHORIZED_ADMIN_EMAILS.includes(user.email.toLowerCase()),
  );

  const signInWithGoogle = useCallback(async (): Promise<AuthActionResult> => {
    try {
      await signInWithPopup(auth, googleProvider);
      return { ok: true };
    } catch (err: any) {
      const code = String(err?.code || '');
      if (code === 'auth/popup-closed-by-user') {
        return { ok: false, error: 'Google sign-in popup was closed.' };
      }
      return {
        ok: false,
        error: 'Google Sign-In failed. Check popup permissions or try Email & Password below.',
      };
    }
  }, []);

  const signInWithPassword = useCallback(
    async (email: string, password: string): Promise<AuthActionResult> => {
      const normalizedEmail = email.trim().toLowerCase();
      if (!normalizedEmail || !password) {
        return { ok: false, error: 'Please enter both admin email and password.' };
      }
      if (!AUTHORIZED_ADMIN_EMAILS.includes(normalizedEmail)) {
        return {
          ok: false,
          error:
            'Only authorized admin emails ending with pro@gmail.com or 768@gmail.com can sign in.',
        };
      }

      try {
        await signInWithEmailAndPassword(auth, normalizedEmail, password);
        return { ok: true };
      } catch (err: any) {
        const code = String(err?.code || '');
        if (code === 'auth/operation-not-allowed') {
          return {
            ok: false,
            needsConsoleSetup: true,
            error:
              'Email/Password login is not enabled yet in Firebase Console. Go to Firebase Console -> Authentication -> Sign-in method -> enable Email/Password, and add your two admin emails under Users.',
          };
        }
        if (
          code === 'auth/user-not-found' ||
          code === 'auth/invalid-credential' ||
          code === 'auth/wrong-password'
        ) {
          return {
            ok: false,
            needsConsoleSetup: true,
            error:
              'Invalid email/password, or this email has not been added under Firebase Console -> Authentication -> Users yet. You can also sign in right away using Google Sign-In.',
          };
        }
        if (code === 'auth/too-many-requests') {
          return {
            ok: false,
            error: 'Too many failed attempts. Please wait a minute or use Google Sign-In.',
          };
        }
        return {
          ok: false,
          error: err?.message || 'Password sign-in failed. Please try again.',
        };
      }
    },
    [],
  );

  const signOutAdmin = useCallback(async () => {
    await signOut(auth);
  }, []);

  return (
    <AdminAuthContext.Provider
      value={{
        user,
        authLoading,
        isAdmin,
        signInWithGoogle,
        signInWithPassword,
        signOutAdmin,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) {
    throw new Error('useAdminAuth must be used inside AdminAuthProvider');
  }
  return ctx;
}
