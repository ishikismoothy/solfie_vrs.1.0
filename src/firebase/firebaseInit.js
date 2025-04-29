// src/firebase/firebaseInit.js

import { initializeApp } from 'firebase/app';
import { getAuth,connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.VUE_APP_FIREBASE_API_KEY,
  authDomain: "solfie-398005.firebaseapp.com",
  projectId: "solfie-398005",
  storageBucket: "solfie-398005.appspot.com",
  messagingSenderId: "682411258127",
  appId: "1:682411258127:web:a881faddedf6e7db0f0e7a",
  measurementId: "G-CWK4FRNC7S"
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
console.log('Firebase Initialized:', firebaseApp);


// Initialize Firebase Authentication and get a reference to the service
const auth = getAuth(firebaseApp);

// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(firebaseApp);

// Initialize Firebase Storage and get a reference to the service
const storage = getStorage(firebaseApp);

// Connect to Firestore emulator (only for local development)
if (window.location.hostname === 'localhost') {
  // Firestore Emulator
  connectFirestoreEmulator(db, '127.0.0.1', 8081);
  console.log('Firestore Emulator Connected');
  // Auth Emulator
  connectAuthEmulator(auth, 'http://127.0.0.1:9099'); // Ensure this matches your emulator's port
  console.log('Auth Emulator Connected');
  // Storage Emulator
  connectStorageEmulator(storage, '127.0.0.1', 9199);
  console.log('Storage Emulator Connected');
} else {
  // Production setup
  console.log('Using Production Firebase services');
}


export { firebaseApp, auth, db, storage };
