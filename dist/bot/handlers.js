"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleReporte = exports.handleVincular = exports.handleMessage = void 0;
const appsheet_js_1 = require("../agent/appsheet.js");
const pipingReport_js_1 = require("../scheduler/pipingReport.js");
const handleMessage = async (ctx) => {
    // El usuario no quiere que el bot responda a preguntas.
    // Solo permitimos el comando /vincular.
    const userText = ctx.message?.text || "";
    if (userText.startsWith("/"))
        return; // Dejar que los comandos se manejen por separado
    await ctx.reply("🤖 Soy **jAIme v4.0** y solo estoy configurado para enviar notificaciones oficiales de **LukeAPP**.", { parse_mode: "Markdown" });
};
exports.handleMessage = handleMessage;
const handleVincular = async (ctx) => {
    const text = ctx.message?.text || "";
    // Soportar [Nombre completo] o "Nombre completo"
    const bracketRegex = /\[(.*?)\]/;
    const quoteRegex = /"(.*?)"/;
    let usuario = "";
    const bracketMatch = text.match(bracketRegex);
    const quoteMatch = text.match(quoteRegex);
    if (bracketMatch) {
        usuario = bracketMatch[1];
    }
    else if (quoteMatch) {
        usuario = quoteMatch[1];
    }
    else {
        // Si no hay brackets ni comillas, tomamos todo el texto tras el comando
        const parts = text.split(" ").filter(p => !!p);
        if (parts.length >= 2) {
            usuario = parts.slice(1).join(" ");
        }
    }
    if (!usuario) {
        await ctx.reply("❌ Formato incorrecto.\n\nSimplemente escribe: `/vincular Tu Nombre`", { parse_mode: "Markdown" });
        return;
    }
    // Normalizar espacios internos (convertir múltiples espacios en uno solo)
    usuario = usuario.trim().replace(/\s+/g, ' ');
    const telegramId = ctx.from?.id.toString();
    if (!telegramId)
        return;
    console.log(`[Bot] Buscando usuario: "${usuario}"`);
    await ctx.reply(`🔍 Buscando a \`${usuario}\` en LukeAPP-Server...`, { parse_mode: "Markdown" });
    try {
        const user = await (0, appsheet_js_1.findAppsheetUser)(usuario);
        if (!user) {
            console.log(`[Bot] Usuario no encontrado: "${usuario}"`);
            await ctx.reply(`🚫 No encontré un usuario con Nombre: \`${usuario}\` en LukeAPP.\n\n*Nota:* Revisa que el nombre coincida exactamente con la App.`, { parse_mode: "Markdown" });
            return;
        }
        const success = await (0, appsheet_js_1.updateAppsheetTelegramId)(user.USUARIO, telegramId);
        if (success) {
            console.log(`[Bot] Vinculación exitosa para usuario: ${usuario} (${telegramId})`);
            await ctx.reply(`✅ ¡Vinculación exitosa!\n\nUsuario: ${user.USUARIO}\nPerfil: ${user.ROL}\nAhora recibirás notificaciones de acuerdo a tu perfil.`);
        }
        else {
            await ctx.reply("❌ Error al actualizar LukeAPP. Verifica que la columna `TELEGRAM_ID` sea editable por la API.");
        }
    }
    catch (error) {
        console.error("Error en handleVincular:", error);
        await ctx.reply("❌ Error inesperado al conectar con LukeAPP.");
    }
};
exports.handleVincular = handleVincular;
const handleReporte = async (ctx) => {
    try {
        const chatId = ctx.from?.id.toString();
        if (!chatId)
            return;
        console.log(`[Bot] Usuario ${chatId} solicitó reporte manual.`);
        await ctx.reply("📊 Generando reporte del día, por favor espera...", { parse_mode: "Markdown" });
        const message = await (0, pipingReport_js_1.generatePipingReportMessage)();
        await ctx.reply(message, {
            parse_mode: 'Markdown',
            link_preview_options: { is_disabled: true }
        });
    }
    catch (error) {
        console.error("Error en handleReporte:", error);
        await ctx.reply("❌ Error al generar el reporte. Por favor intenta más tarde.");
    }
};
exports.handleReporte = handleReporte;
