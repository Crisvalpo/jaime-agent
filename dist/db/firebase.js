"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDb = exports.initFirebase = void 0;
const app_1 = require("firebase-admin/app");
const firestore_1 = require("firebase-admin/firestore");
const path_1 = __importDefault(require("path"));
// This will look for the service-account.json at the root of the project by default
const serviceAccountPath = path_1.default.resolve(process.cwd(), "./service-account.json");
const initFirebase = () => {
    try {
        // Avoid double-initialization if hot-reloading
        if ((0, app_1.getApps)().length === 0) {
            (0, app_1.initializeApp)({
                credential: (0, app_1.cert)(serviceAccountPath),
            });
        }
        console.log("🔥 Firebase Admin conectado correctamente.");
    }
    catch (err) {
        console.error("❌ Falla al conectar a Firebase. Asegúrate de tener service-account.json en la raíz.", err.message);
        process.exit(1);
    }
};
exports.initFirebase = initFirebase;
// Lazy getter – only called AFTER initFirebase()
let _db = null;
const getDb = () => {
    if (!_db) {
        _db = (0, firestore_1.getFirestore)();
    }
    return _db;
};
exports.getDb = getDb;
