"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllMemories = exports.getMemory = exports.setMemory = exports.getRecentMessages = exports.insertMessage = void 0;
const firebase_js_1 = require("./firebase.js");
const firestore_1 = require("firebase-admin/firestore");
// All data is isolated per Telegram user ID (userId)
/**
 * Inserta un nuevo mensaje en el historial del usuario.
 */
const insertMessage = async (userId, msg) => {
    try {
        const db = (0, firebase_js_1.getDb)();
        // Limpiar el objeto para Firestore (evitar undefined o funciones)
        const cleanMsg = JSON.parse(JSON.stringify({
            role: msg.role,
            content: msg.content || null,
            name: msg.name || null,
            tool_call_id: msg.tool_call_id || null,
            tool_calls: msg.tool_calls || null,
            timestamp: firestore_1.FieldValue.serverTimestamp(),
        }));
        await db.collection("messages").doc(userId).collection("history").add(cleanMsg);
    }
    catch (error) {
        console.error("❌ Error guardando mensaje en Firestore:", error);
    }
};
exports.insertMessage = insertMessage;
/**
 * Obtiene los últimos X mensajes del historial del usuario.
 */
const getRecentMessages = async (userId, limit = 20) => {
    try {
        const db = (0, firebase_js_1.getDb)();
        const snapshot = await db
            .collection("messages").doc(userId).collection("history")
            .orderBy("timestamp", "desc").limit(limit).get();
        const docs = snapshot.docs.reverse();
        return docs.map(doc => {
            const row = doc.data();
            const msg = { role: row.role, content: row.content };
            if (row.name)
                msg.name = row.name;
            if (row.tool_call_id)
                msg.tool_call_id = row.tool_call_id;
            if (row.tool_calls)
                msg.tool_calls = row.tool_calls;
            return msg;
        });
    }
    catch (error) {
        console.error("❌ Error leyendo mensajes de Firestore:", error);
        return [];
    }
};
exports.getRecentMessages = getRecentMessages;
// Memory Queries (Long-term, per user)
const setMemory = async (userId, key, value) => {
    try {
        const db = (0, firebase_js_1.getDb)();
        await db.collection("memories").doc(userId).collection("data").doc(key).set({
            key,
            value,
            timestamp: firestore_1.FieldValue.serverTimestamp()
        }, { merge: true });
    }
    catch (error) {
        console.error("❌ Error guardando memoria en Firestore:", error);
    }
};
exports.setMemory = setMemory;
const getMemory = async (userId, key) => {
    try {
        const db = (0, firebase_js_1.getDb)();
        const doc = await db.collection("memories").doc(userId).collection("data").doc(key).get();
        if (doc.exists) {
            return doc.data()?.value;
        }
        return null;
    }
    catch (error) {
        console.error(`❌ Error accediendo a memoria de key ${key}:`, error);
        return null;
    }
};
exports.getMemory = getMemory;
const getAllMemories = async (userId) => {
    try {
        const db = (0, firebase_js_1.getDb)();
        const snapshot = await db
            .collection("memories").doc(userId).collection("data")
            .orderBy("timestamp", "desc").get();
        return snapshot.docs.map(doc => {
            const data = doc.data();
            return { key: data.key, value: data.value };
        });
    }
    catch (error) {
        console.error("❌ Error leyendo memorias de Firestore:", error);
        return [];
    }
};
exports.getAllMemories = getAllMemories;
