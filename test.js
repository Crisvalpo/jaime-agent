const dotenv = require('dotenv');
dotenv.config();

async function main() {
    const url = `https://api.appsheet.com/api/v2/apps/${process.env.APPSHEET_APP_ID}/tables/REG_EjecucionJuntas_MS/Action`;
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'ApplicationAccessKey': process.env.APPSHEET_ACCESS_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                Action: "Find",
                Properties: { Locale: "es-ES" },
                Rows: []
            })
        });
        const d = await response.json();
        console.log("Date samples from API:");
        console.log(d.slice(-5).map(x => x.FECHA_EJECUCION));
    } catch (err) {
        console.error(err);
    }
}
main();
