import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyAvS4ekR50AhEPuXE2TOWcRrC96u8WGqi4",
  authDomain: "smart-cozy.firebaseapp.com",
  databaseURL: "https://smart-cozy-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "smart-cozy",
  storageBucket: "smart-cozy.firebasestorage.app",
  messagingSenderId: "1069475843065",
  appId: "1:1069475843065:web:50c8a0a38be5d0e7d4cb28",
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
