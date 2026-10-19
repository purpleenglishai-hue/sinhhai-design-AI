import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "THAY_API_KEY_CỦA_BẠN",
  authDomain: "purple-english-ai.firebaseapp.com",
  projectId: "purple-english-ai",
  storageBucket: "purple-english-ai.firebasestorage.app",
  messagingSenderId: "MESSAGING_SENDER_ID",
  appId: "APP_ID"
};

const app = initializeApp(firebaseConfig);
export const storage = getStorage(app);
export const auth = getAuth(app);
