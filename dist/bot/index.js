"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startBot = void 0;
const grammy_1 = require("grammy");
const config_js_1 = require("../config.js");
const auth_js_1 = require("./auth.js");
const handlers_js_1 = require("./handlers.js");
const bot = new grammy_1.Bot(config_js_1.config.TELEGRAM_BOT_TOKEN);
// Apply middleware
bot.use(auth_js_1.authMiddleware);
// Define commands and handlers
bot.command("start", async (ctx) => {
    await ctx.reply("👋 ¡Hola! Soy jAIme, tu asistente personal. Estoy listo.");
});
bot.command("help", async (ctx) => {
    await ctx.reply("Solo dime lo que necesitas y me encargaré de pensarlo y actuar.");
});
// Main message handler
bot.on("message:text", handlers_js_1.handleMessage);
// Catch errors
bot.catch((err) => {
    console.error(`🛑 Bot Error:`, err);
});
const startBot = async () => {
    console.log("🚀 Iniciando bot de Telegram de jAIme...");
    await bot.start({
        onStart: (botInfo) => {
            console.log(`✅ Bot conectado como @${botInfo.username}`);
        }
    });
};
exports.startBot = startBot;
