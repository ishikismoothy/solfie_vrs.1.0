//Format mindSpaceData for firebase to upload.

export const formatMindSpaceForFirestore = (mindSpacePages) => {
  try {
    // Initialize result structure
    const result = {
      pages: [],
      folders: []
    };

    // Process each page
    result.pages = mindSpacePages.map(page => {
      return {
        items: page.items.map(item => item.id) // Extract only IDs
      };
    });

    // Process all folders from all pages
    mindSpacePages.forEach(page => {
      page.items.forEach(item => {
        if (item.id.startsWith('f-')) {
          // This is a folder
          result.folders.push({
            id: item.id,
            icon: item.shape,
            name: item.name,
            items: item.items.map(folderItem => folderItem.id) // Extract only IDs of items in folder
          });
        }
      });
    });

    console.log('[formatMindSpaceForFirestore] Formatted data:', result);
    return result;
  } catch (error) {
    console.error('[formatMindSpaceForFirestore] Error formatting data:', error);
    throw error;
  }
};