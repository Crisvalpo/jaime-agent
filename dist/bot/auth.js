"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const config_js_1 = require("../config.js");
// Whitelist middleware
const authMiddleware = async (ctx, next) => {
    const userId = ctx.from?.id;
    if (!userId) {
        console.warn("⚠️ Received message with no user ID. Ignoring.");
        return;
    }
    if (!config_js_1.config.TELEGRAM_ALLOWED_USER_IDS.includes(userId)) {
        console.warn(`🛑 Unauthorized access attempt by User ID: ${userId} (@${ctx.from?.username || "unknown"})`);
        // Optional: Send a generic rejection message or simply ignore them.
        // await ctx.reply("❌ No tienes autorización para usar este bot.");
        return;
    }
    // User is allowed, proceed to the next handler
    await next();
};
exports.authMiddleware = authMiddleware;
