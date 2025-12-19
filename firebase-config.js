import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCUKkqGsi-OOJympY5T-bzs_BJRUmo0vJs",
  authDomain: "gudanggacor-e8ee4.firebaseapp.com",
  projectId: "gudanggacor-e8ee4",
  storageBucket: "gudanggacor-e8ee4.firebasestorage.app",
  messagingSenderId: "91622916196",
  appId: "1:91622916196:web:987a45d5ad6eb95c2adf71"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Config Cloudinary Lo
export const CLOUD_NAME = "dddjueqrh";
export const UPLOAD_PRESET = "gudang_gacor_preset";