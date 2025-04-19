import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC0bMWINNGLLS6bfnK-hfRQwHFnBSJqMhI",
  authDomain: "fruitsforyou-10acc.firebaseapp.com",
  projectId: "fruitsforyou-10acc",
  storageBucket: "fruitsforyou-10acc.firebasestorage.app",
  messagingSenderId: "774475210821",
  appId: "1:774475210821:web:b70ceab6562385fa5f032c",
  measurementId: "G-6EMQ9TRW9N"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

export { app, analytics, db, auth, storage }; 