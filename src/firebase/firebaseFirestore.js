// src/firebase/firebaseFirestore.js

import {
    doc,
    setDoc,
    getDoc,
    updateDoc,
    deleteDoc
  } from 'firebase/firestore';
  import { db } from './firebaseInit';

  export const createUserDocument = (uid, data) => {
    const defaultData = {
      name: 'John Doe',
      email: data.email,
      dateOfBirth: 'None',
      // Add more default fields if needed
    };
    return setDoc(doc(db, 'users', uid), { ...defaultData, ...data });
  };

  export const getUserDocument = (uid) => {
    return getDoc(doc(db, 'users', uid));
  };

  export const updateUserDocument = (uid, data) => {
    return updateDoc(doc(db, 'users', uid), data);
  };

  export const deleteUserDocument = (uid) => {
    return deleteDoc(doc(db, 'users', uid));
  };

  //===[HANDLING USER SETTINGS]===
  //Update only "ONE" setting
  export const updateUserSettings = async (uid, category, key, value) => {
    try {
      const settingsRef = doc(db, 'users', uid, 'settings', category);
      await setDoc(settingsRef, { [key]: value }, { merge: true });
      console.log(`Successfully updated ${key} in ${category} for user ${uid}`);
    } catch (error) {
      console.error("Error updating document:", error);
      throw error;
    }
  };

  //EXAMPLES
  //updateUserSettings("userId123", "AI-Setting", "birthday", "1994/02/09");
  //Settings-accountInfo: Birthday, Avator-icon, cover-image,

  //updateUserSettings("userId123", "AI-Setting", "birthday", "1994/02/09");
  //Settings-accountInfo: Birthday, Avator-icon, cover-image,
  //

  //updateUserSettings("userId123", "AI-Setting", "personality", "0(ツンデレ)");
  //Settings-AI-Settings: AI-personality
  //

  //updateUserSettings("userId123", "preferences", "theme", "light");
  //Settings-Preferences:

  //updateUserSettings("userId123", "privacy", "lastSeen", "noOne");
  //Settings-privacy: CommunityVisivility, Show-birthday, Show-profile, Show-posts

  export const getUserSettings = async (uid, category) => {
    try {
      const settingsRef = doc(db, 'users', uid, 'settings', category);
      const settingsSnap = await getDoc(settingsRef);

      if (settingsSnap.exists()) {
        return settingsSnap.data();
      } else {
        console.log("No such document!");
        return null;
      }
    } catch (error) {
      console.error("Error getting document:", error);
      throw error;
    }
  };

  //
  export const updateUserAnalysis = async (uid, category, key, value) => {
    try {
      const settingsRef = doc(db, 'users', uid, 'analysisHistory', category);
      await setDoc(settingsRef, { [key]: value }, { merge: true });
      console.log(`Successfully updated ${key} in ${category} for user ${uid}`);
    } catch (error) {
      console.error("Error updating document:", error);
      throw error;
    }
  };

  // Add more Firestore operations as needed
