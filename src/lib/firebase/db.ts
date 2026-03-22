import { db } from './config';
import { doc, setDoc, getDoc, collection, getDocs, query, orderBy, Timestamp } from 'firebase/firestore';
import type { DatosDIA } from '../types/dia';

// --- Datasets (Excel Data) ---
export async function saveDatasetToCloud(userId: string, datos: DatosDIA): Promise<void> {
  const docRef = doc(db, 'users', userId, 'datasets', 'current');
  // Store the entire DIA state.
  await setDoc(docRef, { ...datos, updatedAt: Timestamp.now() }, { merge: false });
}

export async function loadDatasetFromCloud(userId: string): Promise<DatosDIA | null> {
  const docRef = doc(db, 'users', userId, 'datasets', 'current');
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    const data = snap.data();
    // Remove the Firestore-specific timestamp before returning the native object
    delete data.updatedAt;
    return data as DatosDIA;
  }
  return null;
}

// --- History (AI Generators) ---
export async function saveAIHistory(userId: string, type: 'dua' | 'riesgo' | 'tickets', content: string, metadata: any): Promise<void> {
  const ref = doc(collection(db, 'users', userId, `historial_${type}`));
  await setDoc(ref, {
    content,
    ...metadata,
    createdAt: Timestamp.now()
  });
}

export async function getAIHistory(userId: string, type: 'dua' | 'riesgo' | 'tickets'): Promise<any[]> {
  const q = query(collection(db, 'users', userId, `historial_${type}`), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({
    id: d.id,
    ...d.data(),
    createdAt: d.data().createdAt?.toDate()?.toISOString() // serialize dates for client
  }));
}
