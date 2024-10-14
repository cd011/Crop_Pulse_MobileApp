import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA34HLNqgnO1k5i_tSYecDiHWIW2o7Hb1k",
  authDomain: "crop-pulse.firebaseapp.com",
  projectId: "crop-pulse",
  storageBucket: "crop-pulse.appspot.com",
  messagingSenderId: "74116036120",
  appId: "1:74116036120:web:f198fa7672269b381ef56d",
  measurementId: "G-MRQ848TZFD",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
