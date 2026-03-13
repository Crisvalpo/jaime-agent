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
    await ctx.reply("Soy jAIme estoy para notificarte los cambios y avances en LukeAPP-Andina .");
});
exports.bot.command("help", async (ctx) => {
    await ctx.reply("Comandos disponibles:\n/start - Iniciar bot\n/vincular \"Nombre Apellido\" - Vincular tu ID de Telegram");
});
exports.bot.command("vincular", handlers_js_1.handleVincular);
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
