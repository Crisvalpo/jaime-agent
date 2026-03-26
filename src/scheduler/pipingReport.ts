import { getNotificationRecipients } from "../agent/appsheet.js";
import { config } from "../config.js";
import { bot } from "../bot/index.js";

// Fecha de inicio del proyecto Andina
const PROJECT_START_DATE = new Date('2025-09-15');

function getProjectWeek(d: Date = new Date()) {
    const todayStr = d.toISOString().split('T')[0];
    const projectStartStr = PROJECT_START_DATE.toISOString().split('T')[0];

    // Calcular días ignorando la zona horaria para evitar desfases (UTC)
    const dUTC = new Date(todayStr);
    const startUTC = new Date(projectStartStr);

    const days = Math.floor((dUTC.getTime() - startUTC.getTime()) / (1000 * 60 * 60 * 24));
    return Math.floor(days / 7);
}

// Helper para AppSheet API
async function fetchAppSheetTable(tableName: string) {
    const url = `https://api.appsheet.com/api/v2/apps/${config.APPSHEET_APP_ID}/tables/${tableName}/Action`;
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
    if (!response.ok) return [];
    return response.json();
}

/**
 * Genera el cuerpo del mensaje para el reporte diario de Piping
 */
export const generatePipingReportMessage = async () => {
    // 2. Definir "hoy" en formato DD/MM/AAAA para cruzar con AppSheet
    const today = new Date();
    const strHoy = today.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });

    // 3. Obtener Data
    const [ejecuciones, inspecciones, spools] = await Promise.all([
        fetchAppSheetTable('REG_EjecucionJuntas_MS'),
        fetchAppSheetTable('REG_InspeccionVisual_MS'),
        fetchAppSheetTable('LIST_Spools_MS')
    ]);

    // 4. Filtrar y procesar datos del día
    const ejecutadasHoy = ejecuciones.filter((e: any) => {
        if (!e.FECHA_EJECUCION || !e.FECHA_EJECUCION.includes) return false;
        return e.FECHA_EJECUCION.includes(strHoy) || e.FECHA_EJECUCION.split('T')[0] === today.toISOString().split('T')[0];
    });

    const vtsHoy = inspecciones.filter((i: any) => {
        if (!i.FECHA_INSPECCION || !i.FECHA_INSPECCION.includes) return false;
        return i.FECHA_INSPECCION.includes(strHoy) || i.FECHA_INSPECCION.split('T')[0] === today.toISOString().split('T')[0];
    });

    // Contadores Juntas
    let cortadas = 0, emplantilladas = 0, soldadas = 0;

    ejecutadasHoy.forEach((e: any) => {
        const estado = (e.ESTADO_EJECUCION || '').trim().toUpperCase();
        if (estado === 'CORTE DIMENSIONADO') cortadas++;
        else if (estado === 'EMPLANTILLADO') emplantilladas++;
        else if (estado === 'EJECUTADA') soldadas++;
    });

    // Contadores Spools del día (avances de etapa)
    const spoolsHoy = spools.filter((s: any) => {
        const fFab = s.FECHA_INICIO_FAB || '';
        const fPint = s.FECHA_INICIO_PINT || '';
        const fDesp = s.FECHA_DESPACHO || '';
        const rawHoy = today.toISOString().split('T')[0];

        return fFab.includes(strHoy) || fFab.includes(rawHoy) ||
            fPint.includes(strHoy) || fPint.includes(rawHoy) ||
            fDesp.includes(strHoy) || fDesp.includes(rawHoy);
    }).length;

    // VT Aprobados
    const vtAprobadosHoy = vtsHoy.filter((i: any) => (i.ESTADO || '').trim().toUpperCase() === 'APROBADO').length;

    // 5. Formatear mensaje
    const weekStr = `S${getProjectWeek()}`;

    return `📊 *Andina PRY-413 | Resumen ${weekStr}*\n` +
        `📅 Fecha: ${strHoy}\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `🔗 *Juntas procesadas hoy:*\n` +
        `  • Corte: ${cortadas}\n` +
        `  • Emplantillado: ${emplantilladas}\n` +
        `  • Ejecutadas (Soldadas): ${soldadas}\n\n` +
        `🏭 *Spools actualizados:* ${spoolsHoy}\n` +
        `✅ *VT aprobados hoy:* ${vtAprobadosHoy}\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `🌐 [Ver Dashboard Piping](https://andina.lukeapp.me)`;
};

export const runDailyPipingReport = async () => {
    try {
        console.log("[PipingReport] Iniciando reporte diario programado...");

        // 1. Obtener Telegram IDs configurados para el reporte
        const recipients = await getNotificationRecipients('PIPING_REPORTE_DIARIO');
        if (!recipients || recipients.length === 0) {
            console.log("[PipingReport] No hay destinatarios configurados para PIPING_REPORTE_DIARIO.");
            return;
        }

        console.log(`[PipingReport] Enviando reporte a ${recipients.length} usuarios.`);

        const message = await generatePipingReportMessage();

        // 6. Enviar a todos los destinatarios
        for (const chatId of recipients) {
            try {
                await bot.api.sendMessage(chatId, message, { parse_mode: 'Markdown', link_preview_options: { is_disabled: true } });
            } catch (err: any) {
                console.error(`[PipingReport] Error enviando a ${chatId}:`, err.message);
            }
        }

        console.log("[PipingReport] Reportes enviados correctamente.");

    } catch (error) {
        console.error("[PipingReport] Error en reporte diario:", error);
    }
};
