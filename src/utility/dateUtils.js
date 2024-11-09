export const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('ja-JP', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit', 
      hour: '2-digit', 
      minute: '2-digit'
    });
};


export const formatFireStoreTimeStamp = (timestamp) => {
  // Check if it's a Firestore Timestamp
  const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleString('ja-JP', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit', 
      hour: '2-digit', 
      minute: '2-digit'
  });
};

/*
USAGE of  formatFireStoreTimeStamp

// When you have a Firestore document
const doc = await getDoc(docRef);
const timestamp = doc.data().createdAt;
const formattedDate = formatDate(timestamp);
*/