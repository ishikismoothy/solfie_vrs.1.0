// src/firebase/firebaseAuth.js

import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    sendPasswordResetEmail,  // Add this import
    getAuth,
  } from 'firebase/auth';
import { auth } from './firebaseInit';

export const registerUser = (email, password) => {
  return createUserWithEmailAndPassword(auth, email, password);
};

export const loginUser = async (email, password) => {
  try {
    return await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    console.error("Error in loginUser:", error.message);
    throw error;  // re-throw the error so the component can handle it
  }
};

export const logoutUser = () => {
  return signOut(auth);
};

export const getCurrentUser = () => {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    }, reject);
  });
};

export const onAuthStateChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};


// Add this new function for password reset
export const resetPassword = (email) => {
return sendPasswordResetEmail(auth, email);
};

export const getCurrentUserId = async () => {
  const auth = getAuth();
  const userId = auth.currentUser?.uid;
  
  if (!userId) {
    throw new Error('No user authenticated');
  }

  return userId;
};
