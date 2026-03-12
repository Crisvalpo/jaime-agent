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
        const { telegramId, notificationType, message } = payload;

        if (!message) {
            return res.status(400).json({ error: "Falta el campo message" });
        }

        let recipients: string[] = [];

        if (telegramId) {
            recipients.push(telegramId);
        } else if (notificationType) {
            console.log(`[Webhook] Buscando destinatarios para: ${notificationType}`);
            const { getNotificationRecipients } = await import("../agent/appsheet.js");
            recipients = await getNotificationRecipients(notificationType);
        }

        if (recipients.length === 0) {
            console.warn("⚠️ No se encontraron destinatarios para la notificación:", payload);
            return res.status(200).json({ status: "No recipients found" });
        }

        console.log(`[Webhook] Enviando notificación a ${recipients.length} usuarios`);

        const sendPromises = recipients.map(async (id) => {
            try {
                await bot.api.sendMessage(id, message);
            } catch (err: any) {
                console.error(`❌ Error enviando a ${id}:`, err.message);
            }
        });

        await Promise.all(sendPromises);

        return res.status(200).json({ status: "OK", sentCount: recipients.length });
    } catch (error: any) {
        console.error("❌ Error en Webhook AppSheet:", error);
        return res.status(500).json({ error: error.message });
    }
});

export default router;
