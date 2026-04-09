"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getJuntaStatus = exports.getNotificationRecipients = exports.updateAppsheetTelegramId = exports.findAppsheetUser = exports.appsheetTools = void 0;
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
    // Normalizar: Trim, minúsculas, remover TODAS las comillas (normales y tipográficas), y convertir múltiples espacios
    const target = usuario.trim().toLowerCase().replace(/["'“”‘’]/g, '').replace(/\s+/g, ' ');
    console.log(`[AppSheet API] Query normalizado: "${target}"`);
    const user = data.find((u) => {
        if (!u.USUARIO)
            return false;
        const normalized = u.USUARIO.toString().trim().toLowerCase().replace(/["'“”‘’]/g, '').replace(/\s+/g, ' ');
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
        // Helper: AppSheet EnumList puede llegar como array ["OT","ADMIN"] o como string "OT, ADMIN"
        const toRoleArray = (rol) => {
            if (!rol)
                return [];
            if (Array.isArray(rol))
                return rol.map((r) => r.trim().toLowerCase());
            return String(rol).split(",").map((r) => r.trim().toLowerCase()).filter(Boolean);
        };
        // Obtenemos todos los roles habilitados para este tipo de notificación
        const activeRolesSet = new Set();
        configData
            .filter((c) => c.ID_NOTIFICACIONES === notificationType && (c.ACTIVO === "true" || c.ACTIVO === true || c.ACTIVO === "Y" || c.ACTIVO === "VERDADERO"))
            .forEach((c) => {
            if (c.ROL) {
                toRoleArray(c.ROL).forEach((r) => activeRolesSet.add(r));
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
            // Soportamos EnumList (array o string)
            const userRoles = toRoleArray(u.ROL);
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
// Global helper para hacer fetch a la API de AppSheet de forma más limpia
const fetchAppSheetTable = async (tableName) => {
    const url = `https://api.appsheet.com/api/v2/apps/${config_js_1.config.APPSHEET_APP_ID}/tables/${tableName}/Action`;
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
        console.error(`[AppSheet] Error al consultar tabla ${tableName}: HTTP ${response.status}`);
        return [];
    }
    const data = await response.json();
    return Array.isArray(data) ? data : [];
};
const getJuntaStatus = async (searchQuery) => {
    try {
        const upperQuery = searchQuery.trim().toUpperCase();
        // 1. Consultar la tabla maestra `LIST_Juntas_MS`
        const listJuntas = await fetchAppSheetTable("LIST_Juntas_MS");
        const masterMatches = listJuntas.filter((j) => j.ID_JUNTA && j.ID_JUNTA.toUpperCase().includes(upperQuery));
        if (masterMatches.length === 0)
            return [];
        // Por rendimiento, si hay más de 5 coincidencias, no consultamos las demás tablas
        // para evitar cruzar demasiados datos en memoria innecesariamente.
        if (masterMatches.length > 5) {
            // El handler cortará la respuesta, no pasa nada
            return masterMatches.map((m) => ({
                ID_JUNTA: m.ID_JUNTA,
                ESTADO_EJECUCION: 'NO REVISADO',
                ID_ISO: m.ID_ISO,
                ID_LINEA: m.ID_LINEA,
                ID_SPOOL: m.ID_SPOOL
            }));
        }
        // 2. Extraer los IDs exactos de los matches
        const ids = masterMatches.map((m) => m.ID_JUNTA);
        // 3. Consultar tablas de registros
        const [ejecuciones, inspecciones] = await Promise.all([
            fetchAppSheetTable("REG_EjecucionJuntas_MS"),
            fetchAppSheetTable("REG_InspeccionVisual_MS")
        ]);
        // 4. Cruzar la información
        return masterMatches.map((master) => {
            const ejecucion = ejecuciones.find((e) => e.ID_JUNTA === master.ID_JUNTA);
            const vt = inspecciones.find((v) => v.ID_JUNTA === master.ID_JUNTA);
            return {
                ID_JUNTA: master.ID_JUNTA,
                ESTADO_MUESTRA: master.ESTADO, // El estado que tenga en la lista maestra
                ID_TIPO_UNION: master.ID_TIPO_UNION,
                ID_ISO: master.ID_ISO,
                ID_LINEA: master.ID_LINEA,
                ID_SPOOL: master.ID_SPOOL,
                // Datos de Ejecución
                ESTADO_EJECUCION: ejecucion ? (ejecucion.ESTADO_EJECUCION || 'REPORTADO') : 'PENDIENTE',
                FECHA_EJECUCION: ejecucion?.FECHA_EJECUCION,
                RESPONSABLE: ejecucion?.RESPONSABLE,
                ESTAMPA_EJECUTOR: ejecucion?.ESTAMPA_EJECUTOR,
                PROCESO_SOLDADURA: ejecucion?.PROCESO_SOLDADURA,
                // Datos de VT
                ESTADO_VT: vt?.ESTADO,
                FECHA_VT: vt?.FECHA_INSPECCION,
                INSPECTOR_VT: vt?.INSPECTOR
            };
        });
    }
    catch (err) {
        console.error('[AppSheet] Error en getJuntaStatus:', err);
        return [];
    }
};
exports.getJuntaStatus = getJuntaStatus;
