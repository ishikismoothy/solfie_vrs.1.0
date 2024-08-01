// src/firebase/firebaseAuth.js

import { 
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    sendPasswordResetEmail  // Add this import
  } from 'firebase/auth';
import { auth } from './firebaseInit';

export const registerUser = (email, password) => {
  return createUserWithEmailAndPassword(auth, email, password);
};

export const loginUser = (email, password) => {
  return signInWithEmailAndPassword(auth, email, password);
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