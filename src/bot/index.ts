import { Bot } from "grammy";
import { config } from "../config.js";
import { authMiddleware } from "./auth.js";
import { handleMessage, handleVincular } from "./handlers.js";

export const bot = new Bot(config.TELEGRAM_BOT_TOKEN);

// Apply middleware
bot.use(authMiddleware);

// Define commands and handlers
bot.command("start", async (ctx) => {
    await ctx.reply("🤖 ¡Hola! Soy **jAIme**, tu asistente de notificaciones oficiales de **LukeAPP**.\n\nMi función es mantenerte informado en tiempo real sobre cambios críticos, como nuevas revisiones de isométricos y alertas de gestión.\n\nPara comenzar, usa el comando `/vincular \"Tu Nombre\"` para registrarte. ¡Es todo lo que necesito!", { parse_mode: "Markdown" });
});

bot.command("help", async (ctx) => {
    await ctx.reply("📌 **Comandos disponibles:**\n\n/start - Iniciar bot y ver bienvenida.\n/vincular \"Nombre Apellido\" - Vincular tu cuenta de LukeAPP usando solo tu nombre.", { parse_mode: "Markdown" });
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
