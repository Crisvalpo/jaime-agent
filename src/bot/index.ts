import { Bot } from "grammy";
import { config } from "../config.js";
import { authMiddleware } from "./auth.js";
import { handleMessage, handleVincular } from "./handlers.js";

export const bot = new Bot(config.TELEGRAM_BOT_TOKEN);

// Apply middleware
bot.use(authMiddleware);

// Define commands and handlers
bot.command("start", async (ctx) => {
    await ctx.reply("soy el bot de luke app estoy para notificarte los cambios de LukeAPP.");
});

bot.command("help", async (ctx) => {
    await ctx.reply("Comandos disponibles:\n/start - Iniciar bot\n/vincular [Usuario] [Rol] - Vincular tu ID de Telegram");
});

bot.command("vincular", handleVincular);

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
