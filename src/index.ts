import { initFirebase } from "./db/firebase.js";
import { startBot } from "./bot/index.js";
import { config } from "./config.js";
import express from "express";
import appsheetWebhook from "./api/webhook.js";

const bootstrap = async () => {
    try {
        console.log("----------------------------------------");
        console.log("🤖 Iniciando jAIme - Agente Personal...");
        console.log("----------------------------------------");

        // 1. Initialize Database
        initFirebase();

        // 2. Start Bot
        const botPromise = startBot();

        // 3. Start Webhook Server
        const app = express();

        // Health check endpoint (Top level)
        app.get("/health", (req, res) => {
            res.status(200).json({ status: "OK", timestamp: new Date().toISOString() });
        });

        app.use("/api/webhook", appsheetWebhook);

        const PORT = config.PORT;
        app.listen(PORT, "0.0.0.0", () => {
            console.log(`📡 Servidor de Webhooks activo en puerto ${PORT}`);
            console.log(`🏠 Health check disponible en: http://localhost:${PORT}/health`);
        });

        await botPromise;

        console.log("----------------------------------------");
        console.log("✨ ¡jAIme está corriendo y listo!");
        console.log("----------------------------------------");

    } catch (error) {
        console.error("🔥 Error fatal durante la inicialización:", error);
        process.exit(1);
    }
};

// Handle process termination gracefully
process.once("SIGINT", () => {
    console.log("Deteniendo bot (SIGINT)...");
    process.exit(0);
});
process.once("SIGTERM", () => {
    console.log("Deteniendo bot (SIGTERM)...");
    process.exit(0);
});

bootstrap();
