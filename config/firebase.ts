import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyB47OaMfeEJ_qLy17PZGFzbUolQyq5jyvc",
    authDomain: "krishi-connect-255fb.firebaseapp.com",
    projectId: "krishi-connect-255fb",
    storageBucket: "krishi-connect-255fb.firebasestorage.app",
    messagingSenderId: "966110607430",
    appId: "1:966110607430:web:73b7ac48de3fc8299a3247"
  };

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Export Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);