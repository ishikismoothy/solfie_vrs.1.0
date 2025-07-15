// src/firebase/firebaseShare.js
import { nanoid } from 'nanoid';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs,
  updateDoc, 
  serverTimestamp,
  query,
  where,
  deleteDoc
} from 'firebase/firestore';
import { db } from './firebaseInit';

export const shareService = {
  // Generate a shareable link
  async createShareLink(mindspaceId, themeId, ownerId, accessType, expiryDays = null) {
    const accessKey = nanoid(10); // Short, URL-safe ID
    const linkId = `${mindspaceId}_${accessKey}`;
    
    const shareData = {
      type: accessType,
      mindspaceId,
      themeId,
      ownerId,
      createdAt: serverTimestamp(),
      expiresAt: expiryDays ? new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000) : null,
      accessKey,
      usageCount: 0,
      active: true
    };

    await setDoc(doc(db, 'sharedLinks', linkId), shareData);
    
    return {
      url: `${window.location.origin}/shared/${accessKey}`,
      accessKey,
      type: accessType
    };
  },

  // Access shared content via link
  async accessSharedLink(accessKey, currentUserId) {
    // Find the share link
    const sharedLinksRef = collection(db, 'sharedLinks');
    const q = query(sharedLinksRef, where('accessKey', '==', accessKey), where('active', '==', true));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      throw new Error('Invalid or expired share link');
    }

    const shareDoc = querySnapshot.docs[0];
    const shareData = shareDoc.data();

    // Check if link is expired
    if (shareData.expiresAt && shareData.expiresAt.toDate() < new Date()) {
      throw new Error('This share link has expired');
    }

    // Update usage count
    await updateDoc(shareDoc.ref, {
      usageCount: shareData.usageCount + 1,
      lastAccessed: serverTimestamp()
    });

    // Add user as collaborator if they're logged in
    if (currentUserId && currentUserId !== shareData.ownerId) {
      await this.addCollaborator(
        shareData.mindspaceId, 
        currentUserId, 
        shareData.type,
        'link'
      );
    }

    return {
      mindspaceId: shareData.mindspaceId,
      themeId: shareData.themeId,
      ownerId: shareData.ownerId,
      access: shareData.type
    };
  },

  // Add collaborator to mindspace
  async addCollaborator(mindspaceId, userId, accessType, addedVia = 'direct') {
    const mindspaceRef = doc(db, 'mindspace', mindspaceId);
    
    // Get current data
    const mindspaceDoc = await getDoc(mindspaceRef);
    const currentData = mindspaceDoc.data();
    
    // Update collaborators object
    const collaborators = currentData.collaborators || {};
    collaborators[userId] = {
      userId,
      access: accessType,
      addedAt: serverTimestamp(),
      addedVia
    };
    
    await updateDoc(mindspaceRef, { collaborators });
  },

  // Revoke share link (deactivate)
  async revokeShareLink(accessKey, ownerId) {
    const sharedLinksRef = collection(db, 'sharedLinks');
    const q = query(
      sharedLinksRef, 
      where('accessKey', '==', accessKey),
      where('ownerId', '==', ownerId)
    );
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const shareDoc = querySnapshot.docs[0];
      await updateDoc(shareDoc.ref, { active: false });
    }
  },

  // Reactivate share link
  async reactivateShareLink(accessKey, ownerId) {
    const sharedLinksRef = collection(db, 'sharedLinks');
    const q = query(
      sharedLinksRef, 
      where('accessKey', '==', accessKey),
      where('ownerId', '==', ownerId)
    );
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const shareDoc = querySnapshot.docs[0];
      await updateDoc(shareDoc.ref, { active: true });
    }
  },

  // Delete share link permanently
  async deleteShareLink(linkId) {
    const shareRef = doc(db, 'sharedLinks', linkId);
    await deleteDoc(shareRef);
  },

  // Get all share links for a mindspace (including inactive ones)
  async getShareLinks(mindspaceId, ownerId) {
    console.log('Getting share links for:', { mindspaceId, ownerId });
    
    const sharedLinksRef = collection(db, 'sharedLinks');
    const q = query(
      sharedLinksRef,
      where('mindspaceId', '==', mindspaceId),
      where('ownerId', '==', ownerId)
    );
    const querySnapshot = await getDocs(q);
    
    console.log('Found links:', querySnapshot.size);

    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // Convert Firestore timestamp to Date for display
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
        expiresAt: data.expiresAt?.toDate ? data.expiresAt.toDate() : data.expiresAt
      };
    });
  },

  // Delete expired links (optional cleanup function)
  async cleanupExpiredLinks() {
    const sharedLinksRef = collection(db, 'sharedLinks');
    const q = query(sharedLinksRef, where('active', '==', true));
    const querySnapshot = await getDocs(q);
    
    const now = new Date();
    const updates = [];
    
    querySnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.expiresAt && data.expiresAt.toDate() < now) {
        updates.push(updateDoc(doc.ref, { active: false }));
      }
    });
    
    await Promise.all(updates);
  }
};