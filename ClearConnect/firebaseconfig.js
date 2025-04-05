// Import the functions you need from the Firebase SDKs
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
import { getStorage } from "firebase/storage";


// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA8VL21rJ8KdeZph3evN4OwqB5JrpHW9zY",
  authDomain: "healthguard-b70e1.firebaseapp.com",
  projectId: "healthguard-b70e1",
  //storageBucket: "healthguard-b70e1.appspot.com",
  storageBucket: "healthguard-b70e1.firebasestorage.app",
  //storageBucket: "healthguard-b70e1.appspot.com",
  messagingSenderId: "104859517598",
  appId: "1:104859517598:web:5295047d134a5f97f6718f",
  measurementId: "G-C9HMQ7M5BB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);  // Initialize Firestore
const analytics = getAnalytics(app);
const storage = getStorage(app);

// Export Firestore instance
export { db, analytics,storage };
