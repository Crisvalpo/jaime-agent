"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const index_js_1 = require("../bot/index.js");
const router = express_1.default.Router();
/**
 * AppSheet Webhook Endpoint
 * Expects JSON: { "telegramId": "12345", "message": "Tu spool ha sido liberado" }
 */
router.get("/health", (req, res) => {
    res.status(200).json({ status: "OK", service: "Webhook API" });
});
router.post("/appsheet", express_1.default.json(), async (req, res) => {
    try {
        const payload = req.body;
        console.log(`[Webhook] Payload recibido:`, JSON.stringify(payload, null, 2));
        const { telegramId, notificationType, message } = payload;
        if (!message) {
            return res.status(400).json({ error: "Falta el campo message" });
        }
        let recipients = [];
        if (telegramId) {
            recipients.push(telegramId);
        }
        else if (notificationType) {
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
                await index_js_1.bot.api.sendMessage(id, message);
            }
            catch (err) {
                console.error(`❌ Error enviando a ${id}:`, err.message);
            }
        });
        await Promise.all(sendPromises);
        return res.status(200).json({ status: "OK", sentCount: recipients.length });
    }
    catch (error) {
        console.error("❌ Error en Webhook AppSheet:", error);
        return res.status(500).json({ error: error.message });
    }
});
exports.default = router;
