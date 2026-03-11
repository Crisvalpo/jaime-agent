"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const firebase_js_1 = require("./db/firebase.js");
const index_js_1 = require("./bot/index.js");
const bootstrap = async () => {
    try {
        console.log("----------------------------------------");
        console.log("🤖 Iniciando jAIme - Agente Personal...");
        console.log("----------------------------------------");
        // 1. Initialize Database
        (0, firebase_js_1.initFirebase)();
        // 2. Start Bot
        await (0, index_js_1.startBot)();
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
