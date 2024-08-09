// src/test/firestoreTest.js

import { db } from '@/firebase/firebaseInit';
import { doc, setDoc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';

async function testFirestoreOperations() {
  // Create a Document
  await setDoc(doc(db, 'testCollection', 'testDoc'), {
    name: 'Test Name',
    value: 123
  });
  console.log('Document created successfully');

  // Read a Document
  const docSnap = await getDoc(doc(db, 'testCollection', 'testDoc'));
  if (docSnap.exists()) {
    console.log('Document data:', docSnap.data());
  } else {
    console.log('No such document!');
  }

  // Update a Document
  await updateDoc(doc(db, 'testCollection', 'testDoc'), {
    value: 456
  });
  console.log('Document updated successfully');

  // Delete a Document
  await deleteDoc(doc(db, 'testCollection', 'testDoc'));
  console.log('Document deleted successfully');
}

testFirestoreOperations();
