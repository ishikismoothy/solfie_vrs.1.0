import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebaseInit'; // Adjust the import path as needed

export const getDefaultData = async () => {
  const docRef = doc(db, 'defaultData', 'defaultDoc'); // Adjust the path as needed
  try {
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      console.log('Default data:', docSnap.data());
      return docSnap.data();
    } else {
      console.log('No such document!');
    }
  } catch (error) {
    console.error('Error fetching default data:', error);
  }
};
