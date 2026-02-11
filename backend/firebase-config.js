/**
 * Firebase Configuration
 * Initialize Firebase services for BeyondBinary ActivityApp
 */

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBESNfj6xQfRRwfIld5mCDXJpLHkZaoeeo",
  authDomain: "beyondbinary-a1591.firebaseapp.com",
  projectId: "beyondbinary-a1591",
  storageBucket: "beyondbinary-a1591.firebasestorage.app",
  messagingSenderId: "445194813719",
  appId: "1:445194813719:web:09537a356ed94f63b0b752",
  measurementId: "G-SHV2M2HHYQ"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize services
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Enable offline persistence
db.enablePersistence()
  .catch((err) => {
    if (err.code == 'failed-precondition') {
      console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
    } else if (err.code == 'unimplemented') {
      console.warn('The current browser does not support persistence.');
    }
  });

// Export for use in other files
if (typeof window !== 'undefined') {
  window.auth = auth;
  window.db = db;
  window.storage = storage;
  window.firebase = firebase;
}

console.log('✅ Firebase initialized successfully');
console.log('📊 Project: beyondbinary-a1591');
