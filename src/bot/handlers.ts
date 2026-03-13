import { Context } from "grammy";
import { findAppsheetUser, updateAppsheetTelegramId } from "../agent/appsheet.js";

export const handleMessage = async (ctx: Context) => {
    // El usuario no quiere que el bot responda a preguntas.
    // Solo permitimos el comando /vincular.
    const userText = ctx.message?.text || "";
    if (userText.startsWith("/")) return; // Dejar que los comandos se manejen por separado

    await ctx.reply("🤖 Soy jAIme y solo estoy configurado para enviar notificaciones automáticas y resolver dudas sobre LukeAPP-Andina. No puedo conversar libremente aquí.");
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
        await ctx.reply("❌ Formato incorrecto.\n\nUsa: `/vincular \"Nombre Apellido\"`\n(Usa las comillas si el nombre tiene espacios)", { parse_mode: "Markdown" });
        return;
    }

    const telegramId = ctx.from?.id.toString();
    if (!telegramId) return;

    await ctx.reply(`⏳ Buscando a \`${usuario}\` en LukeAPP...`, { parse_mode: "Markdown" });

    try {
        const user = await findAppsheetUser(usuario);

        if (!user) {
            await ctx.reply(`❌ No encontré un usuario con Nombre: \`${usuario}\` en LukeAPP.\n\n*Nota:* Revisa que el nombre coincida exactamente (100%) como está en la App (espacios y mayúsculas).`, { parse_mode: "Markdown" });
            return;
        }

        const success = await updateAppsheetTelegramId(user.USUARIO, telegramId);

        if (success) {
            console.log(`[Bot] Vinculación exitosa para usuario: ${usuario} (${telegramId})`);
            await ctx.reply(`✅ ¡Vinculación exitosa!\n\nUsuario: ${user.USUARIO}\nPerfil: ${user.ROL}\nAhora recibirás notificaciones de acuerdo a tu perfil.`);
        } else {
            await ctx.reply("❌ Error al actualizar LukeAPP. Verifica que la columna `TELEGRAM_ID` sea editable por la API.");
        }
    } catch (error: any) {
        console.error("Error en handleVincular:", error);
        await ctx.reply("❌ Error inesperado al conectar con LukeAPP.");
    }
};
