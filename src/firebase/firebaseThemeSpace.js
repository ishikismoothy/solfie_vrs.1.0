import {
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,//For multiple docs
    addDoc,
    updateDoc,
    deleteDoc,
    query, where, //orderBy,
    //writeBatch,
    serverTimestamp,
    increment,
    arrayUnion
} from 'firebase/firestore';
import { db } from './firebaseInit';
import store from '@/store'; // Import your Vuex store
import { mindspaceService } from '@/firebase/firebaseMindSpace';

const themesCollection = collection(db, 'themes');

export const themeService = {
    async getUserThemeId (userId) {
        try {
            const userDoc = await getDoc(doc(db, 'users', userId));
              
              if (!userDoc.exists()) {
                throw new Error('User document not found');
              }
              
              const userData = userDoc.data();
              const focusThemeId = userData.focusTheme;
              
              if (!focusThemeId) {
                throw new Error('No focus theme set for user');
              }
              return focusThemeId;
        } catch (error) {
            console.error('Error loading user theme data:', error);
            return error.message;
        }
    },
    
    async changeUserThemeId (userId, themeId) {
      try {
        console.log('[changeUserThemeId/firebaseMindSpace.js] Starting update...');
        if (!userId) {
          throw new Error('User ID is not set');
        }
    
        const userRef = doc(db, 'users', userId);
        
        await updateDoc(userRef, 
          {
            focusTheme: themeId
          }
        );
        
        console.log('[updateMindSpaceInFirestore] Successfully updated mindspace');
        
        return {
          message: "successfully updated focus theme.",
          success: true,
        };
    
      } catch (error) {
        return {
          message: error.message,
          success: false,
        };
        
      }
    },

    // Get all themes for current user
    async getThemes(uid) {
        try {
            //console.log("[getThemes/firebaseThemeSpace.js] Starting theme fetch for uid:", uid);
            
            // First, get the user's theme order
            const userRef = doc(db, 'users', uid);
            const userDoc = await getDoc(userRef);
            const themeOrder = userDoc.data()?.themeOrder || [];
            
            //console.log("[getThemes] Theme order from user document:", themeOrder.length);
    
            // Get all themes for the user
            const q = query(
                themesCollection,
                where('uid', '==', uid)
            );
            
            const snapshot = await getDocs(q);
            let themes = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
    
            //console.log("[getThemes] Raw themes before ordering:", themes);
    
            if (themeOrder.length > 0) {
                // Create a map for quick theme lookup
                const themesMap = new Map(themes.map(theme => [theme.id, theme]));
                
                // First, get all themes that are in the order array
                const orderedThemes = themeOrder
                    .map(id => themesMap.get(id))
                    .filter(theme => theme); // Remove any undefined entries
                
                // Then get any remaining themes that aren't in the order array
                const remainingThemes = themes.filter(theme => !themeOrder.includes(theme.id));
                
                // Combine ordered themes with any remaining themes
                themes = [...orderedThemes, ...remainingThemes];
                
                console.log("[getThemes] Themes after ordering:", themes);
            } else {
                // If no order is specified, fall back to updatedAt ordering
                themes.sort((a, b) => {
                    const dateA = new Date(a.updatedAt);
                    const dateB = new Date(b.updatedAt);
                    return dateB - dateA;
                });
            }
    
            return themes;
    
        } catch (error) {
            console.error('[getThemes/firebaseThemeSpace.js] Error:', error);
            throw error;
        }
    },

    // Get specific Theme data.
    async getThemeData (themeId) {
        const themeRef = doc(db, 'themes', themeId);
        const themeDoc = await getDoc(themeRef);
      
        if (!themeDoc.exists()) {
          throw new Error ('Theme not found');
        }
      
        const themeData = themeDoc.data();
      
        //console.log("[getThemeData]",themeData);
      
        return themeData;
    },

    // Add new theme
    async addTheme(themeData, uid) {
        if (!uid) throw new Error('User not authenticated');
    
        try {
            const themeDocData = {
                name: themeData.name,         // This is the combinedValue
                hashtags: themeData.hashtags,
                uid: uid,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                defaultMindSpace: '',
                records: [],
            };
        
            const docRef = await addDoc(themesCollection, themeDocData);


            const result = await mindspaceService.createMindspace({
                uid, 
                themeId: docRef.id, 
                name: 'welcome to solfie!',
                privacy: false
            });
            if(result.success) {
                console.log("[addTheme/firebaseThemeSpace.js] Successfully created first mind space.");

                await mindspaceService.setDefaultMindspace(docRef.id, result.mindspaceId);
            }else{
                console.log("[addTheme/firebaseThemeSpace.js] ", result.error);
            }

            
            // 2. Update hashtag counts in a separate collection
            for (const tag of themeData.hashtags) {
                // Query to find if hashtag exists (by tag field, not by ID)
                const hashtagQuery = query(collection(db, 'hashtags'), where('tag', '==', tag));
                const querySnapshot = await getDocs(hashtagQuery);

                if (!querySnapshot.empty) {
                    // Update existing hashtag
                    const hashtagDoc = querySnapshot.docs[0];
                    await updateDoc(hashtagDoc.ref, {
                        count: increment(1),
                        lastUsed: serverTimestamp(),
                        themes: arrayUnion(docRef.id)
                    });
                } else {
                    // Create new hashtag
                    await addDoc(collection(db, 'hashtags'), {
                        tag: tag,
                        count: 1,
                        lastUsed: serverTimestamp(),
                        themes: [docRef.id]
                    });
                }
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
    async updateThemeOrder(themes) {
        const userId = store.state.user.user.uid;
        // Validate userId before proceeding
        if (!userId) {
            throw new Error('User ID is not available. Please ensure user is logged in.');
        }

        try {
            // Extract just the IDs from theme objects
            const themeIds = themes.map(theme => theme.id);
            
            // First, get current user data to check account type
            const userRef = doc(db, 'users', userId);
            const userDoc = await getDoc(userRef);
            
            if (!userDoc.exists()) {
                throw new Error('User document not found');
            }
            
            const userData = userDoc.data();
            const accountPlan = userData.accountPlan || 'Basic';
            
            // Determine max active themes based on account type
            const maxActiveThemes = accountPlan === 'Premium' ? 3 : 1;
            const activeThemes = themeIds.slice(0, maxActiveThemes);
            
            // Always update both fields - this handles account downgrades properly
            await updateDoc(userRef, {
                themeOrder: themeIds,
                activeTheme: activeThemes,
                updatedAt: new Date().toISOString()
            });
            
            console.log('[updateThemeOrder] User ID:', userId);
            console.log('[updateThemeOrder] Updated theme order:', themeIds);
            console.log(`[updateThemeOrder] Account type: ${accountPlan}, Max active themes: ${maxActiveThemes}`);
            console.log('[updateThemeOrder] Updated active themes:', activeThemes);
            
        } catch (error) {
            console.error('Error updating user theme order:', error);
            throw error;
        }
    },
    /* Update theme
    async updateThemeOrder(themes) {
        const userId = store.state.user.user.userId;
        try {
            // Extract just the IDs from theme objects
            const themeIds = themes.map(theme => theme.id);
            
            const userRef = doc(db, 'users', userId);
            
            await updateDoc(userRef, {
                themeOrder: themeIds,
                updatedAt: new Date().toISOString()
            });
            
            console.log('[updateThemeOrder] Updated theme order:', themeIds);
        } catch (error) {
            console.error('Error updating user theme order:', error);
            throw error;
        }
    },*/

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
    async deleteTheme(uid, id) {
        if (!uid) throw new Error('User not authenticated');
    
        try {
            const themeRef = doc(db, 'themes', id);
            const themeDoc = await getDoc(themeRef);
    
            if (!themeDoc.exists()) {
                throw new Error('Theme not found');
            }
    
            const themeData = themeDoc.data();
            const hashtags = themeData.hashtags || [];
            
            console.log('[DeleteTheme] Starting deletion process for theme:', id);
            console.log('[DeleteTheme] Hashtags to process:', hashtags);
    
            // Update hashtags
            for (const tag of hashtags) {
                // Query to find hashtag document by tag field
                const hashtagQuery = query(collection(db, 'hashtags'), where('tag', '==', tag));
                const querySnapshot = await getDocs(hashtagQuery);
    
                if (!querySnapshot.empty) {
                    const hashtagDoc = querySnapshot.docs[0];
                    const hashtagData = hashtagDoc.data();
                    console.log('[DeleteTheme] Found hashtag document:', hashtagData);
    
                    const newThemes = hashtagData.themes.filter(themeId => themeId !== id);
                    
                    if (hashtagData.count <= 1 || newThemes.length === 0) {
                        // Delete the hashtag document
                        console.log('[DeleteTheme] Deleting hashtag document');
                        await deleteDoc(hashtagDoc.ref);
                    } else {
                        // Update the hashtag document
                        console.log('[DeleteTheme] Updating hashtag document');
                        await updateDoc(hashtagDoc.ref, {
                            count: increment(-1),
                            themes: newThemes
                        });
                    }
                }
            }
    
            // Delete the theme
            await deleteDoc(themeRef);
            return id;
    
        } catch (error) {
            console.error('[DeleteTheme] Error:', error);
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
    },

    async updateAssessment(themeId, assessmentValue, assessmentType = 'selfAssessment') {
        if (!themeId) {
            throw new Error('Theme ID is required');
        }
        
        const userId = store.state.mindspace.userId;
        if (!userId) {
            throw new Error('User not authenticated');
        }
        
        // Validate assessment type
        if (!['selfAssessment', 'aiAssessment'].includes(assessmentType)) {
            throw new Error('Invalid assessment type');
        }
        
        // Ensure we have a raw number value
        const rawValue = Number(assessmentValue);
        
        // Validate assessment value
        if (rawValue < 0 || rawValue > 5 || isNaN(rawValue)) {
            throw new Error('Assessment value must be between 0 and 5');
        }
    
        try {
            const themeRef = doc(db, 'themes', themeId.toString());
            
            // Create new assessment record
            const newAssessment = {
                value: rawValue,
                timestamp: new Date().toISOString()
            };
    
            // First check if the document exists and get its current data
            const themeDoc = await getDoc(themeRef);
            if (!themeDoc.exists()) {
                throw new Error('Theme document not found');
            }
    
            const themeData = themeDoc.data();
            
            // Initialize the update object
            let updateObject = {
                updatedAt: new Date().toISOString()
            };
    
            // If assessment field doesn't exist, create the full structure
            if (!themeData.assessment) {
                updateObject.assessment = {
                    selfAssessment: [],
                    aiAssessment: []
                };
            }
    
            // Use set with merge to ensure the structure exists, then update the array
            await setDoc(themeRef, updateObject, { merge: true });
            
            // Now we can safely use arrayUnion
            await updateDoc(themeRef, {
                [`assessment.${assessmentType}`]: arrayUnion(newAssessment)
            });
    
            return {
                id: themeId,
                type: assessmentType,
                newAssessment,
                uid: userId
            };
        } catch (error) {
            console.error('Error updating assessment:', error);
            throw error;
        }
    },
    async  getLatestAssessment(themeId, assessmentType = 'selfAssessment') {
        if (!themeId) {
            throw new Error('Theme ID is required');
        }
    
        try {
            const themeRef = doc(db, 'themes', themeId.toString());
            const themeDoc = await getDoc(themeRef);
    
            if (!themeDoc.exists()) {
                throw new Error('Theme document not found');
            }
    
            const data = themeDoc.data();
            
            // Check if assessment and the specified type exist
            if (!data.assessment || !data.assessment[assessmentType]) {
                return null;
            }
    
            const assessments = data.assessment[assessmentType];
            
            // If there are no assessments, return null
            if (!assessments.length) {
                return null;
            }
    
            // Sort by timestamp in descending order and get the first item
            return assessments.sort((a, b) => 
                new Date(b.timestamp) - new Date(a.timestamp)
            )[0];
        } catch (error) {
            console.error('Error getting latest assessment:', error);
            throw error;
        }
    }
};


//Hashtag usage
/*
// Function to get trending hashtags
async function getTrendingHashtags() {
  return await db.collection('hashtags')
    .orderBy('count.last24h', 'desc')
    .limit(10)
    .get();
}

// Function to get posts by hashtag
async function getPostsByHashtag(hashtag) {
  return await db.collection('themes')
    .where('hashtags', 'array-contains', hashtag)
    .orderBy('createdAt', 'desc')
    .limit(20)
    .get();
}

// Function to update daily hashtag stats
async function updateDailyHashtagStats(hashtag) {
  const today = new Date().toISOString().split('T')[0];
  const statsRef = db.collection('hashtag_stats').doc(today);
  
  await statsRef.set({
    tags: {
      [hashtag]: firebase.firestore.FieldValue.increment(1)
    }
  }, { merge: true });
}
*/