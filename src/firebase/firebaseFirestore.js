// src/firebase/firebaseFirestore.js

import {
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,//For multiple docs
    updateDoc,
    deleteDoc
  } from 'firebase/firestore';
  import { db } from './firebaseInit';

  export const getUsersCollections = async () => {
      console.log('Start Fetching users...');
      let users;
      try {
          const querySnapshot = await getDocs(collection(db, 'users'));
          users = querySnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
          }));
          console.log('Fetched users:', users);
          return users;
      } catch (err) {
          console.error('Error fetching users:', err);
      }
  };

  export const createUserDocument = (uid, data) => {
    const defaultData = {
      name: 'John Doe',
      email: data.email,
      dateOfBirth: 'None',
      viewHistory: {},
      mindspace: "",
      theme: "NYf"
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

  export const updateViewThemeHistory = async (uid, themeId) => {
    try {
      const userRef = doc(db, 'users', uid);
      const userRefSnap = await getDoc(userRef);

      if (!userRefSnap.exists()) {
        throw new Error('User document not found');
      }

      const userData = userRefSnap.data();
      const existingViewHistory = userData.viewHistory || {};

      await updateDoc(userRef, {
        viewHistory: {
          ...existingViewHistory,  // Preserve existing fields
          theme: themeId          // Update theme
        }
      });
      return { message: "successful." };

    } catch (error) {
      console.error("Error updating view history:", error);
      throw error;
    }
  };

  export const updateViewMindspaceHistory = async (uid, mindSpaceId) => {
    try {
      const userRef = doc(db, 'users', uid);
      const userRefSnap = await getDoc(userRef);

      if (!userRefSnap.exists()) {
        throw new Error('User document not found');
      }

      const userData = userRefSnap.data();
      const existingViewHistory = userData.viewHistory || {};

      await updateDoc(userRef, {
        viewHistory: {
          ...existingViewHistory,    // Preserve existing fields
          mindspace: mindSpaceId    // Update mindspace
        }
      });
      return { message: "successful." };

    } catch (error) {
      console.error("Error updating view history:", error);
      throw error;
    }
  };

  export const loadViewHistory = async (uid) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (!userDoc.exists()) {
        throw new Error('User document not found');
      }

      const userData = userDoc.data();
      const viewHistoryData = userData.viewHistory;

      if (!viewHistoryData) {
        return null;
      } else {
        return viewHistoryData;
      }
    } catch (error) {
      console.error("Error loading view history:", error);
      throw error;
    }
  };
