---
name: AppSheet API Integration
description: Instrucciones y mejores prácticas para conectar, consultar y actualizar datos en la API REST de AppSheet V2.
---

# Habilidad: Integración con AppSheet API (V2)

Esta habilidad proporciona el conocimiento necesario para que cualquier Agente IA interactúe de forma segura y robusta con las bases de datos de AppSheet a través de su API REST.

## 1. Autenticación y Endpoints

Para realizar cualquier petición a AppSheet, necesitarás dos credenciales clave que deben existir en tu `.env` (nunca quemadas en el código):

- `APPSHEET_APP_ID`: El identificador de la aplicación (ej. `eb4713b6-0828-4993-b5e1-935eec83cf4e`).
- `APPSHEET_ACCESS_KEY`: El token secreto para la API (ej. `V2-b9qXt...`).

**La URL del Endpoint siempre sigue este patrón:**
`https://api.appsheet.com/api/v2/apps/{APPSHEET_APP_ID}/tables/{NOMBRE_DE_LA_TABLA}/Action`

**Cabeceras HTTP Obligatorias:**
```json
{
  "ApplicationAccessKey": "APPSHEET_ACCESS_KEY",
  "Content-Type": "application/json"
}
```

## 2. Acciones Básicas (Find, Edit, Add, Delete)

El cuerpo (body) de la petición HTTP POST debe ser un objeto JSON que incluya la propiedad `Action` y la lista de `Rows`.

### Buscar Registros (Find)
Para recuperar registros de una tabla, el arreglo `Rows` debe enviarse vacío.
```json
{
  "Action": "Find",
  "Properties": { "Locale": "es-ES" },
  "Rows": []
}
```

### Editar / Actualizar Registros (Edit)
Para editar, debes proporcionar al menos la columna que actúa como *Key* (Llave Primaria) en AppSheet, junto con los campos a modificar.
```json
{
  "Action": "Edit",
  "Properties": { "Locale": "es-ES" },
  "Rows": [
    {
      "USUARIO": "Andres Tapia",  // Columna Key de AppSheet
      "TELEGRAM_ID": "12345678"     // Columna a actualizar
    }
  ]
}
```

## 3. Trampas Comunes y Prevención de Errores (Lecciones Aprendidas)

A lo largo del desarrollo, hemos identificado las siguientes incidencias críticas que el código **DEBE** manejar para considerarse robusto:

### A. Fallos Silenciosos de AppSheet (HTTP 403 / 400)
Si el `ApplicationAccessKey` es incorrecto, AppSheet devolverá un error `403 Forbidden` muy descriptivo en el body, y el status HTTP no será `2xx`. 
**Regla:** Siempre intercepta `!response.ok` y haz un `.text()` del error para registrarlo en consola antes de abortar.

### B. Mismatch de Tipografía de Teléfonos Móviles ("Smart Quotes")
Si tu comando recibe texto libre de Telegram o WhatsApp, los usuarios de móvil suelen teclear comillas (""). Los teléfonos modernos convierten estas comillas rectas (`""`) en comillas tipográficas rizadas (`“”` o `‘’`). Si pasas esto literal a tu motor de búsqueda local de AppSheet, **nunca hará match**.
**Regla:** Siempre limpia o "sanitiza" el texto objetivo eliminando todas las formas de comillas antes de comparar.
```typescript
const target = userInput.trim().toLowerCase().replace(/["'“”‘’]/g, '').replace(/\s+/g, ' ');
```

### C. Estructura de Respuesta Inesperada
Aunque la API suele devolver un array de objetos (`[{ row }, { row }]`), fallos en AppSheet pueden devolver páginas HTML de error o JSON con metadatos.
**Regla:** Siempre verifica `Array.isArray(data)` antes de invocar comandos como `.find` o `.map`.

## 4. Fragmento de Código de Referencia

A continuación, la estructura base garantizada para TypeScript nativo en NodeJS usando `fetch`:

```typescript
export const fetchAppSheetData = async (tableName: string) => {
    const url = `https://api.appsheet.com/api/v2/apps/${process.env.APPSHEET_APP_ID}/tables/${tableName}/Action`;
    
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'ApplicationAccessKey': process.env.APPSHEET_ACCESS_KEY as string,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            Action: "Find",
            Properties: { Locale: "es-ES" },
            Rows: []
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error(`[AppSheet API] ERROR HTTP ${response.status}:`, errorText);
        return null; // O lanza una excepción. Nunca asumas éxito.
    }

    const data = await response.json();
    if (!Array.isArray(data)) {
        console.error(`[AppSheet API] Respuesta malformada, no es un array:`, data);
        return null;
    }

    return data;
};
```
