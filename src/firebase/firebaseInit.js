// src/firebase/firebaseInit.js

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

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

export { firebaseApp, auth, db };
