import { config } from "../config.js";
import { AgentTool } from "./tools.js";

// Eliminamos las definiciones de herramientas para el agente IA, ya que el bot ahora es puramente robótico.
export const appsheetTools = {};

/**
 * Helper to find a user by Usuario and Rol
 */
export const findAppsheetUser = async (usuario: string, rol: string) => {
    const url = `https://api.appsheet.com/api/v2/apps/${config.APPSHEET_APP_ID}/tables/LIST_usuariosApp_MS/Action`;
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'ApplicationAccessKey': config.APPSHEET_ACCESS_KEY,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            Action: "Find",
            Properties: { Locale: "es-ES" },
            Rows: []
        })
    });

    if (!response.ok) return null;
    const data = await response.json();
    if (!Array.isArray(data)) return null;

    return data.find((u: any) =>
        u.USUARIO?.toLowerCase() === usuario.toLowerCase() &&
        u.ROL?.toLowerCase() === rol.toLowerCase()
    );
};

/**
 * Helper to update the TELEGRAM_ID for a specific user row
 */
/**
 * Helper to update the TELEGRAM_ID for a specific user row
 * We use USUARIO as the key for identifying the row.
 */
export const updateAppsheetTelegramId = async (usuario: string, telegramId: string) => {
    const url = `https://api.appsheet.com/api/v2/apps/${config.APPSHEET_APP_ID}/tables/LIST_usuariosApp_MS/Action`;
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'ApplicationAccessKey': config.APPSHEET_ACCESS_KEY,
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

/**
 * Gets all Telegram IDs for users that have a role enabled for a specific notification type
 */
export const getNotificationRecipients = async (notificationType: string): Promise<string[]> => {
    try {
        // 1. Obtener roles activos para este tipo de notificación
        const configUrl = `https://api.appsheet.com/api/v2/apps/${config.APPSHEET_APP_ID}/tables/CONFIG_Notificaciones/Action`;
        const configRes = await fetch(configUrl, {
            method: 'POST',
            headers: {
                'ApplicationAccessKey': config.APPSHEET_ACCESS_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                Action: "Find",
                Properties: { Locale: "es-ES" },
                Rows: []
            })
        });

        if (!configRes.ok) return [];
        const configData = await configRes.json();

        // Obtenemos todos los roles habilitados (soportando si Rol es una lista separada por comas)
        const activeRolesSet = new Set<string>();
        configData
            .filter((c: any) => c.ID_NOTIFICACIONES === notificationType && (c.ACTIVO === "true" || c.ACTIVO === true || c.ACTIVO === "Y"))
            .forEach((c: any) => {
                if (c.ROL) {
                    c.ROL.split(",").forEach((r: string) => activeRolesSet.add(r.trim().toLowerCase()));
                }
            });

        if (activeRolesSet.size === 0) return [];

        // 2. Obtener todos los usuarios que tengan alguno de esos roles
        const usersUrl = `https://api.appsheet.com/api/v2/apps/${config.APPSHEET_APP_ID}/tables/LIST_usuariosApp_MS/Action`;
        const usersRes = await fetch(usersUrl, {
            method: 'POST',
            headers: {
                'ApplicationAccessKey': config.APPSHEET_ACCESS_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                Action: "Find",
                Properties: { Locale: "es-ES" },
                Rows: []
            })
        });

        if (!usersRes.ok) return [];
        const usersData = await usersRes.json();

        const recipients = usersData
            .filter((u: any) => {
                if (!u.TELEGRAM_ID || !u.ROL) return false;
                // Soportamos si el usuario tiene múltiples roles asignados (EnumList)
                const userRoles = u.ROL.split(",").map((r: string) => r.trim().toLowerCase());
                return userRoles.some((role: string) => activeRolesSet.has(role));
            })
            .map((u: any) => u.TELEGRAM_ID);

        return Array.from(new Set(recipients));
    } catch (error) {
        console.error("[AppSheet] Error obteniendo destinatarios:", error);
        return [];
    }
};
