import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from 'firebase/firestore';

// ✅ Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyB47OaMfeEJ_qLy17PZGFzbUolQyq5jyvc",
  authDomain: "krishi-connect-255fb.firebaseapp.com",
  projectId: "krishi-connect-255fb",
  storageBucket: "krishi-connect-255fb.appspot.com", // ✅ fix .app to .appspot.com
  messagingSenderId: "966110607430",
  appId: "1:966110607430:web:73b7ac48de3fc8299a3247"
};

// ✅ Initialize Firebase App
export const app = initializeApp(firebaseConfig);

// ✅ Use AsyncStorage for auth persistence in React Native
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

// ✅ Initialize Firestore
export const db = getFirestore(app);
