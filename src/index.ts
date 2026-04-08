import { initFirebase } from "./db/firebase.js";
import { startBot } from "./bot/index.js";
import { config } from "./config.js";
import express from "express";
import appsheetWebhook from "./api/webhook.js";
import cron from "node-cron";
import { runDailyPipingReport } from "./scheduler/pipingReport.js";

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

        // 4. Iniciar Programaciones (Cron Jobs) — ANTES del await para que no se bloquee
        // Ejecutar de Lunes a Viernes a las 19:00 hrs
        cron.schedule("0 19 * * 1-5", () => {
            console.log("⏰ Ejecutando cron job: PIPING_REPORTE_DIARIO (19:00)");
            runDailyPipingReport();
        }, {
            timezone: "America/Santiago"
        });
        console.log("⏰ Cron Jobs programados: PIPING_REPORTE_DIARIO (19:00 L-V America/Santiago)");

        console.log("----------------------------------------");
        console.log("✨ ¡jAIme está corriendo y listo!");
        console.log("----------------------------------------");

        // bot.start() bloquea indefinidamente — debe ser lo último
        await botPromise;

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
