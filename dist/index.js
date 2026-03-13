"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const firebase_js_1 = require("./db/firebase.js");
const index_js_1 = require("./bot/index.js");
const config_js_1 = require("./config.js");
const express_1 = __importDefault(require("express"));
const webhook_js_1 = __importDefault(require("./api/webhook.js"));
const bootstrap = async () => {
    try {
        console.log("----------------------------------------");
        console.log("🤖 Iniciando jAIme - Agente Personal...");
        console.log("----------------------------------------");
        // 1. Initialize Database
        (0, firebase_js_1.initFirebase)();
        // 2. Start Bot
        const botPromise = (0, index_js_1.startBot)();
        // 3. Start Webhook Server
        const app = (0, express_1.default)();
        // Health check endpoint (Top level)
        app.get("/health", (req, res) => {
            res.status(200).json({ status: "OK", timestamp: new Date().toISOString() });
        });
        app.use("/api/webhook", webhook_js_1.default);
        const PORT = config_js_1.config.PORT;
        app.listen(PORT, "0.0.0.0", () => {
            console.log(`📡 Servidor de Webhooks activo en puerto ${PORT}`);
            console.log(`🏠 Health check disponible en: http://localhost:${PORT}/health`);
        });
        await botPromise;
        console.log("----------------------------------------");
        console.log("✨ ¡jAIme está corriendo y listo!");
        console.log("----------------------------------------");
    }
    catch (error) {
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
