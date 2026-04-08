---
name: jAIme Bot - Arquitectura y Notificaciones
description: Conocimiento técnico del bot jAIme, su arquitectura de notificaciones con AppSheet y cron jobs, bugs históricos y patrones establecidos.
---

# jAIme Bot — Skill de Arquitectura y Notificaciones

## 1. Stack y Deployment

| Capa | Tecnología |
|------|------------|
| Lenguaje | TypeScript (compilado a `dist/`) |
| Bot | Grammy (Telegram Bot API) |
| Cron | `node-cron` |
| Base de datos usuarios | Firebase Firestore |
| Datos de proyecto | AppSheet REST API v2 |
| Infraestructura | Ubuntu 24.04, PM2, Cloudflare Tunnel |
| Alias SSH | `luke-ssh` → lukeserver |
| Puerto | 3001 |
| PM2 proceso | `jaime-agent` (id: 2) |

### Deploy manual en el servidor
```bash
ssh luke-ssh "bash -ic 'source ~/.nvm/nvm.sh && cd ~/jaime-agent && git fetch && git reset --hard origin/main && npm install && npm run build && pm2 restart jaime-agent'"
```

> **Nota:** `npm` y `pm2` no están disponibles en el PATH de sesiones SSH no-interactivas. Siempre usar `bash -ic 'source ~/.nvm/nvm.sh && ...'`.

---

## 2. Arquitectura del Sistema de Notificaciones

### Tablas clave en AppSheet
| Tabla | Uso |
|-------|-----|
| `CONFIG_Notificaciones` | Define qué notificaciones están activas y para qué roles |
| `LIST_usuariosApp_MS` | Usuarios con `TELEGRAM_ID`, `ROL` y nombre |
| `REG_EjecucionJuntas_MS` | Juntas soldadas por fecha |
| `REG_InspeccionVisual_MS` | Inspecciones VT por fecha |
| `LOG_Spool_MS` | Estado de spools |

### Función clave: `getNotificationRecipients(notificationType)`
**Ubicación:** `src/agent/appsheet.ts`
1. Consulta `CONFIG_Notificaciones` → busca `ID_NOTIFICACIONES` + `ACTIVO === "Y"`
2. Extrae roles activos del campo `ROL` (puede ser array o string — ver quirks)
3. Consulta `LIST_usuariosApp_MS` → retorna `TELEGRAM_ID` de usuarios con rol coincidente

---

## 3. Cron Jobs

### ⚠️ TRUCO CRÍTICO — El cron debe registrarse ANTES de `await botPromise`

`bot.start()` (Grammy) es un listener infinito que **nunca resuelve**. Si el cron se registra después del `await`, **nunca se ejecuta**.

```typescript
// ✅ CORRECTO — en src/index.ts
cron.schedule("30 19 * * 1-5", () => {
    runDailyPipingReport();
}, { timezone: "America/Santiago" });

await botPromise; // ← siempre al final
```

### Horarios activos
| Notificación | Horario cron | Días |
|---|---|---|
| `PIPING_REPORTE_DIARIO` | `30 19 * * 1-5` (19:30) | L-V |

### Para agregar una nueva notificación
1. Agregar fila en `CONFIG_Notificaciones` en AppSheet con el nuevo `ID_NOTIFICACIONES` y `ACTIVO=Y`
2. Crear función en `src/scheduler/` similar a `pipingReport.ts`
3. Registrar `cron.schedule(...)` en `src/index.ts` **antes** de `await botPromise`
4. `npm run build && git push` + deploy

---

## 4. Quirks de la API de AppSheet

### Formato de fechas — ⚠️ La API devuelve MM/DD/YYYY (americano)
Aunque el Locale sea `es-ES`, la API REST siempre devuelve `"MM/DD/YYYY HH:mm:ss"`.  
Los CSV exportados localmente sí muestran `DD/MM/YYYY`.

**Helper isToday:**
```typescript
const isToday = (dateStr: any) => {
    if (!dateStr || typeof dateStr !== 'string') return false;
    const today = new Date();
    const d = String(today.getDate()).padStart(2, '0');
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const y = today.getFullYear();
    return dateStr.includes(`${d}/${m}/${y}`) ||  // DD/MM/YYYY
           dateStr.includes(`${m}/${d}/${y}`) ||  // MM/DD/YYYY (API)
           dateStr.includes(`${d}-${m}-${y}`) ||  // DD-MM-YYYY
           dateStr.includes(today.toISOString().split('T')[0]); // ISO
};
```

### EnumList (campos multi-valor como ROL)
AppSheet puede enviar un campo `EnumList` como array `["OT","ADMIN"]` o string `"OT, ADMIN"`.

```typescript
const toRoleArray = (rol: any): string[] => {
    if (!rol) return [];
    if (Array.isArray(rol)) return rol.map(r => r.trim().toLowerCase());
    return String(rol).split(",").map(r => r.trim().toLowerCase()).filter(Boolean);
};
```

---

## 5. Comandos del Bot

| Comando | Handler | Descripción |
|---------|---------|-------------|
| `/start` | inline `index.ts` | Bienvenida |
| `/vincular Nombre` | `handleVincular` | Vincula TELEGRAM_ID con usuario AppSheet |
| `/reporte` | `handleReporte` | Reporte diario de Piping al instante |
| `/help` | inline `index.ts` | Lista de comandos |

### Para agregar nuevo comando
1. Crear handler en `src/bot/handlers.ts`
2. Importar y registrar en `src/bot/index.ts`: `bot.command("nombre", handler)`
3. Actualizar texto del `/help`

---

## 6. Servidor Ubuntu (lukeserver)

- **Timezone:** `America/Santiago` (-04 invierno, -03 verano)
- **Sleep programado:** 00:00 → 07:00 via `crontab: 00 00 * * * /usr/sbin/rtcwake -m mem -s 25200`
- El sleep usa hora local del servidor → ajusta automáticamente con el cambio de hora

---

## 7. Historial de Bugs Críticos

| Fecha | Bug | Fix |
|-------|-----|-----|
| 2026-04-08 | Cron después de `await botPromise` → nunca disparaba | Mover cron **antes** del await |
| 2026-04-08 | API AppSheet retorna MM/DD/YYYY → comparación de fechas siempre fallaba | Helper `isToday()` multi-formato |
| 2026-04-08 | EnumList ROL como array → crash silencioso en filtro | Helper `toRoleArray()` |
