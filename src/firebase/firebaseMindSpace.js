//firebaseMindSpace.js
import squareSvg from '@/assets/shapes/square.svg';
import folderSvg from '@/assets/shapes/folder.svg';
import {
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,//For multiple docs
    addDoc,
    updateDoc,
    deleteDoc,
    query, where,
    serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebaseInit';
import { formatMindSpaceForFirestore } from '@/utility/mindSpaceDataFormatter.js'
import { getStorage, ref as storageRef, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
//import { useStore } from 'vuex';
//const store = useStore();

export const mindspaceService = {
  generateRandomId (length = 10) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  },

  async getDefaultMindSpaceId (themeId, uid) {
      try {
          // Get theme document to find defaultMindSpace
          const themeDoc = await getDoc(doc(db, 'themes', themeId));

          if (!themeDoc.exists()) {
            throw new Error('Theme document not found');
          }

          const themeData = themeDoc.data();
          const defaultMindSpaceId = themeData.defaultMindSpace;

          if (!defaultMindSpaceId) {
            //throw new Error('No default mindspace set for theme');
            //create mindspace and set mindspace Id.

            const result = await mindspaceService.createMindspace({
              uid,
              themeId,
              name: 'welcome to solfie!',
              privacy: false
            });
            await mindspaceService.setDefaultMindspace(themeId, result.mindspaceId);
            return result.mindspaceId;
          }else{
            return defaultMindSpaceId;
          }
      } catch (error) {
          console.error('Error loading default mindspace ID:', error);
          return error.message;
      }
  },

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

  async getListOfMindSpace (themeId) {
    //console.log("[getListOfMindSpace] 00 themeId: ",themeId);
    try {
      const mindspacesRef = collection(db, 'mindspace');
      //console.log("[getListOfMindSpace] 01 mindspaceRef: ",mindspacesRef);

      const q = query(mindspacesRef, where('themeId', '==', themeId));

      const querySnapshot = await getDocs(q);
      //console.log("[getListOfMindSpace] querySnapshot size:", querySnapshot.size);

      /*
      querySnapshot.docs.forEach(doc => {
        //console.log("[getListOfMindSpace] doc data:", doc.data());
      });*/

      const mindSpaceList = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
              }));
      //console.log("[firebaseMindSpace.js/getListOfMindSpace] List of MindSpace: ",mindSpaceList);

      return mindSpaceList;
    } catch (error) {
      return [];
    }

  },
  async getMindSpaceData (mindSpaceId) {
      const mindspaceRef = doc(db, 'mindspace', mindSpaceId);
      const mindspaceDoc = await getDoc(mindspaceRef);

      if (!mindspaceDoc.exists()) {
        throw new Error('Mindspace not found');
      }

      const mindspaceData = mindspaceDoc.data();

      // Check if pages exist, if not create and save it
      if (!mindspaceData.pages || !Array.isArray(mindspaceData.pages)) {
        // Create default pages structure with explicit empty items array
        const defaultPages = [{items: []}];

        // Update the document with default pages
        await updateDoc(mindspaceRef, {
          pages: defaultPages
        });

        // Update local mindspaceData
        mindspaceData.pages = defaultPages;
      }

      // 2. Transform the pages data
      const transformedPages = await Promise.all(
        mindspaceData.pages.map(async (page) => {
          // We can now be more confident about the structure, though keeping the fallback for safety
          const pageItems = await Promise.all(
            (page.items || []).map(async (itemId) => {
              // Check if this is a folder ID
              const folderData = mindspaceData.folders?.find(f => f.id === itemId);

              if (folderData) {
                // This is a folder
                const folderItems = await Promise.all(
                  (folderData.items || []).map(async (fItemId) => {
                    const itemDoc = await getDoc(doc(db, 'items', fItemId));
                    const itemData = itemDoc.data();

                    return {
                      id: fItemId,
                      name: itemData.name,
                      shape: itemData.icon || squareSvg,
                      badge: itemData.badge || null
                    };
                  })
                );

                return {
                  id: folderData.id,
                  name: folderData.name,
                  shape: folderData.icon || folderSvg,
                  items: folderItems
                };
              } else {
                // This is a regular item
                const itemDoc = await getDoc(doc(db, 'items', itemId));
                const itemData = itemDoc.data();

                return {
                  id: itemId,
                  name: itemData.name,
                  shape: itemData.icon || squareSvg,
                  badge: itemData.badge || null
                };
              }
            })
          );

          return { items: pageItems };
        })
      );

      return {
        name: mindspaceData.name,
        pages: transformedPages,
        totalPages: transformedPages.length
      };
  },

  async createMindspace ({
    uid,
    themeId,
    name,
    privacy = false
  }) {
    try {
      const mindspaceRef = collection(db, 'mindspace');

      const mindspaceData = {
        uid,
        themeId,
        createdAt: serverTimestamp(),
        updatedAt: null,
        collaborator: [],
        privacy,
        name,
        pages: [{ items: [] }],
        folders: []
      };

      const docRef = await addDoc(mindspaceRef, mindspaceData);

      return {
        success: true,
        mindspaceId: docRef.id,
        data: mindspaceData
      };

    } catch (error) {
      console.error('Error creating mindspace:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  async duplicateMindspace (mindSpaceId) {
    try {
      if (!mindSpaceId) {
        throw new Error('MindSpace ID is required');
      }

      // Get reference to the original document
      const mindspaceRef = doc(db, 'mindspace', mindSpaceId);
      const mindspaceDoc = await getDoc(mindspaceRef);

      if (!mindspaceDoc.exists()) {
        throw new Error('Original mindspace document not found');
      }

      const originalData = mindspaceDoc.data();

      // Function to duplicate an item and return new ID
      const duplicateItem = async (itemId) => {
        const itemRef = doc(db, 'items', itemId);
        const itemDoc = await getDoc(itemRef);

        if (!itemDoc.exists()) {
          throw new Error(`Item ${itemId} not found`);
        }

        const itemData = itemDoc.data();
        const now = new Date();

        // Create new item with same data but new timestamps
        const newItemData = {
          ...itemData,
          contents: itemData.contents.map(content => ({
            ...content,
            createdAt: now,  // Use regular Date object instead of serverTimestamp
            editedAt: null
          }))
        };

        // Add new item document
        const itemsCollection = collection(db, 'items');
        const newItemRef = await addDoc(itemsCollection, newItemData);
        return newItemRef.id;
      };

      // Duplicate all items and create mapping of old to new IDs
      const itemMapping = new Map();

      // Process folders
      const duplicatedFolders = await Promise.all(originalData.folders.map(async folder => {
        const newItems = await Promise.all(folder.items.map(async itemId => {
          if (!itemMapping.has(itemId)) {
            const newItemId = await duplicateItem(itemId);
            itemMapping.set(itemId, newItemId);
          }
          return itemMapping.get(itemId);
        }));

        return {
          ...folder,
          items: newItems
        };
      }));

      // Process pages
      const duplicatedPages = await Promise.all(originalData.pages.map(async page => {
        const newItems = await Promise.all(page.items.map(async itemId => {
          if (!itemMapping.has(itemId)) {
            const newItemId = await duplicateItem(itemId);
            itemMapping.set(itemId, newItemId);
          }
          return itemMapping.get(itemId);
        }));

        return {
          ...page,
          items: newItems
        };
      }));

      // Create new mindspace data
      const duplicateData = {
        ...originalData,
        name: `${originalData.name} (Copy)`,
        createdAt: serverTimestamp(),  // This is fine as it's not in an array
        updatedAt: null,
        folders: duplicatedFolders,
        pages: duplicatedPages
      };

      // Add the new mindspace document
      const mindspaceCollection = collection(db, 'mindspace');
      const newDocRef = await addDoc(mindspaceCollection, duplicateData);

      return {
        success: true,
        data: duplicateData,
        newId: newDocRef.id,
        message: 'Mindspace duplicated successfully'
      };

    } catch (error) {
      console.error("[duplicateMindspace] Error:", error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to duplicate mindspace'
      };
    }
  },

  async deleteMindspace (mindSpaceId) {
    try {
      const mindspaceRef = doc(db, 'mindspace', mindSpaceId);
      await deleteDoc(mindspaceRef);
      return {success: true}
    } catch (error) {
      return {success: false, error: error.message};
    }
  },

  async setPrivacyMindspace (mindspaceId) {
    try {
      const mindspaceRef = doc(db, 'mindspace', mindspaceId);
      const mindspaceData = (await getDoc(mindspaceRef)).data();

      if (!mindspaceData.privacy){
        console.log("privacy is currently OFF, let's set to ON");
        await updateDoc(mindspaceRef, {
          updatedAt: serverTimestamp(),
          privacy: true,
        });

        return {
          success: true,
          message: 'Mindspace set to public successfully'
        };

      }else{
        console.log("privacy is currently ON, let's set to off");
        await updateDoc(mindspaceRef, {
          updatedAt: serverTimestamp(),
          privacy: false,
        });
        return {
          success: true,
          message: 'Mindspace set to private successfully'
        };
      }



    } catch (error) {
      console.log(error.message);
      return {
        success: false,
        error: error.message,
        message: 'Failed to set mindspace privacy'
      };
    }
  },

  async updateMindSpaceName (mindspaceId, newName) {
    try {
      const mindspaceRef = doc(db, 'mindspace', mindspaceId);

      await updateDoc(mindspaceRef, {
        updatedAt: serverTimestamp(),
        name: newName,
      });

      return {
        success: true,
        message: 'Mindspace Name is updated successfully'
      };

    } catch (error) {
      console.log(error.message);
      return {
        success: false,
        error: error.message,
        message: 'Failed to update mindspace name'
      };
    }
  },

  async setDefaultMindspace (themeId, mindSpaceId) {
    try {
      // Input validation
      if (!themeId) throw new Error('Theme ID is required');
      if (!mindSpaceId) throw new Error('Default setting is required');

      const themeRef = doc(db, 'themes', themeId);

      if (!themeRef) {
        console.log("no themeRef Found.");
        return;
      }else{
        console.log("ThemeRef Found.",themeRef);
      }

      await updateDoc(themeRef, {
        defaultMindSpace: mindSpaceId,
        //updatedAt: new Date().toISOString() // Optional: add timestamp
      });

      return {
        success: true,
        themeId,
        updatedSetting: themeId,
        message: 'Default MindSpace updated successfully'
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  async getItemData (itemId) {
    try {
      const itemsRef = doc(db, 'items', itemId);
      const itemsDoc = await getDoc(itemsRef);

      if (!itemsDoc.exists()) {
        throw new Error('Mindspace not found');
      }

      const itemsData = await itemsDoc.data();

      //console.log("[getItemData] contents",itemsData.contents);

      return {
        name: itemsData.name,
        data: itemsData.contents,
        success: true,
      }

    } catch (error) {
      return {
        message: error.message,
        success: false,
      }
    }

  },

  // Fetch mindspace slots by ID
  async fetchMindspaceSlots(mindspaceId) {
    try {
        if (!mindspaceId) {
            throw new Error('Mindspace ID is required');
        }

        const docRef = doc(db, 'mindspace', mindspaceId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            // Create a new mindspace document while preserving any existing data
            const initialData = {
                name: '', // This should come from somewhere else initially
                mindslot: []
            };
            await setDoc(docRef, initialData);
            return initialData;
        }

        const data = docSnap.data();
        // If mindslot doesn't exist, add it while preserving existing data
        if (!data.mindslot) {
            const updatedData = {
                ...data, // Preserve existing data including name
                mindslot: []
            };
            await updateDoc(docRef, { mindslot: [] });
            return updatedData;
        }

        return data;
    } catch (error) {
        console.error('Error fetching mindspace slots:', error);
        throw error;
    }
  },

  // Update mindspace slots
  async updateMindspaceSlots(mindspaceId, mindspaceData) {
    try {
        if (!mindspaceId) {
            throw new Error('Mindspace ID is required');
        }

        const docRef = doc(db, 'mindspace', mindspaceId);

        // Get existing data first
        const docSnap = await getDoc(docRef);
        const existingData = docSnap.exists() ? docSnap.data() : {};

        // Merge existing data with new data
        const updatedData = {
            ...existingData,
            ...mindspaceData,
            mindslot: mindspaceData.mindslot || existingData.mindslot || []
        };

        await updateDoc(docRef, updatedData);
    } catch (error) {
        console.error('Error updating mindspace:', error);
        throw error;
    }
  },

  // Fetch all items from the 'items' collection
  async fetchItemsForSlots(uid) {
    const items = {};

    try {
        // Add more detailed error message
        if (!uid) {
            throw new Error('User ID is required - please ensure user is logged in');
        }

        const itemsCollection = collection(db, 'items');
        const userItemsQuery = query(
            itemsCollection,
            where('uid', '==', uid)
        );

        const querySnapshot = await getDocs(userItemsQuery);
        querySnapshot.forEach((doc) => {
            items[doc.id] = doc.data();
        });

        return items;
    } catch (error) {
        console.error('Error in fetchItemsForSlots:', error);
        throw error;
    }
  },

  // Get item image URL
  getItemImage(itemId, items) {
    console.log('🔍 getItemImage called:', { itemId, hasItems: !!items });

    if (!items || !itemId || !items[itemId] || !items[itemId].img) {
      console.log('🔍 getItemImage returning empty - missing data');
      return '';
    }

    const result = `url(${items[itemId].img})`;
    console.log('🔍 getItemImage returning:', result);
    return result;
  },

  // Get item name
  async getItemName(itemId, items) {
      try {
          // Check if items is defined and has the correct structure
          if (!items || !items.value) {
              throw new Error('Invalid items object structure');
          }

          // If itemId doesn't exist or no matching item, return empty string
          if (!itemId || !items.value[itemId]) {
              return '';
          }

          // Check if name property exists
          if (!items.value[itemId].name) {
              console.warn(`No name found for item ${itemId}`);
              return '';
          }

          return items.value[itemId].name;
      } catch (error) {
          console.error('Error getting item name:', error);
          return ''; // Return empty string on error
      }
  },

  // Additional helper method to get a single item by ID
  async getItemById(itemId) {
      try {
          const itemDoc = doc(db, 'items', itemId);
          const itemSnapshot = await getDoc(itemDoc);

          if (!itemSnapshot.exists()) {
              console.warn(`No item found with ID: ${itemId}`);
              return null;
          }

          return {
              id: itemSnapshot.id,
              ...itemSnapshot.data()
          };
      } catch (error) {
          console.error('Error fetching single item:', error);
          throw error;
      }
  },

  // Add or Update item blocks
  async updateItemData (itemId, itemName, itemBlockData) {
    console.log('[updateItemInFirestore] Starting update...', itemBlockData);

    if (!itemId) {
      throw new Error('Item ID is not set');
    }

    // Modified filter to handle different content types
    const cleanedContents = itemBlockData.filter(item => {
      if (!item) return false;

      // Handle different content types
      if (item.type === 'todo-block') {
        return Array.isArray(item.content) && item.content.length > 0;
      }

      if (item.type === 'line-block') {
        // Assuming line-block doesn't need content, or has its own format
        return true;
      }

      // For other types (title, body, image), keep original string check
      return typeof item.content === 'string' && item.content.trim() !== '';
    });

    console.log('Original length:', itemBlockData.length);
    console.log('Cleaned length:', cleanedContents.length);
    console.log('Cleaned contents:', cleanedContents);

    const itemRef = doc(db, 'items', itemId);

    await updateDoc(itemRef, {
      updatedAt: serverTimestamp(),
      name: itemName,
      contents: cleanedContents
    });
  },

  // Add the image upload function here that just returns the downloadURL
  async handleImageUpload({ file, userId }) {
    console.log("Image upload triggered");

    if (!file) return null;
    console.log("File selected:", file);

    const uid = userId;
    if (!uid) {
      console.error("No user ID found!");
      return null;
    }

    const storage = getStorage();
    const storageReference = storageRef(storage, `${uid}/images/${file.name}`);
    const uploadTask = uploadBytesResumable(storageReference, file);

    return new Promise((resolve, reject) => {
      uploadTask.on('state_changed',
        (snapshot) => {
          // Track progress
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log(`Upload is ${progress}% done`);

          switch (snapshot.state) {
            case 'paused':
              console.log('Upload is paused');
              break;
            case 'running':
              console.log('Upload is running');
              break;
          }
        },
        (error) => {
          console.error('Upload failed:', error);
          reject(error);
        },
        () => {
          console.log('Upload is DONE');
          // Upload complete, get the file URL
          getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
            console.log('URL retrieved:', downloadURL);
            resolve(downloadURL);
          }).catch(error => reject(error));
        }
      );
    });
  },

  // Add function to delete image from storage
  // Improved function to delete image from storage using the content URL
  async deleteImageFromStorage(imageUrl) {
    if (!imageUrl || typeof imageUrl !== 'string') {
      console.error('Invalid image URL:', imageUrl);
      return false;
    }

    try {
      // Extract the path from the Firebase Storage URL
      // Example URL: https://firebasestorage.googleapis.com/v0/b/solfie-398005.firebasestorage.app/o/images%2F3gGpqzo2fnYfGidkJ1l8tJ3DR5Y2%2FNoiseArticle.jpg?alt=media&token=94273095-99b9-450b-ad84-a39accaa298a

      const storage = getStorage();

      // Parse the URL to get the path
      const urlObj = new URL(imageUrl);

      // The path is between '/o/' and the '?' in the URL
      // It's also URL encoded, so we need to decode it
      const pathSegment = urlObj.pathname.split('/o/')[1];

      if (!pathSegment) {
        console.error('Could not parse image path from URL:', imageUrl);
        return false;
      }

      const fullPath = decodeURIComponent(pathSegment);
      console.log('Extracted path for deletion:', fullPath);

      // Create a reference to the file
      const imageRef = storageRef(storage, fullPath);

      // Delete the file
      await deleteObject(imageRef);
      console.log('Image deleted successfully from storage:', fullPath);
      return true;
    } catch (error) {
      console.error('Error deleting image from storage:', error);
      return false;
    }
  },
  // Function to add item to Firestore and update mindspace
  async addNewItemToMindspace (userId, mindSpaceId, pageIndex, index, newItem) {

    try {
      // 1. Create new item in items collection
      const itemRef = doc(collection(db, 'items'));
      const itemId = itemRef.id;

      const itemData = {
        id: itemId,
        uid: userId,
        createdAt: serverTimestamp(),
        updatedAt: null,
        name: newItem.name || 'New Item',
        icon: newItem.shape || squareSvg,
        badge: null,
        contents: [{
          id: 'e-'+ await mindspaceService.generateRandomId(),
          type: 'title-block',
          content: 'New Item Title',
          createdBy: userId,
          editedBy: [userId],
          createdAt: Date.now(),
          editedAt: null,
        }]
      };

      // Save item to items collection
      await setDoc(itemRef, itemData);

      // 2. Update mindspace pages
      const mindspaceRef = doc(db, 'mindspace', mindSpaceId);
      const mindspaceDoc = await getDoc(mindspaceRef);

      if (!mindspaceDoc.exists()) {
        throw new Error('Mindspace not found');
      }

      const mindspaceData = mindspaceDoc.data();

      // Initialize or get pages array
      let pages = mindspaceData.pages || [];

      // Ensure pages is an array
      if (!Array.isArray(pages)) {
        pages = [];
      }

      // Ensure the target page exists and has an items array
      while (pages.length <= pageIndex) {
        pages.push({ items: [] });
      }

      // Ensure the page has an items array
      if (!pages[pageIndex].items) {
        pages[pageIndex].items = [];
      }

      // Insert the item ID at the specified index
      pages[pageIndex].items.splice(index, 0, itemId);

      // Update mindspace document
      await updateDoc(mindspaceRef, { pages });

      console.log('[addItemToMindspace] Updated mindspace with new item:', {
        itemId,
        itemData,
        pageIndex,
        index,
        updatedPages: pages
      });

      return { itemId, itemData };
    } catch (error) {
      console.error('Error in addItemToMindspace:', error);
      throw error;
    }
  },

  // 1. Add new folder function
  async addFolderToMindspace (mindSpaceId, pageIndex, index) {
      try {
          // Generate folder ID with 'f-' prefix
          const folderRef = doc(collection(db, 'folders'));
          const folderId = `f-${folderRef.id}`;

          // Create folder data
          const folderData = {
          id: folderId,
          createdAt: new Date().toISOString(),
          name: 'New Folder',
          icon: folderSvg,
          items: []
          };

          // Get mindspace document
          const mindspaceRef = doc(db, 'mindspace', mindSpaceId);
          const mindspaceDoc = await getDoc(mindspaceRef);

          if (!mindspaceDoc.exists()) {
          throw new Error('Mindspace not found');
          }

          const mindspaceData = mindspaceDoc.data();

          // Initialize or get folders array
          const folders = mindspaceData.folders || [];
          folders.push(folderData);

          // Initialize or get pages array
          let pages = mindspaceData.pages || [];

          // Ensure pages is an array of objects with items arrays
          if (!Array.isArray(pages)) {
          pages = [];
          }

          // Ensure the target page exists and has an items array
          while (pages.length <= pageIndex) {
          pages.push({ items: [] });
          }

          // Ensure the page has an items array
          if (!pages[pageIndex].items) {
          pages[pageIndex].items = [];
          }

          // Insert the folder ID at the specified index
          pages[pageIndex].items.splice(index, 0, folderId);

          // Update mindspace document
          await updateDoc(mindspaceRef, {
          folders,
          pages
          });

          console.log('[addFolderToMindspace] Updated mindspace with new folder:', {
          folderId,
          folderData,
          pageIndex,
          index,
          updatedPages: pages
          });

          return { folderId, folderData };
      } catch (error) {
          console.error('Error in addFolderToMindspace:', error);
          throw error;
      }
  },

  // 2. Add new item to folder function
  async addItemToFolder (userId, mindSpaceId, folderId, item) {
      try {
        // Create new item in items collection
        const itemRef = doc(collection(db, 'items'));
        const itemId = itemRef.id;

        const itemData = {
          id: itemId,
          uid: userId,
          createdAt: serverTimestamp(),
          updatedAt: null,
          name: item.name || 'New Item',
          icon: item.shape || squareSvg,
          badge: null,
          contents: [{
            id: 'e-'+ await mindspaceService.generateRandomId(),
            type: 'title-block',
            content: 'New Item Title',
            createdBy: userId,
            editedBy: [userId],
            createdAt: Date.now(),
            editedAt: null,
          }]
        };

        // Save item to items collection
        await setDoc(itemRef, itemData);

        // Update folder in mindspace
        const mindspaceRef = doc(db, 'mindspace', mindSpaceId);
        const mindspaceDoc = await getDoc(mindspaceRef);
        const mindspaceData = mindspaceDoc.data();

        // Update folder items
        const folders = mindspaceData.folders.map(folder => {
          if (folder.id === folderId) {
            return {
              ...folder,
              items: [...(folder.items || []), itemId]
            };
          }
          return folder;
        });

        await updateDoc(mindspaceRef, { folders });

        return { itemId, itemData };
      } catch (error) {
        console.error('Error adding item to folder:', error);
        throw error;
      }
  },

  async duplicateItemInMindspace (userId, mindSpaceId, pageIndex, existingItemId) {
    try {
      // 1. Fetch existing item data
      const existingItemRef = doc(db, 'items', existingItemId);
      const existingItemDoc = await getDoc(existingItemRef);

      if (!existingItemDoc.exists()) {
        throw new Error('Source item not found');
      }

      // 2. Create new item with existing data
      const itemRef = doc(collection(db, 'items'));
      const itemId = itemRef.id;

      // Get existing data
      const existingData = existingItemDoc.data();

      // Generate new IDs for contents first
      const newContentIds = await Promise.all(
        existingData.contents.map(() => mindspaceService.generateRandomId())
      );

      // Then create the contents array with the pre-generated IDs
      const newContents = existingData.contents.map((content, index) => ({
        ...content,
        id: 'e-' + newContentIds[index],
        createdAt: Date.now(),
        editedAt: null,
        createdBy: userId,
        editedBy: [userId]
      }));

      const itemData = {
        ...existingData,
        id: itemId,
        uid: userId,
        createdAt: serverTimestamp(),
        updatedAt: null,
        contents: newContents,
        name: `${existingData.name} (Copy)`
      };

      // Save duplicated item to items collection
      await setDoc(itemRef, itemData);

      // 3. Update mindspace pages
      const mindspaceRef = doc(db, 'mindspace', mindSpaceId);
      const mindspaceDoc = await getDoc(mindspaceRef);

      if (!mindspaceDoc.exists()) {
        throw new Error('Mindspace not found');
      }

      const mindspaceData = mindspaceDoc.data();

      // Initialize or get pages array
      let pages = mindspaceData.pages || [];

      // Ensure pages is an array
      if (!Array.isArray(pages)) {
        pages = [];
      }

      // Ensure the target page exists and has an items array
      while (pages.length <= pageIndex) {
        pages.push({ items: [] });
      }

      // Ensure the page has an items array
      if (!pages[pageIndex].items) {
        pages[pageIndex].items = [];
      }

      // Simply push the new item to the end of the array
      pages[pageIndex].items.push(itemId);

      // Update mindspace document
      await updateDoc(mindspaceRef, { pages });

      console.log('[duplicateItemInMindspace] Updated mindspace with duplicated item:', {
        itemId,
        itemData,
        pageIndex,
        position: pages[pageIndex].items.length - 1,
        updatedPages: pages
      });

      return { itemId, itemData };
    } catch (error) {
      console.error('Error in duplicateItemInMindspace:', error);
      throw error;
    }
  },

  async duplicateItemToFolder (userId, mindSpaceId, folderId, existingItemId) {
    try {
      // 1. Fetch existing item data
      const existingItemRef = doc(db, 'items', existingItemId);
      const existingItemDoc = await getDoc(existingItemRef);

      if (!existingItemDoc.exists()) {
        throw new Error('Source item not found');
      }

      // 2. Create new item with existing data
      const itemRef = doc(collection(db, 'items'));
      const itemId = itemRef.id;

      // Get existing data
      const existingData = existingItemDoc.data();

      // Generate new IDs for contents first
      const newContentIds = await Promise.all(
        existingData.contents.map(() => mindspaceService.generateRandomId())
      );

      // Then create the contents array with the pre-generated IDs
      const newContents = existingData.contents.map((content, index) => ({
        ...content,
        id: 'e-' + newContentIds[index],
        createdAt: Date.now(),
        editedAt: null,
        createdBy: userId,
        editedBy: [userId]
      }));

      const itemData = {
        ...existingData,
        id: itemId,
        uid: userId,
        createdAt: serverTimestamp(),
        updatedAt: null,
        contents: newContents,
        name: `${existingData.name} (Copy)`
      };

      // Save duplicated item to items collection
      await setDoc(itemRef, itemData);

      // Update folder in mindspace
      const mindspaceRef = doc(db, 'mindspace', mindSpaceId);
      const mindspaceDoc = await getDoc(mindspaceRef);
      const mindspaceData = mindspaceDoc.data();

      // Update folder items
      const folders = mindspaceData.folders.map(folder => {
        if (folder.id === folderId) {
          return {
            ...folder,
            items: [...(folder.items || []), itemId]
          };
        }
        return folder;
      });

      await updateDoc(mindspaceRef, { folders });

      console.log('[duplicateItemToFolder] Updated folder with duplicated item:', {
        itemId,
        itemData,
        folderId
      });

      return { itemId, itemData };
    } catch (error) {
      console.error('Error duplicating item to folder:', error);
      throw error;
    }
  },

  // update MindSpaceData
  async updateMindSpaceData (mindSpaceId, mindSpacePages) {
    try {
      console.log('[updateMindSpaceInFirestore] Starting update...');

      if (!mindSpaceId) {
        throw new Error('MindSpace ID is not set');
      }

      const mindspaceRef = doc(db, 'mindspace', mindSpaceId);
      const formattedData = formatMindSpaceForFirestore(mindSpacePages);

      await updateDoc(mindspaceRef, formattedData);

      console.log('[updateMindSpaceInFirestore] Successfully updated mindspace');
      return formattedData;
    } catch (error) {
      console.error('[updateMindSpaceInFirestore] Error:', error);
      throw error;
    }
  },

  async moveItemFromFolderToMindspace (mindSpaceId, {
    folderId,
    itemId,
    targetPageIndex,
    targetIndex
  }) {
    try {
      const mindspaceRef = doc(db, 'mindspace', mindSpaceId);
      const mindspaceDoc = await getDoc(mindspaceRef);

      if (!mindspaceDoc.exists()) {
        throw new Error('Mindspace not found');
      }

      const mindspaceData = mindspaceDoc.data();
      let pages = [...(mindspaceData.pages || [])];
      let folders = [...(mindspaceData.folders || [])];

      // 1. Update raw data structure
      // Remove item from folder
      const folderIndex = folders.findIndex(f => f.id === folderId);
      if (folderIndex === -1) {
        throw new Error('Folder not found');
      }

      folders[folderIndex] = {
        ...folders[folderIndex],
        items: folders[folderIndex].items.filter(id => id !== itemId)
      };

      // 2. Add item to target page
      while (pages.length <= targetPageIndex) {
        pages.push({ items: [] });
      }

      if (!pages[targetPageIndex].items) {
        pages[targetPageIndex].items = [];
      }

      pages[targetPageIndex].items.splice(targetIndex, 0, itemId);

      // 3. Update Firestore
      await updateDoc(mindspaceRef, {
        pages,
        folders
      });

      /*
      //THEN WE DON'T NEED THE THIRD POINT.
      // 3. Transform data into rich format for rendering
      const transformedPages = await Promise.all(
        pages.map(async (page) => {
          const pageItems = await Promise.all(
            (page.items || []).map(async (id) => {
              // Check if this is a folder ID
              const folderData = folders.find(f => f.id === id);

              if (folderData) {
                // This is a folder
                const folderItems = await Promise.all(
                  (folderData.items || []).map(async (fItemId) => {
                    const itemDoc = await getDoc(doc(db, 'items', fItemId));
                    const itemData = itemDoc.data();

                    return {
                      id: fItemId,
                      name: itemData.name,
                      shape: itemData.icon || squareSvg,
                      badge: itemData.badge || null
                    };
                  })
                );

                return {
                  id: folderData.id,
                  name: folderData.name,
                  shape: folderData.icon || folderSvg,
                  items: folderItems
                };
              } else {
                // This is a regular item
                const itemDoc = await getDoc(doc(db, 'items', id));
                const itemData = itemDoc.data();

                return {
                  id: id,
                  name: itemData.name,
                  shape: itemData.icon || squareSvg,
                  badge: itemData.badge || null
                };
              }
            })
          );

          return { items: pageItems };
        })
      );*/

      return {
        //pages: transformedPages,
        rawPages: pages,        // Keep raw data for future operations
        rawFolders: folders     // Keep raw data for future operations
      };
    } catch (error) {
      console.error('Error moving item from folder to mindspace:', error);
      throw error;
    }
  },

  async moveItemToFolder (mindSpaceId, {
    pageIndex,
    folderId,
    itemId // Changed to accept itemId directly
  }) {
    try {
      const mindspaceRef = doc(db, 'mindspace', mindSpaceId);
      const mindspaceDoc = await getDoc(mindspaceRef);

      if (!mindspaceDoc.exists()) {
        throw new Error('Mindspace not found');
      }

      const mindspaceData = mindspaceDoc.data();
      let pages = [...(mindspaceData.pages || [])];
      let folders = [...(mindspaceData.folders || [])];

      // 1. Remove item from pages
      if (!pages[pageIndex] || !pages[pageIndex].items) {
        throw new Error('Invalid page or items array');
      }
      pages[pageIndex].items = pages[pageIndex].items.filter(id => id !== itemId);

      // 2. Add item to folder
      const folderIndex = folders.findIndex(f => f.id === folderId);
      if (folderIndex === -1) {
        throw new Error('Folder not found');
      }

      folders[folderIndex] = {
        ...folders[folderIndex],
        items: [...(folders[folderIndex].items || []), itemId]
      };

      // 3. Update Firestore
      await updateDoc(mindspaceRef, {
        pages,
        folders
      });

      return {
        rawPages: pages,
        rawFolders: folders
      };
    } catch (error) {
      console.error('Error moving item to folder:', error);
      throw error;
    }
  },

  async deleteItem (mindSpaceId, itemId) {
    try {
      const mindspaceRef = doc(db, 'mindspace', mindSpaceId);
      const mindspaceDoc = await getDoc(mindspaceRef);

      if (!mindspaceDoc.exists()) {
        throw new Error('Mindspace not found');
      }

      const mindspaceData = mindspaceDoc.data();
      let pages = [...(mindspaceData.pages || [])];
      let folders = [...(mindspaceData.folders || [])];

      // 1. Remove item from pages
      pages = pages.map(page => ({
        items: page.items.filter(id => id !== itemId)
      }));

      // 2. Remove item from any folders that might contain it
      folders = folders.map(folder => ({
        ...folder,
        items: (folder.items || []).filter(id => id !== itemId)
      }));

      // 3. Update mindspace document
      await updateDoc(mindspaceRef, {
        pages,
        folders
      });

      // 4. Delete the item document from items collection
      const itemRef = doc(db, 'items', itemId);
      await deleteDoc(itemRef);

      return {
        rawPages: pages,
        rawFolders: folders
      };
    } catch (error) {
      console.error('Error deleting item:', error);
      throw error;
    }
  },

  // Fetch theme spaces for a user
  async fetchThemeSpaces(userId) {
    if (!userId) {
      throw new Error('User ID is required to fetch theme spaces');
    }
    const themesRef = collection(db, 'themes');
    const q = query(themesRef, where('uid', '==', userId));

    try {
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching theme spaces:', error);
      throw error;
    }
  },

  // Fetch mind spaces for a theme
  async fetchMindSpaces(themeId) {
    const mindspacesRef = collection(db, 'mindspace');
    const q = query(mindspacesRef, where('themeId', '==', themeId));

    try {
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching mind spaces:', error);
      throw error;
    }
  },

  // Remove item from a mindspace structure
  removeItemFromMindspace(mindspace, itemId) {
    const updatedMindspace = { ...mindspace };

    // Remove from folders
    if (updatedMindspace.folders) {
      updatedMindspace.folders = updatedMindspace.folders.map(folder => ({
        ...folder,
        items: folder.items.filter(id => id !== itemId)
      }));
    }

    // Remove from pages
    if (updatedMindspace.pages) {
      updatedMindspace.pages = updatedMindspace.pages.map(page => ({
        ...page,
        items: page.items.filter(id => id !== itemId)
      }));
    }

    return updatedMindspace;
  },

  // Move item from one mindspace to another
  async moveItem(currentMindspaceId, newMindspaceId, itemId) {
    try {
      console.log('Moving item with params:', { currentMindspaceId, newMindspaceId, itemId });

      if (!currentMindspaceId || !newMindspaceId || !itemId) {
        throw new Error('Missing required parameters for moving item');
      }

      // Remove from current mindspace
      const currentMindspaceRef = doc(db, 'mindspace', currentMindspaceId);
      const currentMindspaceSnap = await getDoc(currentMindspaceRef);

      if (!currentMindspaceSnap.exists()) {
        throw new Error('Current mindspace not found');
      }

      const currentMindspace = currentMindspaceSnap.data();
      console.log('Current mindspace data:', currentMindspace);

      // Update the current mindspace
      const updatedData = this.removeItemFromMindspace(currentMindspace, itemId);
      await updateDoc(currentMindspaceRef, {
        ...updatedData,
        updatedAt: new Date()
      });

      // Add to new mindspace
      const newMindspaceRef = doc(db, 'mindspace', newMindspaceId);
      const newMindspaceSnap = await getDoc(newMindspaceRef);

      if (!newMindspaceSnap.exists()) {
        throw new Error('New mindspace not found');
      }

      const newMindspace = newMindspaceSnap.data();
      console.log('New mindspace data:', newMindspace);

      // Ensure pages array exists
      if (!newMindspace.pages) {
        newMindspace.pages = [];
      }

      // Add item to first page or create new page
      if (newMindspace.pages.length === 0) {
        newMindspace.pages.push({ items: [] });
      }

      newMindspace.pages[0].items = newMindspace.pages[0].items || [];
      newMindspace.pages[0].items.push(itemId);

      await updateDoc(newMindspaceRef, {
        pages: newMindspace.pages,
        updatedAt: new Date()
      });

      console.log('Item successfully moved');
    } catch (error) {
      console.error('Error moving item:', error);
      throw error;
    }
  },

  // Add item to a mindspace
  async addItemToMindspace(mindspaceId, itemId) {
    if (!mindspaceId || !itemId) {
      throw new Error('Both mindspaceId and itemId are required');
    }

    try {
      const mindspaceRef = doc(db, 'mindspace', mindspaceId);
      const mindspaceSnap = await getDoc(mindspaceRef);

      if (!mindspaceSnap.exists()) {
        throw new Error('Mindspace not found');
      }

      const mindspace = mindspaceSnap.data();
      console.log('Current mindspace data:', mindspace);

      // Ensure pages array exists
      if (!mindspace.pages) {
        mindspace.pages = [];
      }

      // Add item to first page or create new page
      if (mindspace.pages.length === 0) {
        mindspace.pages.push({ items: [] });
      }

      // Ensure items array exists in first page
      mindspace.pages[0].items = mindspace.pages[0].items || [];
      mindspace.pages[0].items.push(itemId);

      await updateDoc(mindspaceRef, {
        pages: mindspace.pages,
        updatedAt: new Date()
      });

      console.log('Item successfully added to mindspace');
    } catch (error) {
      console.error('Error adding item to mindspace:', error);
      throw error;
    }
  },

  // Duplicate item to another mindspace
  async duplicateAndMoveItem(newMindspaceId, itemId) {
    if (!newMindspaceId || !itemId) {
      throw new Error('Both newMindspaceId and itemId are required');
    }

    try {
      // 1. Get the original item data
      const originalItemRef = doc(db, 'items', itemId);
      const originalItemSnap = await getDoc(originalItemRef);

      if (!originalItemSnap.exists()) {
        throw new Error('Original item not found');
      }

      const originalItemData = originalItemSnap.data();

      // 2. Create new item document with copied data
      const itemsCollection = collection(db, 'items');
      const newItemData = {
        ...originalItemData,
        id: null, // Will be set after creation
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // 3. Add new document to items collection
      const newItemRef = await addDoc(itemsCollection, newItemData);
      const newItemId = newItemRef.id;

      // 4. Update the new item's id field to match its document id
      await updateDoc(newItemRef, {
        id: newItemId
      });

      console.log('New item created with ID:', newItemId);

      // 5. Add the new item to the target mindspace
      await this.addItemToMindspace(newMindspaceId, newItemId);

      console.log('Item successfully duplicated to new mindspace');

      // Return the new item ID for reference
      return newItemId;
    } catch (error) {
      console.error('Error duplicating and moving item:', error);
      throw error;
    }
  },
  async updateItemImage(itemId, imageUrl) {
    try {
      console.log('[updateItemImage] Updating item:', itemId, 'with image:', imageUrl);

      const itemRef = doc(db, 'items', itemId);
      await updateDoc(itemRef, {
        img: imageUrl,
        editedAt: new Date().toISOString()
      });
      console.log('[updateItemImage] Successfully updated item image in Firebase');
    } catch (error) {
      console.error('[updateItemImage] Error updating item image:', error);
      throw error;
    }
  },

  async updateItemIcon(itemId, iconValue) {
    try {
      console.log('[updateItemIcon] Updating item:', itemId, 'with icon:', iconValue);

      const itemRef = doc(db, 'items', itemId);
      await updateDoc(itemRef, {
        icon: iconValue,
        updatedAt: serverTimestamp()
      });

      console.log('[updateItemIcon] Successfully updated item icon in Firebase');
      return { success: true };
    } catch (error) {
      console.error('[updateItemIcon] Error updating item icon:', error);
      throw error;
    }
  }

}
