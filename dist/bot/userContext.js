"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearUserCache = exports.getUserProfile = void 0;
const config_js_1 = require("../config.js");
// Cache en memoria: telegramId → perfil del usuario
const userCache = new Map();
/**
 * Obtiene el perfil del usuario por su Telegram ID.
 * Usa cache en memoria para evitar consultas repetidas a AppSheet.
 */
const getUserProfile = async (telegramId) => {
    // 1. Verificar cache primero
    if (userCache.has(telegramId)) {
        return userCache.get(telegramId);
    }
    // 2. Consultar AppSheet
    try {
        const url = `https://api.appsheet.com/api/v2/apps/${config_js_1.config.APPSHEET_APP_ID}/tables/LIST_usuariosApp_MS/Action`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'ApplicationAccessKey': config_js_1.config.APPSHEET_ACCESS_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                Action: "Find",
                Properties: { Locale: "es-ES" },
                Rows: []
            })
        });
        if (!response.ok)
            return null;
        const data = await response.json();
        if (!Array.isArray(data))
            return null;
        const found = data.find((u) => u.TELEGRAM_ID === telegramId);
        if (!found)
            return null;
        const profile = {
            USUARIO: found.USUARIO || found.NOMBRE || '',
            ROL: Array.isArray(found.ROL) ? found.ROL.join(', ') : (found.ROL || ''),
            TELEGRAM_ID: telegramId
        };
        // 3. Guardar en cache
        userCache.set(telegramId, profile);
        console.log(`[UserContext] Perfil cargado: ${profile.USUARIO} (${profile.ROL})`);
        return profile;
    }
    catch (err) {
        console.error('[UserContext] Error consultando perfil:', err);
        return null;
    }
};
exports.getUserProfile = getUserProfile;
/**
 * Invalida el cache de un usuario (usar tras /vincular para recargar perfil).
 */
const clearUserCache = (telegramId) => {
    userCache.delete(telegramId);
    console.log(`[UserContext] Cache limpiado para: ${telegramId}`);
};
exports.clearUserCache = clearUserCache;
