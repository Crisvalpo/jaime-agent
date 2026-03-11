import { Context } from "grammy";
import { runAgentLoop } from "../agent/loop.js";

export const handleMessage = async (ctx: Context) => {
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
        const finalReply = await runAgentLoop(userId, userText);
        await ctx.reply(finalReply, { parse_mode: "Markdown" });
    } catch (error: any) {
        console.error(`❌ Error in agent loop for user ${userId}:`, error);
        await ctx.reply(`Ocurrió un error en mi procesamiento interno: ${error.message}`);
    }
};
