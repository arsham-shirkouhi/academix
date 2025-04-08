import { doc, getDoc, setDoc } from "firebase/firestore";
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
