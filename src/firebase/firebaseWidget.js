import {
    collection,
    setDoc,doc,getDoc,getDocs,//For multiple docs
    updateDoc,
    query, where, orderBy,
  
} from 'firebase/firestore';
import { db } from './firebaseInit';
import { formatTimestampToDateInString } from '@/utility/dateUtils';

export const widgetService = {
    async getWidget(widgetId) {
        try {
            const widgetDoc = await getDoc(doc(db, 'widgets', widgetId));
        if (!widgetDoc.exists()) {
            throw new Error(`Widget ${widgetId} not found`);
        }
        return {
            id: widgetDoc.id,
            ...widgetDoc.data()
        };
        } catch (error) {
            console.error('Error fetching widget:', error);
        throw error;
        }
    },
    async getWidgets() {
        const widgetsArray = [];
  
        try {
            // Get reference to the widgets collection
            const widgetsCollectionRef = collection(db, "widgets");
            
            // Create a query with isVisible filter and descending order (highest index first)
            const q = query(
                widgetsCollectionRef, 
                where("isVisible", "==", true),
                orderBy("index", "desc")
            );
            
            // Get documents from the collection with the query
            const querySnapshot = await getDocs(q);
            
            // Loop through each document and add it to the array
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                
                // Format the createdAt timestamp if it exists
                let formattedData = { ...data };
                
                if (data.createdAt) {
                    formattedData.createdAt = formatTimestampToDateInString(data.createdAt);
                }
                
                // Add the document data along with its ID to the array
                widgetsArray.push({
                id: doc.id,
                ...formattedData // Use the modified data with formatted date
                });
            });
            
            //console.log("Widgets retrieved successfully:", widgetsArray);
            return widgetsArray;
        } catch (error) {
          console.error("Error getting widgets:", error);
          throw error;
        }
    },
    async getMultipleWidgets(widgetIds) {
        try {
        const promises = widgetIds.map(id => this.getWidget(id));
        return await Promise.all(promises);
        } catch (error) {
        console.error('Error fetching multiple widgets:', error);
        throw error;
        }
    },
    async getUsersWidgets(uid) {
        try {
            // Using different variable names to avoid conflict
            const userRef = doc(db, 'users', uid);
            const userDoc = await getDoc(userRef);
    
            if (!userDoc.exists()) {
                throw new Error('User not found');
            }
    
            const data = userDoc.data();
    
            // If usersWidgets doesn't exist, create it with an empty array
            if (!data.usersWidgets) {
                await setDoc(userRef, {
                    usersWidgets: []
                }, { merge: true }); // Use merge: true to only update this field
                
                return []; // Return the empty array we just created
            }
            
            //console.log("User's Widgets retrieved successfully:", data.usersWidgets);
            return data.usersWidgets;
        } catch (error) {
            console.error("Error getting user widgets:", error);
            return null;
        }
    },
    async addUsersWidgets(uid, widgetId) {
        try {
            // Get reference to the user document
            const userRef = doc(db, 'users', uid);
            
            // Get the current user document
            const userDoc = await getDoc(userRef);
            
            if (!userDoc.exists()) {
                throw new Error('User not found');
            }
            
            const userData = userDoc.data();
            
            // Initialize usersWidgets as an empty array if it doesn't exist
            let currentWidgets = [];
            if (userData.usersWidgets) {
                currentWidgets = [...userData.usersWidgets];
            }
            
            // Get the widget document to check for childWidget
            const widgetRef = doc(db, 'widgets', widgetId);
            const widgetDoc = await getDoc(widgetRef);
            
            let widgetsToAdd = [widgetId]; // Start with the parent widget
            
            // Check if widget has a childWidget field and add it to the list
            if (widgetDoc.exists()) {
                const widgetData = widgetDoc.data();
                if (widgetData.childWidget) {
                    widgetsToAdd.push(widgetData.childWidget);
                }
            }
            
            // Add widgets that aren't already in the array
            let addedWidgets = [];
            for (const widget of widgetsToAdd) {
                if (!currentWidgets.includes(widget)) {
                    currentWidgets.push(widget);
                    addedWidgets.push(widget);
                }
            }
            
            // Only update if we actually added new widgets
            if (addedWidgets.length > 0) {
                // Use setDoc with merge option to create the field if it doesn't exist
                await setDoc(userRef, {
                    usersWidgets: currentWidgets
                }, { merge: true });
                
                console.log(`Widgets ${addedWidgets.join(', ')} added to user ${uid}`);
                return currentWidgets;
            } else {
                console.log(`All widgets already exist for user ${uid}`);
                return currentWidgets;
            }
        } catch (error) {
            console.error("Error adding widget to user:", error);
            throw error;
        }
    },

    async removeUsersWidgets(uid, widgetId) {
        try {
            // Get reference to the user document
            const userRef = doc(db, 'users', uid);
            
            // Get the current user document
            const userDoc = await getDoc(userRef);
            
            if (!userDoc.exists()) {
                throw new Error('User not found');
            }
            
            const userData = userDoc.data();
            
            // Get current widgets array or initialize empty array
            let currentWidgets = userData.usersWidgets || [];
            
            // Get the widget document to check for childWidget
            const widgetRef = doc(db, 'widgets', widgetId);
            const widgetDoc = await getDoc(widgetRef);
            
            let widgetsToRemove = [widgetId]; // Start with the parent widget
            
            // Check if widget has a childWidget field and add it to the removal list
            if (widgetDoc.exists()) {
                const widgetData = widgetDoc.data();
                if (widgetData.childWidget) {
                    widgetsToRemove.push(widgetData.childWidget);
                }
            }
            
            // Remove all widgets in the removal list
            const updatedWidgets = currentWidgets.filter(id => !widgetsToRemove.includes(id));
            
            // Check if any widgets were actually removed
            const removedWidgets = widgetsToRemove.filter(widget => currentWidgets.includes(widget));
            
            // Only update if widgets were actually removed
            if (removedWidgets.length > 0) {
                // Update the user document with the new array
                await updateDoc(userRef, {
                    usersWidgets: updatedWidgets
                });
                
                console.log(`Widgets ${removedWidgets.join(', ')} removed from user ${uid}`);
                return updatedWidgets;
            } else {
                console.log(`No widgets were removed for user ${uid}`);
                return currentWidgets;
            }
        } catch (error) {
            console.error("Error removing widget from user:", error);
            throw error;
        }
    },
    async getWidgetById(widgetId) {
        try {
          // Get reference to the specific document directly
          const widgetDocRef = doc(db, "widgets", widgetId);
          
          // Get the document
          const docSnap = await getDoc(widgetDocRef);
          
          // Check if document exists
          if (docSnap.exists()) {
            const data = docSnap.data();
            
            // Format the createdAt timestamp if it exists
            let formattedData = { ...data };
            
            if (data.createdAt) {
              formattedData.createdAt = formatTimestampToDateInString(data.createdAt);
            }
            
            // Return the document data along with its ID
            return {
              id: docSnap.id,
              ...formattedData
            };
          } else {
            // Document doesn't exist
            console.log("No widget found with ID:", widgetId);
            return null;
          }
        } catch (error) {
          console.error("Error getting widget by ID:", error);
          throw error;
        }
    },
}