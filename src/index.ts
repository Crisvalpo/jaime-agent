import { initFirebase } from "./db/firebase.js";
import { startBot } from "./bot/index.js";

const bootstrap = async () => {
    try {
        console.log("----------------------------------------");
        console.log("🤖 Iniciando jAIme - Agente Personal...");
        console.log("----------------------------------------");

        // 1. Initialize Database
        initFirebase();

        // 2. Start Bot
        await startBot();

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
