import express from "express";
import { bot } from "../bot/index.js";

const router = express.Router();

/**
 * AppSheet Webhook Endpoint
 * Expects JSON: { "telegramId": "12345", "message": "Tu spool ha sido liberado" }
 */
router.post("/appsheet", express.json(), async (req, res) => {
    try {
        const payload = req.body;
        const { telegramId, message } = payload;

        if (!telegramId || !message) {
            console.warn("⚠️ Webhook recibido con campos faltantes:", payload);
            return res.status(400).json({ error: "Faltan campos telegramId o message" });
        }

        console.log(`[Webhook] Enviando notificación a ${telegramId}`);

        try {
            // Intento 1: Con Markdown
            await bot.api.sendMessage(telegramId, message, { parse_mode: "Markdown" });
        } catch (error: any) {
            if (error.description?.includes("can't parse entities")) {
                console.warn("⚠️ Markdown inválido, reintentando como texto plano...");
                // Intento 2: Texto plano (Fallback)
                await bot.api.sendMessage(telegramId, message);
            } else {
                throw error;
            }
        }

        return res.status(200).json({ status: "OK" });
    } catch (error: any) {
        console.error("❌ Error en Webhook AppSheet:", error);
        return res.status(500).json({ error: error.message });
    }
});

export default router;
