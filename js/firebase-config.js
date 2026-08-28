// =============================================
// NAMO MEDICAL STORE - Firebase Configuration
// Firestore & Firebase Authentication
// =============================================

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import { getAnalytics, isSupported } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-analytics.js';

const firebaseConfig = {
  apiKey: 'AIzaSyCjX7bm3iywhL35UKLhu7563J2tEVVPzPY',
  authDomain: 'namo-medical-store.firebaseapp.com',
  projectId: 'namo-medical-store',
  storageBucket: 'namo-medical-store.firebasestorage.app',
  messagingSenderId: '810733538895',
  appId: '1:810733538895:web:f36f182897a47e2c72643a',
  measurementId: 'G-KBF8RTGVP6',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Analytics only when supported (browser + HTTPS / localhost)
isSupported()
  .then((ok) => {
    if (ok) getAnalytics(app);
  })
  .catch(() => {
    /* Analytics unavailable — ignore */
  });

export { app, db, auth };

