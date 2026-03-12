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
