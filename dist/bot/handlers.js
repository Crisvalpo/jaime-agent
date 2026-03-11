"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleMessage = void 0;
const loop_js_1 = require("../agent/loop.js");
const handleMessage = async (ctx) => {
    if (!ctx.message?.text) {
        await ctx.reply("Solo puedo procesar texto por ahora.");
        return;
    }
    const userText = ctx.message.text;
    // Use Telegram user ID as the unique key for memory/conversation isolation
    const userId = ctx.from?.id.toString() ?? "unknown";
    console.log(`[Telegram] User ${userId} says: ${userText}`);
    await ctx.replyWithChatAction("typing");
    try {
        const finalReply = await (0, loop_js_1.runAgentLoop)(userId, userText);
        await ctx.reply(finalReply, { parse_mode: "Markdown" });
    }
    catch (error) {
        console.error(`❌ Error in agent loop for user ${userId}:`, error);
        await ctx.reply(`Ocurrió un error en mi procesamiento interno: ${error.message}`);
    }
};
exports.handleMessage = handleMessage;
