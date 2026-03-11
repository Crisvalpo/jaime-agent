import { Context } from "grammy";
import { runAgentLoop } from "../agent/loop.js";

export const handleMessage = async (ctx: Context) => {
    if (!ctx.message?.text) {
        await ctx.reply("Solo puedo procesar texto por ahora.");
        return;
    }

    const userText = ctx.message.text;
    console.log(`[Telegram] User says: ${userText}`);

    // Send typing indicator
    await ctx.replyWithChatAction("typing");

    try {
        const finalReply = await runAgentLoop(userText);
        await ctx.reply(finalReply, { parse_mode: "Markdown" });
    } catch (error: any) {
        console.error("❌ Error in agent loop execution:", error);
        await ctx.reply(`Ocurrió un error en mi procesamiento interno: ${error.message}`);
    }
};
