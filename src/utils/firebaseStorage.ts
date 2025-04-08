import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";

const userId = "default-user"; // you can enhance this later with auth

export const saveStudyStreak = async (streak: number) => {
  const docRef = doc(db, "users", userId);
  await setDoc(docRef, { streak }, { merge: true });
};

export const getStudyStreak = async (): Promise<number> => {
  const docRef = doc(db, "users", userId);
  const snap = await getDoc(docRef);
  return snap.exists() ? snap.data().streak || 1 : 1;
};
