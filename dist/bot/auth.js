"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
// Whitelist middleware
const authMiddleware = async (ctx, next) => {
    const userId = ctx.from?.id;
    if (!userId) {
        console.warn("⚠️ Received message with no user ID. Ignoring.");
        return;
    }
    // Permitimos acceso a cualquier usuario porque la seguridad
    // ahora depende del comando /vincular contra AppSheet.
    // if (!config.TELEGRAM_ALLOWED_USER_IDS.includes(userId)) {
    //     console.warn(`🛑 Unauthorized access attempt by User ID: ${userId} (@${ctx.from?.username || "unknown"})`);
    //     return;
    // }
    // User is allowed, proceed to the next handler
    await next();
};
exports.authMiddleware = authMiddleware;
