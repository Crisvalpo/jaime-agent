import { Context } from "grammy";
import { findAppsheetUser, updateAppsheetTelegramId, getJuntaStatus, getSpoolStatus } from "../agent/appsheet.js";
import { generatePipingReportMessage } from "../scheduler/pipingReport.js";
import { getUserProfile, clearUserCache } from "./userContext.js";

export const handleMessage = async (ctx: Context) => {
    const userText = ctx.message?.text || "";
    if (userText.startsWith("/")) return;

    const telegramId = ctx.from?.id.toString();
    if (!telegramId) return;

    // Buscar perfil del usuario en cache o AppSheet
    const profile = await getUserProfile(telegramId);

    if (profile) {
        // Usuario vinculado — saludo personalizado
        const firstName = profile.USUARIO.split(' ')[0];
        await ctx.reply(
            `👋 ¡Hola **${firstName}**!\nRol: ${profile.ROL} | Proyecto Andina PRY-413\n\n¿Qué necesitas?\n  📊 /reporte \u2192 Resumen del día\n  ❓ /help \u2192 Todos los comandos`,
            { parse_mode: "Markdown" }
        );
    } else {
        // Usuario no vinculado
        await ctx.reply(
            "🤖 Soy **jAIme** y anún no conozco tu perfil.\n\nUsa `/vincular Tu Nombre` para registrarte y recibir notificaciones personalizadas.",
            { parse_mode: "Markdown" }
        );
    }
};

