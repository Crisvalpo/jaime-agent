"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllMemories = exports.getMemory = exports.setMemory = exports.clearMessages = exports.getRecentMessages = exports.insertMessage = void 0;
const firebase_js_1 = require("./firebase.js");
const firestore_1 = require("firebase-admin/firestore");
/**
 * Inserta un nuevo mensaje en el historial.
 */
const insertMessage = async (msg) => {
    try {
        const db = (0, firebase_js_1.getDb)();
        const payload = {
            role: msg.role,
            content: msg.content || null,
            timestamp: firestore_1.FieldValue.serverTimestamp(),
        };
        if (msg.tool_calls)
            payload.tool_calls = msg.tool_calls;
        if (msg.tool_call_id)
            payload.tool_call_id = msg.tool_call_id;
        if (msg.name)
            payload.name = msg.name;
        await db.collection("messages").add(payload);
    }
    catch (error) {
        console.error("❌ Error guardando mensaje en Firestore:", error);
    }
};
exports.insertMessage = insertMessage;
/**
 * Obtiene los últimos X mensajes del historial conversacional
 */
const getRecentMessages = async (limit = 20) => {
    try {
        const db = (0, firebase_js_1.getDb)();
        const snapshot = await db.collection("messages").orderBy("timestamp", "desc").limit(limit).get();
        // Reverse them to be in chronological order
        const docs = snapshot.docs.reverse();
        return docs.map(doc => {
            const row = doc.data();
            const msg = { role: row.role };
            if (row.content)
                msg.content = row.content;
            if (row.tool_calls)
                msg.tool_calls = JSON.parse(row.tool_calls);
            if (row.tool_call_id)
                msg.tool_call_id = row.tool_call_id;
            if (row.name)
                msg.name = row.name;
            return msg;
        });
    }
    catch (error) {
        console.error("❌ Error leyendo mensajes de Firestore:", error);
        return [];
    }
};
exports.getRecentMessages = getRecentMessages;
/**
 * Limpia el historial entero de Firestore
 */
const clearMessages = async () => {
    const db = (0, firebase_js_1.getDb)();
    const snapshot = await db.collection("messages").get();
    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
    });
    await batch.commit();
};
exports.clearMessages = clearMessages;
// Memory Queries (Long-term)
const setMemory = async (key, value) => {
    try {
        const db = (0, firebase_js_1.getDb)();
        await db.collection("memories").doc(key).set({
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
const getMemory = async (key) => {
    try {
        const db = (0, firebase_js_1.getDb)();
        const doc = await db.collection("memories").doc(key).get();
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
const getAllMemories = async () => {
    try {
        const db = (0, firebase_js_1.getDb)();
        const snapshot = await db.collection("memories").orderBy("timestamp", "desc").get();
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
