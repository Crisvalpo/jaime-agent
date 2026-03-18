
import fetch from 'node-fetch';

const APPSHEET_APP_ID = "eb4713b6-0828-4993-b5e1-935eec83cf4e";
const APPSHEET_ACCESS_KEY = "V2-b9qXt-SY9es-eDDQb-L2lXN-NIInJ-U0DvZ-5fa2N-4huez";

async function checkConfig() {
    const url = `https://api.appsheet.com/api/v2/apps/${APPSHEET_APP_ID}/tables/CONFIG_Notificaciones/Action`;
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'ApplicationAccessKey': APPSHEET_ACCESS_KEY,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            Action: "Find",
            Properties: { Locale: "es-ES" },
            Rows: []
        })
    });

    const data = await response.json();
    console.log("--- CONFIG_Notificaciones ---");
    console.log(JSON.stringify(data, null, 2));

    console.log("\n--- USERS (Top 3) ---");
    const usersUrl = `https://api.appsheet.com/api/v2/apps/${APPSHEET_APP_ID}/tables/LIST_usuariosApp_MS/Action`;
    const usersRes = await fetch(usersUrl, {
        method: 'POST',
        headers: {
            'ApplicationAccessKey': APPSHEET_ACCESS_KEY,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            Action: "Find",
            Properties: { Locale: "es-ES" },
            Rows: []
        })
    });
    const usersData = await usersRes.json();
    console.log(JSON.stringify(usersData.slice(0, 3), null, 2));
}

checkConfig();
