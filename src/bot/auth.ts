import { Context, NextFunction } from "grammy";
import { config } from "../config.js";

// Whitelist middleware
export const authMiddleware = async (ctx: Context, next: NextFunction) => {
    const userId = ctx.from?.id;

    if (!userId) {
        console.warn("⚠️ Received message with no user ID. Ignoring.");
        return;
    }

    if (!config.TELEGRAM_ALLOWED_USER_IDS.includes(userId)) {
        console.warn(`🛑 Unauthorized access attempt by User ID: ${userId} (@${ctx.from?.username || "unknown"})`);
        // Optional: Send a generic rejection message or simply ignore them.
        // await ctx.reply("❌ No tienes autorización para usar este bot.");
        return;
    }

    // User is allowed, proceed to the next handler
    await next();
};
