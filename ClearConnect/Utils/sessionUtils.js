import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseconfig';
import * as Crypto from 'expo-crypto';
import { Buffer } from 'buffer';

export const createSession = async (userId) => {
  const tokenBytes = await Crypto.getRandomBytesAsync(32);
  const token = Buffer.from(tokenBytes).toString('hex');

  const sessionDoc = await addDoc(collection(db, 'sessions'), {
    userId,
    token,
    createdAt: serverTimestamp(),
    expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7 days
  });

  return {
    sessionId: sessionDoc.id,
    token,
  };
};
