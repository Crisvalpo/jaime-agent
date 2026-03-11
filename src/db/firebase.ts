import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import path from "path";

// This will look for the service-account.json at the root of the project by default
const serviceAccountPath = path.resolve(process.cwd(), "./service-account.json");

export const initFirebase = () => {
    try {
        // Avoid double-initialization if hot-reloading
        if (getApps().length === 0) {
            initializeApp({
                credential: cert(serviceAccountPath),
            });
        }
        console.log("🔥 Firebase Admin conectado correctamente.");
    } catch (err: any) {
        console.error("❌ Falla al conectar a Firebase. Asegúrate de tener service-account.json en la raíz.", err.message);
        process.exit(1);
    }
};

// Lazy getter – only called AFTER initFirebase()
let _db: Firestore | null = null;
export const getDb = (): Firestore => {
    if (!_db) {
        _db = getFirestore();
    }
    return _db;
};
