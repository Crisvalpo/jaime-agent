const dotenv = require('dotenv');
dotenv.config();

// Inline test of getNotificationRecipients logic
async function testRecipients() {
    const APP_ID = process.env.APPSHEET_APP_ID;
    const KEY = process.env.APPSHEET_ACCESS_KEY;
    const notificationType = 'PIPING_REPORTE_DIARIO';

    console.log('\n=== TEST: getNotificationRecipients ===');
    console.log(`Buscando destinatarios para: ${notificationType}\n`);

    // 1. Fetch CONFIG_Notificaciones
    const configUrl = `https://api.appsheet.com/api/v2/apps/${APP_ID}/tables/CONFIG_Notificaciones/Action`;
    const configRes = await fetch(configUrl, {
        method: 'POST',
        headers: { 'ApplicationAccessKey': KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ Action: "Find", Properties: { Locale: "es-ES" }, Rows: [] })
    });
    const configData = await configRes.json();
    console.log(`CONFIG_Notificaciones: ${configData.length} filas totales`);

    const matching = configData.filter(c => c.ID_NOTIFICACIONES === notificationType);
    console.log(`  -> Filas con ID="${notificationType}": ${matching.length}`);
    matching.forEach(c => console.log(`     ACTIVO=${c.ACTIVO}, ROL=${JSON.stringify(c.ROL)}`));

    const toRoleArray = (rol) => {
        if (!rol) return [];
        if (Array.isArray(rol)) return rol.map(r => r.trim().toLowerCase());
        return String(rol).split(",").map(r => r.trim().toLowerCase()).filter(Boolean);
    };

    const activeRolesSet = new Set();
    configData
        .filter(c => c.ID_NOTIFICACIONES === notificationType && (c.ACTIVO === "true" || c.ACTIVO === true || c.ACTIVO === "Y" || c.ACTIVO === "VERDADERO"))
        .forEach(c => { if (c.ROL) toRoleArray(c.ROL).forEach(r => activeRolesSet.add(r)); });

    console.log(`\nRoles activos encontrados: [${[...activeRolesSet].join(', ')}]`);
    if (activeRolesSet.size === 0) {
        console.log('❌ PROBLEMA: No hay roles activos. Verificar CONFIG_Notificaciones.');
        return;
    }

    // 2. Fetch LIST_usuariosApp_MS
    const usersUrl = `https://api.appsheet.com/api/v2/apps/${APP_ID}/tables/LIST_usuariosApp_MS/Action`;
    const usersRes = await fetch(usersUrl, {
        method: 'POST',
        headers: { 'ApplicationAccessKey': KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ Action: "Find", Properties: { Locale: "es-ES" }, Rows: [] })
    });
    const usersData = await usersRes.json();
    console.log(`\nLIST_usuariosApp_MS: ${usersData.length} usuarios totales`);
    usersData.forEach(u => {
        const roles = toRoleArray(u.ROL);
        const match = roles.some(r => activeRolesSet.has(r));
        console.log(`  ${u.NOMBRE || u.USUARIO} | ROL=${JSON.stringify(u.ROL)} | TELEGRAM_ID=${u.TELEGRAM_ID || '(vacío)'} | match=${match}`);
    });

    const recipients = usersData
        .filter(u => { if (!u.TELEGRAM_ID || !u.ROL) return false; return toRoleArray(u.ROL).some(r => activeRolesSet.has(r)); })
        .map(u => u.TELEGRAM_ID);

    console.log(`\n=== RESULTADO ===`);
    if (recipients.length === 0) {
        console.log('❌ Sin destinatarios. Ver detalle arriba.');
    } else {
        console.log(`✅ ${recipients.length} destinatario(s): ${recipients.join(', ')}`);
    }
}

testRecipients().catch(console.error);
