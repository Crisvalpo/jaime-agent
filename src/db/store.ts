import { getDb } from "./firebase.js";
import { FieldValue } from "firebase-admin/firestore";
import type { ChatCompletionMessageParam } from "openai/resources/index.js";

interface DbMessage {
    role: "system" | "user" | "assistant" | "tool";
    content: string | null;
    tool_calls?: string | null; // JSON string
    tool_call_id?: string | null;
    name?: string | null;
    timestamp?: FirebaseFirestore.FieldValue;
}

/**
 * Inserta un nuevo mensaje en el historial.
 */
export const insertMessage = async (msg: Omit<DbMessage, "timestamp">) => {
    try {
        const db = getDb();
        const payload: any = {
            role: msg.role,
            content: msg.content || null,
            timestamp: FieldValue.serverTimestamp(),
        };
        if (msg.tool_calls) payload.tool_calls = msg.tool_calls;
        if (msg.tool_call_id) payload.tool_call_id = msg.tool_call_id;
        if (msg.name) payload.name = msg.name;

        await db.collection("messages").add(payload);
    } catch (error) {
        console.error("❌ Error guardando mensaje en Firestore:", error);
    }
};

/**
 * Obtiene los últimos X mensajes del historial conversacional
 */
export const getRecentMessages = async (limit = 20): Promise<ChatCompletionMessageParam[]> => {
    try {
        const db = getDb();
        const snapshot = await db.collection("messages").orderBy("timestamp", "desc").limit(limit).get();

        // Reverse them to be in chronological order
        const docs = snapshot.docs.reverse();

        return docs.map(doc => {
            const row = doc.data();
            const msg: any = { role: row.role };

            if (row.content) msg.content = row.content;
            if (row.tool_calls) msg.tool_calls = JSON.parse(row.tool_calls);
            if (row.tool_call_id) msg.tool_call_id = row.tool_call_id;
            if (row.name) msg.name = row.name;

            return msg as ChatCompletionMessageParam;
        });
    } catch (error) {
        console.error("❌ Error leyendo mensajes de Firestore:", error);
        return [];
    }
};

/**
 * Limpia el historial entero de Firestore
 */
export const clearMessages = async () => {
    const db = getDb();
    const snapshot = await db.collection("messages").get();
    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
    });
    await batch.commit();
};

// Memory Queries (Long-term)

export const setMemory = async (key: string, value: string) => {
    try {
        const db = getDb();
        await db.collection("memories").doc(key).set({
            key,
            value,
            timestamp: FieldValue.serverTimestamp()
        }, { merge: true });
    } catch (error) {
        console.error("❌ Error guardando memoria en Firestore:", error);
    }
};

export const getMemory = async (key: string): Promise<string | null> => {
    try {
        const db = getDb();
        const doc = await db.collection("memories").doc(key).get();
        if (doc.exists) {
            return doc.data()?.value as string;
        }
        return null;
    } catch (error) {
        console.error(`❌ Error accediendo a memoria de key ${key}:`, error);
        return null;
    }
};

export const getAllMemories = async (): Promise<{ key: string; value: string }[]> => {
    try {
        const db = getDb();
        const snapshot = await db.collection("memories").orderBy("timestamp", "desc").get();
        return snapshot.docs.map(doc => {
            const data = doc.data();
            return { key: data.key, value: data.value };
        });
    } catch (error) {
        console.error("❌ Error leyendo memorias de Firestore:", error);
        return [];
    }
};
