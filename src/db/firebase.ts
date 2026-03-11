import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import path from "path";

// This will look for the service-account.json at the root of the project by default
const serviceAccountPath = path.resolve(process.cwd(), "./service-account.json");

export const initFirebase = () => {
    try {
        initializeApp({
            credential: cert(serviceAccountPath),
        });
        console.log("🔥 Firebase Admin conectado correctamente.");
    } catch (err: any) {
        console.error("❌ Falla al conectar a Firebase. Asegúrate de tener service-account.json en la raíz.", err.message);
        process.exit(1);
    }
};

export const db = getFirestore();
