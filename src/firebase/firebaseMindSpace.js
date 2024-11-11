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
//import { useStore } from 'vuex';

//const store = useStore();

const generateRandomId = (length = 10) => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

export const getUserThemeId = async (userId) => {
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
};

export const changeUserThemeId = async (userId, themeId) => {
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
};

export const getDefaultMindSpaceId = async (themeId, uid) => {
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
          
          const result = await createMindspace({
            uid, 
            themeId, 
            name: 'welcome to solfie!',
            privacy: false
          });
          await setDefaultMindspace(themeId, result.mindspaceId);
          return result.mindspaceId;
        }else{
          return defaultMindSpaceId;
        }  
    } catch (error) {
        console.error('Error loading default mindspace ID:', error);
        return error.message;
    }
};

export const getThemeData = async (themeId) => {
  const themeRef = doc(db, 'themes', themeId);
  const themeDoc = await getDoc(themeRef);

  if (!themeDoc.exists()) {
    throw new Error ('Theme not found');
  }

  const themeData = themeDoc.data();

  console.log("[getThemeData]",themeData);

  return themeData.name;
}

export const getListOfMindSpace = async (themeId) => {
  console.log("[getListOfMindSpace] 00 themeId: ",themeId);
  try {
    const mindspacesRef = collection(db, 'mindspace');
    console.log("[getListOfMindSpace] 01 mindspaceRef: ",mindspacesRef);
    
    const q = query(mindspacesRef, where('themeId', '==', themeId));
    
    const querySnapshot = await getDocs(q);
    console.log("[getListOfMindSpace] querySnapshot size:", querySnapshot.size);
  
    querySnapshot.docs.forEach(doc => {
      console.log("[getListOfMindSpace] doc data:", doc.data());
    });
  
    const mindSpaceList = querySnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
    console.log("[getListOfMindSpace]03",mindSpaceList);
  
    return mindSpaceList;
  } catch (error) {
    return [];
  }
  
}

export const getMindSpaceData = async (mindSpaceId) => {
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
};

export const createMindspace = async ({
  uid,
  themeId,
  name,
  privacy = false
}) => {
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
};

export const duplicateMindspace = async (mindSpaceId) => {
  try {
    // Check if mindSpaceId is provided
    if (!mindSpaceId) {
      throw new Error('MindSpace ID is required');
    }

    // Get reference to the original document
    const mindspaceRef = doc(db, 'mindspace', mindSpaceId);
    const mindspaceDoc = await getDoc(mindspaceRef);

    // Check if original document exists
    if (!mindspaceDoc.exists()) {
      throw new Error('Original mindspace document not found');
    }

    // Get the data and modify it for the duplicate
    const originalData = mindspaceDoc.data();
    
    // Create new data object with modified timestamps and name
    const duplicateData = {
      ...originalData,
      name: `${originalData.name} (Copy)`, // Add '(Copy)' to the name
      createdAt: serverTimestamp(), // New creation timestamp
      updatedAt: null, // Reset edited timestamp
      //id: null // Remove the original id if it exists in the data
    };

    // Add the new document to the collection
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

};

export const deleteMindspace = async (mindSpaceId) => {
  try {
    const mindspaceRef = doc(db, 'mindspace', mindSpaceId);
    await deleteDoc(mindspaceRef);
    return {success: true}
  } catch (error) {
    return {success: false, error: error.message};
  }
};

export const setPrivacyMindspace = async (mindspaceId) => {
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
};

export const setDefaultMindspace = async (themeId, mindSpaceId) => {
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
}

export const getItemData = async (itemId) => {
  try {
    const itemsRef = doc(db, 'items', itemId);
    const itemsDoc = await getDoc(itemsRef);
      
    if (!itemsDoc.exists()) {
      throw new Error('Mindspace not found');
    }
    
    const itemsData = await itemsDoc.data();

    console.log("[getItemData] contents",itemsData.contents);
    
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
  
}

export const updateItemData = async (itemId, itemName, itemBlockData) => {
  console.log('[updateItemInFirestore] Starting update...');
    
    if (!itemId) {
      throw new Error('Item ID is not set');
    }

    const itemRef = doc(db, 'items', itemId);
    
    await updateDoc(itemRef, {
        updatedAt: serverTimestamp(),
        name: itemName,
        contents: itemBlockData
      }
    );
}

// Function to add item to Firestore and update mindspace
export const addItemToMindspace = async (userId, mindSpaceId, pageIndex, index, newItem) => {
    
  try {
    // 1. Create new item in items collection
    const itemRef = doc(collection(db, 'items'));
    const itemId = itemRef.id;

    const itemData = {
      id: itemId,
      createdAt: serverTimestamp(),
      updatedAt: null,
      name: newItem.name || 'New Item',
      icon: newItem.shape || squareSvg,
      badge: null,
      contents: [{
        id: 'e-'+ await generateRandomId(),
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
};

  // 1. Add new folder function
export const addFolderToMindspace = async (mindSpaceId, pageIndex, index) => {
    try {
        // Generate folder ID with 'f-' prefix
        const folderRef = doc(collection(db, 'folders'));
        const folderId = `f-${folderRef.id}`;

        // Create folder data
        const folderData = {
        id: folderId,
        createdAt: serverTimestamp(),
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
};
  
// 2. Add new item to folder function
export const addItemToFolder = async (userId, mindSpaceId, folderId, item) => {
    try {
      // Create new item in items collection
      const itemRef = doc(collection(db, 'items'));
      const itemId = itemRef.id;
  
      const itemData = {
        id: itemId,
        createdAt: serverTimestamp(),
        updatedAt: null,
        name: item.name || 'New Item',
        icon: item.shape || squareSvg,
        badge: null,
        contents: [{
          id: 'e-'+ await generateRandomId(),
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
};

// update MindSpaceData
export const updateMindSpaceData = async (mindSpaceId, mindSpacePages) => {
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
};

export const moveItemFromFolderToMindspace = async (mindSpaceId, {
  folderId,
  itemId,
  targetPageIndex,
  targetIndex
}) => {
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
};

export const moveItemToFolder = async (mindSpaceId, {
  pageIndex,
  folderId,
  itemId // Changed to accept itemId directly
}) => {
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
};

export const deleteItem = async (mindSpaceId, itemId) => {
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
};