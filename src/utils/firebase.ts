/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut,
  Auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  Firestore,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyC5tFwl0muWgXIWKpg8XlWo-xJ5aZgGow8",
  authDomain: "claro-9ceb1.firebaseapp.com",
  projectId: "claro-9ceb1",
  storageBucket: "claro-9ceb1.firebasestorage.app",
  messagingSenderId: "248419128045",
  appId: "1:248419128045:web:fb38e9a4d42d461fdef2e4",
  measurementId: "G-B8Y01TY8GD"
};

// Initialize app only once
const app = initializeApp(FIREBASE_CONFIG);
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

/**
 * Sign in with Google Popup
 */
export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (err: any) {
    if (err.code !== 'auth/popup-closed-by-user') {
      throw err;
    }
    return null;
  }
}

/**
 * Sign out of Firebase
 */
export async function logOut() {
  await signOut(auth);
}

/**
 * Sign in with Email & Password
 */
export async function signInWithEmail(email: string, pass: string) {
  const result = await signInWithEmailAndPassword(auth, email, pass);
  return result.user;
}

/**
 * Sign up/Register with Email, Password & Name
 */
export async function signUpWithEmail(email: string, pass: string, name: string) {
  const result = await createUserWithEmailAndPassword(auth, email, pass);
  if (result.user) {
    await updateProfile(result.user, { displayName: name });
  }
  return result.user;
}

/**
 * Recursively strip undefined properties from an object so Firestore setDoc does not throw an error.
 */
function sanitizeData(val: any): any {
  if (val === undefined) return null;
  if (val === null) return null;
  if (Array.isArray(val)) {
    return val.map(item => sanitizeData(item));
  }
  if (typeof val === 'object') {
    const cleaned: any = {};
    for (const key of Object.keys(val)) {
      const v = val[key];
      if (v !== undefined) {
        cleaned[key] = sanitizeData(v);
      }
    }
    return cleaned;
  }
  return val;
}

/**
 * Persist whole user state to Firestore safely
 */
export async function saveUserStateToFirestore(userId: string, data: any) {
  try {
    const sanitized = sanitizeData(data);
    const userDocRef = doc(db, 'users', userId);
    await setDoc(userDocRef, {
      ...sanitized,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    console.error('Failed to save to Firestore:', error);
  }
}

/**
 * Retrieve whole user state from Firestore
 */
export async function getUserStateFromFirestore(userId: string) {
  try {
    const userDocRef = doc(db, 'users', userId);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      return snap.data();
    }
  } catch (error) {
    console.error('Failed to retrieve from Firestore:', error);
  }
  return null;
}

/**
 * Subscribe to whole user state in real-time.
 * This is what enables instant multi-device sync.
 */
export function subscribeUserStateFromFirestore(
  userId: string,
  onData: (data: any | null) => void,
  onError?: (err: any) => void
): Unsubscribe {
  const userDocRef = doc(db, 'users', userId);

  return onSnapshot(
    userDocRef,
    (snap) => {
      if (snap.exists()) {
        onData(snap.data());
      } else {
        onData(null);
      }
    },
    (err) => {
      console.error('Failed to subscribe to Firestore user state:', err);
      onError?.(err);
      onData(null);
    }
  );
}

