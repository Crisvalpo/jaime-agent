import { Bot } from "grammy";
import { config } from "../config.js";
import { authMiddleware } from "./auth.js";
import { handleMessage, handleVincular, handleReporte } from "./handlers.js";

export const bot = new Bot(config.TELEGRAM_BOT_TOKEN);

// Apply middleware
bot.use(authMiddleware);

// Define commands and handlers
bot.command("start", async (ctx) => {
    await ctx.reply("🤖 ¡Hola! Soy **jAIme**, tu asistente de notificaciones oficiales de **LukeAPP**.\n\nMi función es mantenerte informado en tiempo real sobre cambios críticos, como nuevas revisiones de isométricos y alertas de gestión.\n\nPara comenzar, usa el comando `/vincular \"Tu Nombre\"` para registrarte. ¡Es todo lo que necesito!", { parse_mode: "Markdown" });
});

bot.command("help", async (ctx) => {
    const helpText = `
🤖 **Comandos disponibles:**
- \`/vincular Tu Nombre\` → Te conecta con tu perfil en LukeAPP (ej. \`/vincular Juan Perez\`)
- \`/reporte\` → Genera el resumen diario de Piping ahora mismo.
- \`/help\` → Muestra este mensaje.
`;
    await ctx.reply(helpText, { parse_mode: "Markdown" });
});

bot.command("vincular", handleVincular);
bot.command("reporte", handleReporte);

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
