import { Bot } from "grammy";
import { config } from "../config.js";
import { authMiddleware } from "./auth.js";
import { handleMessage } from "./handlers.js";

const bot = new Bot(config.TELEGRAM_BOT_TOKEN);

// Apply middleware
bot.use(authMiddleware);

// Define commands and handlers
bot.command("start", async (ctx) => {
    await ctx.reply("👋 ¡Hola! Soy jAIme, tu asistente personal. Estoy listo.");
});

bot.command("help", async (ctx) => {
    await ctx.reply("Solo dime lo que necesitas y me encargaré de pensarlo y actuar.");
});

// Main message handler
bot.on("message:text", handleMessage);

// Catch errors
bot.catch((err) => {
    console.error(`🛑 Bot Error:`, err);
});

export const startBot = async () => {
    console.log("🚀 Iniciando bot de Telegram de jAIme...");
    await bot.start({
        onStart: (botInfo) => {
            console.log(`✅ Bot conectado como @${botInfo.username}`);
        }
    });
};
