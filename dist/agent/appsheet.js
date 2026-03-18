"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNotificationRecipients = exports.updateAppsheetTelegramId = exports.findAppsheetUser = exports.appsheetTools = void 0;
const config_js_1 = require("../config.js");
// Eliminamos las definiciones de herramientas para el agente IA, ya que el bot ahora es puramente robótico.
exports.appsheetTools = {};
/**
 * Helper to find a user by Usuario and Rol
 */
const findAppsheetUser = async (usuario) => {
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
    if (!response.ok) {
        console.error(`[AppSheet API] FAIL: HTTP ${response.status} ${response.statusText}`);
        const text = await response.text();
        console.error(`[AppSheet API] Body:`, text);
        return null;
    }
    const data = await response.json();
    if (!Array.isArray(data)) {
        console.error(`[AppSheet API] FAIL: Data is not an array. Data:`, data);
        return null;
    }
    console.log(`[AppSheet API] Respuesta (${data.length} filas obtenidas)`);
    if (data.length > 0) {
        console.log(`[AppSheet API] Ejemplo de fila (1):`, JSON.stringify(data[0]));
    }
    // Normalizar: Trim, minúsculas y convertir múltiples espacios en uno solo
    const target = usuario.trim().toLowerCase().replace(/\s+/g, ' ');
    console.log(`[AppSheet API] Query normalizado: "${target}"`);
    const user = data.find((u) => {
        if (!u.USUARIO)
            return false;
        const normalized = u.USUARIO.toString().trim().toLowerCase().replace(/\s+/g, ' ');
        if (normalized.includes(target) || target.includes(normalized)) {
            console.log(`[AppSheet API] Match parcial encontrado: "${normalized}" <=> "${target}"`);
        }
        return normalized === target;
    });
    if (user) {
        console.log(`[AppSheet API] ¡Match exacto! Encontrado:`, user.USUARIO);
    }
    else {
        console.log(`[AppSheet API] No hubo match exacto para "${target}"`);
    }
    return user;
};
exports.findAppsheetUser = findAppsheetUser;
/**
 * Helper to update the TELEGRAM_ID for a specific user row
 */
/**
 * Helper to update the TELEGRAM_ID for a specific user row
 * We use USUARIO as the key for identifying the row.
 */
const updateAppsheetTelegramId = async (usuario, telegramId) => {
    const url = `https://api.appsheet.com/api/v2/apps/${config_js_1.config.APPSHEET_APP_ID}/tables/LIST_usuariosApp_MS/Action`;
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'ApplicationAccessKey': config_js_1.config.APPSHEET_ACCESS_KEY,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            Action: "Edit",
            Properties: { Locale: "es-ES" },
            Rows: [
                {
                    "USUARIO": usuario,
                    "TELEGRAM_ID": telegramId
                }
            ]
        })
    });
    if (!response.ok) {
        const errorText = await response.text();
        console.error(`[AppSheet API Error] Status: ${response.status}, Body: ${errorText}`);
        return false;
    }
    return true;
};
exports.updateAppsheetTelegramId = updateAppsheetTelegramId;
/**
 * Gets all Telegram IDs for users that have a role enabled for a specific notification type
 */
const getNotificationRecipients = async (notificationType) => {
    try {
        // 1. Obtener roles activos para este tipo de notificación
        const configUrl = `https://api.appsheet.com/api/v2/apps/${config_js_1.config.APPSHEET_APP_ID}/tables/CONFIG_Notificaciones/Action`;
        const configRes = await fetch(configUrl, {
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
        if (!configRes.ok)
            return [];
        const configData = await configRes.json();
        // Obtenemos todos los roles habilitados (soportando si Rol es una lista separada por comas)
        const activeRolesSet = new Set();
        configData
            .filter((c) => c.ID_NOTIFICACIONES === notificationType && (c.ACTIVO === "true" || c.ACTIVO === true || c.ACTIVO === "Y" || c.ACTIVO === "VERDADERO"))
            .forEach((c) => {
            if (c.ROL) {
                c.ROL.split(",").forEach((r) => activeRolesSet.add(r.trim().toLowerCase()));
            }
        });
        if (activeRolesSet.size === 0)
            return [];
        // 2. Obtener todos los usuarios que tengan alguno de esos roles
        const usersUrl = `https://api.appsheet.com/api/v2/apps/${config_js_1.config.APPSHEET_APP_ID}/tables/LIST_usuariosApp_MS/Action`;
        const usersRes = await fetch(usersUrl, {
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
        if (!usersRes.ok)
            return [];
        const usersData = await usersRes.json();
        const recipients = usersData
            .filter((u) => {
            if (!u.TELEGRAM_ID || !u.ROL)
                return false;
            // Soportamos si el usuario tiene múltiples roles asignados (EnumList)
            const userRoles = u.ROL.split(",").map((r) => r.trim().toLowerCase());
            return userRoles.some((role) => activeRolesSet.has(role));
        })
            .map((u) => u.TELEGRAM_ID);
        return Array.from(new Set(recipients));
    }
    catch (error) {
        console.error("[LukeAPP] Error obteniendo destinatarios:", error);
        return [];
    }
};
exports.getNotificationRecipients = getNotificationRecipients;
