"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startBot = exports.bot = void 0;
const grammy_1 = require("grammy");
const config_js_1 = require("../config.js");
const auth_js_1 = require("./auth.js");
const handlers_js_1 = require("./handlers.js");
exports.bot = new grammy_1.Bot(config_js_1.config.TELEGRAM_BOT_TOKEN);
// Apply middleware
exports.bot.use(auth_js_1.authMiddleware);
// Define commands and handlers
exports.bot.command("start", async (ctx) => {
    await ctx.reply("🤖 ¡Hola! Soy **jAIme**, tu asistente de notificaciones oficiales de **LukeAPP**.\n\nMi función es mantenerte informado en tiempo real sobre cambios críticos, como nuevas revisiones de isométricos y alertas de gestión.\n\nPara comenzar, usa el comando `/vincular \"Tu Nombre\"` para registrarte. ¡Es todo lo que necesito!", { parse_mode: "Markdown" });
});
exports.bot.command("help", async (ctx) => {
    const helpText = `
🤖 **Comandos disponibles:**
- \`/vincular Tu Nombre\` → Te conecta con tu perfil en LukeAPP (ej. \`/vincular Juan Perez\`)
- \`/reporte\` → Genera el resumen diario de Piping ahora mismo.
- \`/uniones [tag]\` (o \`/junta\`) → Consulta el estado de una unión térmica (Requiere perfil).
- \`/help\` → Muestra este mensaje.
`;
    await ctx.reply(helpText, { parse_mode: "Markdown" });
});
exports.bot.command("vincular", handlers_js_1.handleVincular);
exports.bot.command("reporte", handlers_js_1.handleReporte);
exports.bot.command("uniones", handlers_js_1.handleUniones);
exports.bot.command("junta", handlers_js_1.handleUniones);
// Main message handler
exports.bot.on("message:text", handlers_js_1.handleMessage);
// Catch errors
exports.bot.catch((err) => {
    console.error(`🛑 Bot Error:`, err);
});
const startBot = async () => {
    console.log("🚀 Iniciando bot de Telegram de jAIme...");
    await exports.bot.start({
        onStart: (botInfo) => {
            console.log(`✅ Bot conectado como @${botInfo.username}`);
        }
    });
};
exports.startBot = startBot;
