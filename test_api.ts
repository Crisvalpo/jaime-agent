import dotenv from 'dotenv';
dotenv.config();
const config = {
    APPSHEET_APP_ID: process.env.APPSHEET_APP_ID,
    APPSHEET_ACCESS_KEY: process.env.APPSHEET_ACCESS_KEY,
};
async function test() {
    const url = `https://api.appsheet.com/api/v2/apps/${config.APPSHEET_APP_ID}/tables/REG_EjecucionJuntas_MS/Action`;
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
    const d = await response.json();
    console.log(d.slice(-2).map((x: any) => x.FECHA_EJECUCION));
}
test();
