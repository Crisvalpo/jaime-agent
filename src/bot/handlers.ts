import { Context } from "grammy";
import { findAppsheetUser, updateAppsheetTelegramId } from "../agent/appsheet.js";

export const handleMessage = async (ctx: Context) => {
    // El usuario no quiere que el bot responda a preguntas.
    // Solo permitimos el comando /vincular.
    const userText = ctx.message?.text || "";
    if (userText.startsWith("/")) return; // Dejar que los comandos se manejen por separado

    await ctx.reply("🤖 Soy el bot de LukeAPP y solo estoy configurado para enviar notificaciones automáticas. No puedo responder preguntas.");
};

export const handleVincular = async (ctx: Context) => {
    const text = ctx.message?.text || "";

    // Mejorar el parsing para soportar espacios dentro de corchetes [Andres Tapia] o comillas "Andres Tapia"
    // Intentamos buscar patrones [Nombre] [Rol] o "Nombre" "Rol" o simplemente dividido por espacios
    const bracketRegex = /\[(.*?)\]\s*\[(.*?)\]/;
    const quoteRegex = /"(.*?)"\s*"(.*?)"/;

    let usuario = "";
    let rol = "";

    const bracketMatch = text.match(bracketRegex);
    const quoteMatch = text.match(quoteRegex);

    if (bracketMatch) {
        usuario = bracketMatch[1];
        rol = bracketMatch[2];
    } else if (quoteMatch) {
        usuario = quoteMatch[1];
        rol = quoteMatch[2];
    } else {
        const parts = text.split(" ").filter(p => !!p);
        if (parts.length >= 3) {
            usuario = parts[1];
            rol = parts.slice(2).join(" "); // Asumimos que el resto es el rol o manejamos error
        }
    }

    if (!usuario || !rol) {
        await ctx.reply("❌ Formato incorrecto.\n\nUsa: `/vincular [Usuario] [Rol]`\n(Usa los corchetes si el nombre tiene espacios)\n\nEjemplo: `/vincular [Andres Tapia] [ADMIN]`", { parse_mode: "Markdown" });
        return;
    }

    const telegramId = ctx.from?.id.toString();
    if (!telegramId) return;

    await ctx.reply(`⏳ Buscando a \`${usuario}\` con rol \`${rol}\` en AppSheet...`, { parse_mode: "Markdown" });

    try {
        const user = await findAppsheetUser(usuario, rol);

        if (!user) {
            await ctx.reply(`❌ No encontré un usuario con Nombre: \`${usuario}\` y Rol: \`${rol}\` en AppSheet.\n\n*Nota:* Revisa que el nombre y rol coincidan exactamente como están en el Excel (incluyendo espacios y mayúsculas).`, { parse_mode: "Markdown" });
            return;
        }

        const success = await updateAppsheetTelegramId(user.USUARIO, telegramId);

        if (success) {
            console.log(`[Bot] Vinculación exitosa para usuario: ${usuario} (${telegramId})`);
            await ctx.reply(`✅ ¡Vinculación exitosa!\n\nUsuario: \`${usuario}\`\nRol: \`${rol}\`\nTu Telegram ID (\`${telegramId}\`) ha sido guardado automáticamente en la columna \`TELEGRAM_ID\`.`, { parse_mode: "Markdown" });
        } else {
            await ctx.reply("❌ Error al actualizar AppSheet. Verifica que la columna `TELEGRAM_ID` sea editable por la API.");
        }
    } catch (error: any) {
        console.error("Error en handleVincular:", error);
        await ctx.reply("❌ Error inesperado al conectar con AppSheet.");
    }
};
