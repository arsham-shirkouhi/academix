import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";

// Save token and domain
export const saveUserSettings = async (uid: string, data: { token: string; domain: string }) => {
  await setDoc(doc(db, "users", uid), data, { merge: true });
};

// Retrieve token and domain
export const getUserSettings = async (uid: string) => {
  const docRef = doc(db, "users", uid);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? docSnap.data() : null;
};

export async function updateColorPreferences(uid: string, preferences: Record<string, string>) {
  const ref = doc(db, "users", uid);
  await updateDoc(ref, {
    colorPreferences: preferences,
  });
}

// ✅ updateTodos should accept an object
export const updateTodos = async (uid: string, todos: Record<string, any[]>) => {
  const docRef = doc(db, "users", uid);
  await updateDoc(docRef, { todos });
};

// ✅ getTodos should return that same structure
export const getTodos = async (uid: string): Promise<Record<string, any[]> | null> => {
  const docRef = doc(db, "users", uid);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data().todos || {
      "get-started": [],
      "ongoing": [],
      "done": [],
    };
  }
  return null;
};

export const saveUserSchedule = async (uid: string, schedule: any[]) => {
  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, { events: schedule });
};

export const loadUserSchedule = async (uid: string): Promise<any[]> => {
  const userRef = doc(db, "users", uid);
  const snapshot = await getDoc(userRef);
  return snapshot.exists() ? snapshot.data().events || [] : [];
};