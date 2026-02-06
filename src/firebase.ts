import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyAKJRlAdy8_xo2DSaSS87nOT2f0NG9n9UY",
  authDomain: "tugofwar-b3656.firebaseapp.com",
  databaseURL: "https://tugofwar-b3656-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "tugofwar-b3656",
  storageBucket: "tugofwar-b3656.firebasestorage.app",
  messagingSenderId: "199231000046",
  appId: "1:199231000046:web:cc5c078a761ba50c0452ff"
};

const app = initializeApp(firebaseConfig);

export const database = getDatabase(app);