export const handleVincular = async (ctx: Context) => {
    const text = ctx.message?.text || "";

    // Soportar [Nombre completo] o "Nombre completo"
    const bracketRegex = /\[(.*?)\]/;
    const quoteRegex = /"(.*?)"/;

    let usuario = "";

    const bracketMatch = text.match(bracketRegex);
    const quoteMatch = text.match(quoteRegex);

    if (bracketMatch) {
        usuario = bracketMatch[1];
    } else if (quoteMatch) {
        usuario = quoteMatch[1];
    } else {
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
    if (!telegramId) return;

    console.log(`[Bot] Buscando usuario: "${usuario}"`);
    await ctx.reply(`🔍 Buscando a \`${usuario}\` en LukeAPP-Server...`, { parse_mode: "Markdown" });

    try {
        const user = await findAppsheetUser(usuario);

        if (!user) {
            console.log(`[Bot] Usuario no encontrado: "${usuario}"`);
            await ctx.reply(`🚫 No encontré un usuario con Nombre: \`${usuario}\` en LukeAPP.\n\n*Nota:* Revisa que el nombre coincida exactamente con la App.`, { parse_mode: "Markdown" });
            return;
        }


        const success = await updateAppsheetTelegramId(user.USUARIO, telegramId);

        if (success) {
            console.log(`[Bot] Vinculación exitosa para usuario: ${usuario} (${telegramId})`);
            // Limpiar cache para que recargue el perfil actualizado
            clearUserCache(telegramId);
            await ctx.reply(`✅ ¡Vinculación exitosa!\n\nUsuario: ${user.USUARIO}\nPerfil: ${user.ROL}\nAhora recibirás notificaciones de acuerdo a tu perfil.`);
        } else {
            await ctx.reply("❌ Error al actualizar LukeAPP. Verifica que la columna `TELEGRAM_ID` sea editable por la API.");
        }
    } catch (error: any) {
        console.error("Error en handleVincular:", error);
        await ctx.reply("❌ Error inesperado al conectar con LukeAPP.");
    }
};

export const handleReporte = async (ctx: Context) => {
    try {
        const chatId = ctx.from?.id.toString();
        if (!chatId) return;

        console.log(`[Bot] Usuario ${chatId} solicitó reporte manual.`);
        await ctx.reply("📊 Generando reporte del día, por favor espera...", { parse_mode: "Markdown" });

        const message = await generatePipingReportMessage();
        await ctx.reply(message, {
            parse_mode: 'Markdown',
            link_preview_options: { is_disabled: true }
        });

    } catch (error: any) {
        console.error("Error en handleReporte:", error);
        await ctx.reply("❌ Error al generar el reporte. Por favor intenta más tarde.");
    }
};

export const handleUniones = async (ctx: Context) => {
    const userText = ctx.message?.text || "";
    const telegramId = ctx.from?.id.toString();
    if (!telegramId) return;

    // Verificar perfil del usuario
    const profile = await getUserProfile(telegramId);
    if (!profile) {
        await ctx.reply("🚫 No estás vinculado. Usa `/vincular Tu Nombre` para acceder a este comando.");
        return;
    }

    // Validar Rol (Solo lectura no puede)
    const roles = profile.ROL.toLowerCase();
    if (roles.includes("solo lectura") && !roles.includes("admin") && !roles.includes("qaqc") && !roles.includes("supervisor")) {
        await ctx.reply("⛔ No tienes permisos para consultar uniones térmicas. Requiere nivel Supervisor o superior.");
        return;
    }

    const query = userText.split(" ").slice(1).join(" ").trim();
    if (!query) {
        await ctx.reply("❌ Formato incorrecto.\n\nEjemplo de uso:\n`/uniones SP05_16` o `/junta 03351...SP05_16`", { parse_mode: "Markdown" });
        return;
    }

    await ctx.reply(`🔍 Buscando uniones que coincidan con \`${query}\`...`, { parse_mode: "Markdown" });

    const juntas = await getJuntaStatus(query);

    if (juntas.length === 0) {
        await ctx.reply(`🚫 No se encontraron uniones para el término: \`${query}\`.\nRevisa el identificador y prueba nuevamente.`, { parse_mode: "Markdown" });
        return;
    }

    // Si hay más de 5, pedir al usuario que sea más específico
    if (juntas.length > 5) {
        await ctx.reply(`⚠️ Se encontraron demasiadas coincidencias (${juntas.length}). Por favor sé más específico con el tag de la junta (ej. agregando el prefijo de hoja o spool).`);
        return;
    }

    for (const j of juntas) {
        let msg = `🔗 **Junta:** \`${j.ID_JUNTA}\`\n`;
        msg += `> 📍 **Isométrico:** \`${j.ID_ISO || 'N/A'}\`\n`;
        msg += `> 🛠️ **Spool:** \`${j.ID_SPOOL || 'N/A'}\`\n\n`;

        msg += `📋 **Req. Muestra (Maestra):** ${j.ESTADO_MUESTRA || 'N/A'}\n`;

        msg += `🔥 **Soldadura:** ${j.ESTADO_EJECUCION}\n`;
        if (j.FECHA_EJECUCION) msg += `   └ Fecha: ${j.FECHA_EJECUCION}\n`;
        if (j.PROCESO_SOLDADURA) msg += `   └ Proceso: ${j.PROCESO_SOLDADURA}\n`;
        if (j.ESTAMPA_EJECUTOR) msg += `   └ Soldador: ${j.ESTAMPA_EJECUTOR} (${j.RESPONSABLE || 'N/A'})\n`;

        if (j.ESTADO_VT) {
            msg += `\n👁️ **Inspección VT:** ${j.ESTADO_VT}\n`;
            if (j.FECHA_VT) msg += `   └ Fecha: ${j.FECHA_VT}\n`;
            if (j.INSPECTOR_VT) msg += `   └ Inspector: ${j.INSPECTOR_VT}\n`;
        } else {
            if (j.ESTADO_EJECUCION === 'EJECUTADA') {
                msg += `\n👁️ **Inspección VT:** PENDIENTE\n`;
            }
        }

        try {
            await ctx.reply(msg, { parse_mode: "Markdown" });
        } catch (mdError) {
            console.error("Markdown parse failed in handleUniones, falling back to plain text:", mdError);
            await ctx.reply(msg.replace(/[`*]/g, ''));
        }
    }
};

export const handleSpool = async (ctx: Context) => {
    try {
        const userText = ctx.message?.text || "";
        const telegramId = ctx.from?.id.toString();
        if (!telegramId) return;

        // Verificar perfil del usuario
        const profile = await getUserProfile(telegramId);
        if (!profile) {
            await ctx.reply("🚫 No estás vinculado. Usa `/vincular Tu Nombre`.");
            return;
        }

        // Validar Rol
        const roles = profile.ROL.toLowerCase();
        if (roles.includes("solo lectura") && !roles.includes("admin") && !roles.includes("qaqc") && !roles.includes("supervisor")) {
            await ctx.reply("⛔ No tienes permisos para consultar Spools. Requiere nivel Supervisor o superior.");
            return;
        }

        const query = userText.split(" ").slice(1).join(" ").trim();
        if (!query) {
            await ctx.reply("❌ Formato incorrecto.\n\nEjemplo de uso:\n`/spool SP05`", { parse_mode: "Markdown" });
            return;
        }

        await ctx.reply(`🔍 Buscando spools que coincidan con: ${query}...`);

        const spools = await getSpoolStatus(query);

        if (spools.length === 0) {
            await ctx.reply(`🚫 No se encontraron spools para: ${query}.\nPrueba con un identificador más preciso.`);
            return;
        }

        if (spools.length > 5) {
            await ctx.reply(`⚠️ Se encontraron demasiados spools (${spools.length}). Por favor sé más específico con tu búsqueda.`);
            return;
        }

        for (const s of spools) {
            let msg = `🛠️ **Spool:** \`${s.ID_SPOOL}\`\n`;
            if (s.TAG_SPOOL) {
                msg += `> 🏷️ **Tag:** \`${s.TAG_SPOOL}\`\n`;
            }
            msg += `> 📍 **Isométrico:** \`${s.ID_ISO || 'N/A'}\`\n\n`;

            msg += `**Estado Fabricación:** ${s.ESTADO || 'NO DEFINIDO'}\n`;
            msg += `**Total Juntas:** ${s.TOTAL_JUNTAS}\n\n`;

            if (s.JUNTAS.length > 0) {
                msg += `📋 **Uniones:**\n`;
                for (const j of s.JUNTAS) {
                    const suffix = j.ID_JUNTA.split('_').slice(-2).join('_');
                    msg += `  · \`${suffix || j.ID_JUNTA}\` \u2192 ${j.ESTADO}\n`;
                }
            }

            try {
                await ctx.reply(msg, { parse_mode: "Markdown" });
            } catch (mdError) {
                // Si el Markdown explota por culpa de caracteres raros (ej. comillas o guiones bajos extraños)
                console.error("Markdown parse failed, falling back to plain text:", mdError);
                await ctx.reply(msg.replace(/[`*]/g, ''));
            }
        }
    } catch (err) {
        console.error("Error en handleSpool:", err);
        await ctx.reply("❌ Ocurrió un error inesperado al procesar tu comando.");
    }
};
