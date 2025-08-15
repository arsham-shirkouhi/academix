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
  const docRef = doc(db, "users", uid);
  await updateDoc(docRef, { schedule });
};

// Study time tracking functions
export const getStudyTime = async (uid: string): Promise<number> => {
  const docRef = doc(db, "users", uid);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data().studyTime || 0;
  }
  return 0;
};

export const addStudyTime = async (uid: string, seconds: number) => {
  const docRef = doc(db, "users", uid);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const currentStudyTime = docSnap.data().studyTime || 0;
    await updateDoc(docRef, { studyTime: currentStudyTime + seconds });
  } else {
    await setDoc(docRef, { studyTime: seconds });
  }
};

export const getCompletedAssignments = async (uid: string): Promise<number> => {
  const docRef = doc(db, "users", uid);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data().completedAssignments || 0;
  }
  return 0;
};

export const getCompletedTodos = async (uid: string): Promise<number> => {
  const docRef = doc(db, "users", uid);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    const todos = docSnap.data().todos || {};
    const doneTodos = todos["done"] || [];
    return doneTodos.length;
  }
  return 0;
};

export const loadUserSchedule = async (uid: string): Promise<any[]> => {
  const userRef = doc(db, "users", uid);
  const snapshot = await getDoc(userRef);
  return snapshot.exists() ? snapshot.data().events || [] : [];
};