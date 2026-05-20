// =============================================
// REPLACE THESE VALUES WITH YOUR FIREBASE CONFIG
// Found in: Firebase Console > Project Settings > Your Apps
// =============================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAHgm_CKR26INfBKX7X4dtx0EKgUqzJR4w",
  authDomain: "mocktail-magic-baf9a.firebaseapp.com",
  projectId: "mocktail-magic-baf9a",
  storageBucket: "mocktail-magic-baf9a.firebasestorage.app",
  messagingSenderId: "441721350813",
  appId: "1:441721350813:web:817e0c4e8de655c9008274"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

