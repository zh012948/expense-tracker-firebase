// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAGoVceQFGbM0wGCCFsz938AP_-PknBiAw",
    authDomain: "expensetracker-dbb00.firebaseapp.com",
    projectId: "expensetracker-dbb00",
    storageBucket: "expensetracker-dbb00.firebasestorage.app",
    messagingSenderId: "944427845620",
    appId: "1:944427845620:web:0b32fc2fb2da605afe1ba1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);