import express from "express";
import { bot } from "../bot/index.js";

const router = express.Router();

/**
 * AppSheet Webhook Endpoint
 * Expects JSON: { "telegramId": "12345", "message": "Tu spool ha sido liberado" }
 */
router.post("/appsheet", express.text({ type: 'application/json' }), async (req, res) => {
    try {
        const rawBody = req.body;
        console.log("📥 [Webhook] Raw Body recibido:", rawBody);

        let payload;
        try {
            payload = JSON.parse(rawBody);
        } catch (e: any) {
            console.error("❌ Error parseando JSON:", e.message);
            return res.status(400).json({ error: "JSON malformado", details: e.message, raw: rawBody });
        }

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
