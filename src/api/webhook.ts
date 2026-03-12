import express from "express";
import { bot } from "../bot/index.js";

const router = express.Router();

/**
 * AppSheet Webhook Endpoint
 * Expects JSON: { "telegramId": "12345", "message": "Tu spool ha sido liberado" }
 */
router.post("/appsheet", express.json(), async (req, res) => {
    try {
        const { telegramId, message } = req.body;

        if (!telegramId || !message) {
            console.warn("⚠️ Webhook recibido sin telegramId o message:", req.body);
            return res.status(400).json({ error: "Faltan campos telegramId o message" });
        }

        console.log(`[Webhook] Enviando notificación a ${telegramId}: ${message}`);

        // Use bot.api for direct messaging outside of a context
        await bot.api.sendMessage(telegramId, message, { parse_mode: "Markdown" });

        return res.status(200).json({ status: "OK" });
    } catch (error: any) {
        console.error("❌ Error en Webhook AppSheet:", error);
        return res.status(500).json({ error: error.message });
    }
});

export default router;
