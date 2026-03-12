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
        console.log("📥 [Webhook] Payload recibido:", JSON.stringify(payload, null, 2));

        const { telegramId, message } = payload;

        if (!telegramId || !message) {
            console.warn("⚠️ Webhook recibido con campos faltantes:", payload);
            return res.status(400).json({ error: "Faltan campos telegramId o message" });
        }

        console.log(`[Webhook] Enviando notificación a ${telegramId}: ${message}`);

        // Use bot.api for direct messaging outside of a context
        await bot.api.sendMessage(telegramId, message, { parse_mode: "Markdown" });

        return res.status(200).json({ status: "OK" });
    } catch (error: any) {
        console.error("❌ Error en Webhook AppSheet:", error);
        if (error.response) {
            console.error("Detalle del error de Telegram API:", JSON.stringify(error.response, null, 2));
        }
        return res.status(500).json({ error: error.message });
    }
});

export default router;
