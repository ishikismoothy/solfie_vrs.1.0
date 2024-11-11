import {
    collection,
    doc,
    //setDoc,
    //getDoc,
    getDocs,//For multiple docs
    addDoc,
    updateDoc,
    deleteDoc,
    query, where, orderBy,
    serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebaseInit';
import store from '@/store'; // Import your Vuex store
import {
    createMindspace,
    setDefaultMindspace,
  } from '@/firebase/firebaseMindSpace';

const themesCollection = collection(db, 'themes');

export const themeService = {
    // Get all themes for current user
    async getThemes(uid) {
        // First approach - direct check
        try {
            console.log("[getThemes/firebaseThemeSpace.js] === Direct Check Approach ===");
            console.log("[getThemes/firebaseThemeSpace.js] Collection path:", themesCollection.path);
            
            let matchingDocs = [];

            //Matching Process
            console.log("[getThemes/firebaseThemeSpace.js] === Query Approach ===");
            const q = query(
                themesCollection,
                where('uid', '==', uid),
                orderBy('updatedAt', 'desc')
            );
            
            console.log("[getThemes/firebaseThemeSpace.js] Query constraints:", q);
            const snapshot = await getDocs(q);
            
            console.log("[getThemes/firebaseThemeSpace.js] Query results:", {
                totalDocuments: snapshot.size,
                empty: snapshot.empty,
                path: snapshot.query._path
            });

            // Log each document from the query result
            snapshot.forEach(doc => {
                const data = doc.data();
                console.log("[getThemes/firebaseThemeSpace.js] Query matched document:", {
                    id: doc.id,
                    uid: data.uid,
                    data: data
                });
            });

            // Using map to push
            matchingDocs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            console.log("[getThemes/firebaseThemeSpace.js] Matching documents:", {
                count: matchingDocs.length,
                documents: matchingDocs
            });

            return matchingDocs; // Return the results from direct check for now

        } catch (error) {
            console.error('[getThemes/firebaseThemeSpace.js] Error:', error);
            throw error;
        }
    },

    // Add new theme
    async addTheme(themeData, uid) {
        if (!uid) throw new Error('User not authenticated');
    
        try {
            const themeDocData = {
                name: themeData.name,           // This is the combinedValue
                theme: themeData.theme,         // Original theme value
                topic: themeData.topic,         // Original topic value
                uid: uid,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                defaultMindSpace: '',
                records: [],
            };
        
            const docRef = await addDoc(themesCollection, themeDocData);


            const result = await createMindspace({
                uid, 
                themeId: docRef.id, 
                name: 'welcome to solfie!',
                privacy: false
            });
            if(result.success) {
                console.log("[addTheme/firebaseThemeSpace.js] Successfully created first mind space.");

                await setDefaultMindspace(docRef.id, result.mindspaceId);
            }else{
                console.log("[addTheme/firebaseThemeSpace.js] ", result.error);
            }
        
        return {
            id: docRef.id,
            ...themeDocData
        };
        } catch (error) {
        console.error('Error adding theme:', error);
        throw error;
        }
    },
    // Update theme
    async updateTheme(id, themeData) {
        const userId = store.state.mindspace.userId;
        if (!userId) throw new Error('User not authenticated');

        try {
            const themeRef = doc(db, 'themes', id);
            await updateDoc(themeRef, {
                ...themeData,
                updatedAt: new Date().toISOString()
            });
            return {
                id,
                ...themeData,
                uid: userId
            };
        } catch (error) {
            console.error('Error updating theme:', error);
            throw error;
        }
    },

    // Delete theme
    async deleteTheme(id, uid) {
        if (!uid) throw new Error('User not authenticated');

        try {
            const themeRef = doc(db, 'themes', id);
            await deleteDoc(themeRef);
            return id;
        } catch (error) {
            console.error('Error deleting theme:', error);
            throw error;
        }
    },

    // Search themes
    async searchThemes(searchTerm) {
        const userId = store.state.mindspace.userId;
        if (!userId) throw new Error('User not authenticated');

        try {
        // First create a query for user's themes
            const q = query(
                themesCollection,
                where('uid', '==', userId),
                where('name', '>=', searchTerm),
                where('name', '<=', searchTerm + '\uf8ff')
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({
            id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error searching themes:', error);
            throw error;
        }
    }
};