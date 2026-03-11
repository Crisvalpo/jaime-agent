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
    console.log(`[Telegram] User says: ${userText}`);
    // Send typing indicator
    await ctx.replyWithChatAction("typing");
    try {
        const finalReply = await (0, loop_js_1.runAgentLoop)(userText);
        await ctx.reply(finalReply, { parse_mode: "Markdown" });
    }
    catch (error) {
        console.error("❌ Error in agent loop execution:", error);
        await ctx.reply(`Ocurrió un error en mi procesamiento interno: ${error.message}`);
    }
};
exports.handleMessage = handleMessage;
