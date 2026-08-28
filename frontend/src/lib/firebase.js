import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { 
  getFirestore, 
  connectFirestoreEmulator 
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyDummyKeyForDevelopment",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "lewihouse-7a0d7.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "lewihouse-7a0d7",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "lewihouse-7a0d7.appspot.com",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "1083948271029",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:1083948271029:web:abcdef123456",
};

// Initialize Singleton Firebase App
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);

export const PROPERTY_ID = "lewi_house_main";
export const PROPERTY_PATH = `properties/${PROPERTY_ID}`;

// Connect to Local Emulators if configured
if (process.env.REACT_APP_USE_FIREBASE_EMULATOR === "true") {
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
  connectAuthEmulator(auth, "http://127.0.0.1:9099");
}
