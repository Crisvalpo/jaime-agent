import { getDb } from "./firebase.js";
import { FieldValue } from "firebase-admin/firestore";
import type { ChatCompletionMessageParam } from "openai/resources/index.js";

// All data is isolated per Telegram user ID (userId)

/**
 * Inserta un nuevo mensaje en el historial del usuario.
 */
export const insertMessage = async (userId: string, msg: {
    role: "system" | "user" | "assistant" | "tool";
    content: string | null;
}) => {
    try {
        const db = getDb();
        await db.collection("messages").doc(userId).collection("history").add({
            role: msg.role,
            content: msg.content || null,
            timestamp: FieldValue.serverTimestamp(),
        });
    } catch (error) {
        console.error("❌ Error guardando mensaje en Firestore:", error);
    }
};

/**
 * Obtiene los últimos X mensajes del historial del usuario.
 */
export const getRecentMessages = async (userId: string, limit = 20): Promise<ChatCompletionMessageParam[]> => {
    try {
        const db = getDb();
        const snapshot = await db
            .collection("messages").doc(userId).collection("history")
            .orderBy("timestamp", "desc").limit(limit).get();

        const docs = snapshot.docs.reverse();

        return docs.map(doc => {
            const row = doc.data();
            return { role: row.role, content: row.content } as ChatCompletionMessageParam;
        });
    } catch (error) {
        console.error("❌ Error leyendo mensajes de Firestore:", error);
        return [];
    }
};

// Memory Queries (Long-term, per user)

export const setMemory = async (userId: string, key: string, value: string) => {
    try {
        const db = getDb();
        await db.collection("memories").doc(userId).collection("data").doc(key).set({
            key,
            value,
            timestamp: FieldValue.serverTimestamp()
        }, { merge: true });
    } catch (error) {
        console.error("❌ Error guardando memoria en Firestore:", error);
    }
};

export const getMemory = async (userId: string, key: string): Promise<string | null> => {
    try {
        const db = getDb();
        const doc = await db.collection("memories").doc(userId).collection("data").doc(key).get();
        if (doc.exists) {
            return doc.data()?.value as string;
        }
        return null;
    } catch (error) {
        console.error(`❌ Error accediendo a memoria de key ${key}:`, error);
        return null;
    }
};

export const getAllMemories = async (userId: string): Promise<{ key: string; value: string }[]> => {
    try {
        const db = getDb();
        const snapshot = await db
            .collection("memories").doc(userId).collection("data")
            .orderBy("timestamp", "desc").get();
        return snapshot.docs.map(doc => {
            const data = doc.data();
            return { key: data.key, value: data.value };
        });
    } catch (error) {
        console.error("❌ Error leyendo memorias de Firestore:", error);
        return [];
    }
};
