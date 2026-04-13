import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore, collection, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json' with { type: 'json' };

// Initialize Firebase SDK
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Test connection to Firestore
async function testConnection() {
  try {
    // Attempt to read a dummy doc to verify connection
    await getDocFromServer(doc(db, 'system', 'connection_test'));
    console.log("Firestore connection verified.");
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. The client is offline.");
    }
    // Other errors might be expected if the doc doesn't exist, which is fine for a connection test
  }
}

testConnection();

// Sign in anonymously by default for basic tracking if needed
signInAnonymously(auth).catch((error) => {
  if (error.code === 'auth/admin-restricted-operation') {
    console.warn(
      "Anonymous Authentication is not enabled in the Firebase Console. " +
      "Please enable it under Authentication > Sign-in method to support anonymous tracking. " +
      "The app will still function for reading/posting if rules allow public access."
    );
  } else {
    console.error("Anonymous sign-in failed:", error);
  }
});
