# jAIme - Asistente Inteligente para LukeAPP-Andina

jAIme es un asistente inteligente diseñado para Cristian y su equipo, integrado con el ecosistema de **LukeAPP-Andina**. El sistema combina un bot de Telegram automatizado con un agente de inteligencia artificial capaz de consultar datos técnicos y notificar cambios críticos en tiempo real.

## Características Principales

- **Branding Unificado**: Identidad propia como "jAIme".
- **Notificaciones Automáticas**: Integración vía Webhooks con AppSheet/LukeAPP para alertar sobre cambios de estado.
- **Vinculación Simplificada**: Proceso de registro ágil mediante el comando `/vincular "Nombre Apellido"`.
- **Búsqueda Estricta**: Validación 100% exacta por nombre para garantizar la precisión en la asignación de perfiles.
- **Agente IA**: Procesamiento de lenguaje natural para consultas complejas sobre proyectos industriales.

## Estructura del Proyecto

### `/src`
Directorio raíz del código fuente en TypeScript.
- **index.ts**: Punto de entrada principal. Configura el servidor Express (API) y arranca el bot de Telegram.
- **config.ts**: Configuración centralizada y validación de variables de entorno (Zod).

### `/src/bot`
Toda la lógica relativa a la interfaz de Telegram.
- **index.ts**: Inicialización de **grammY**, definición de comandos básicos y middleware.
- **handlers.ts**: Manejadores de comandos y mensajes. Contiene la lógica de vinculación de usuarios.
- **auth.ts**: Middleware de autenticación y seguridad para el bot.

### `/src/agent`
El "cerebro" del asistente.
- **loop.ts**: Bucle principal de ejecución del agente inteligente.
- **llm.ts**: Conexión con el proveedor de IA (OpenAI).
- **tools.ts**: Definición de las herramientas (tools) que el agente puede utilizar.
- **appsheet.ts**: Integración con la API de AppSheet (búsqueda y actualización).
- **lukeapp.ts**: Integración con la base de datos Supabase de LukeAPP.

### `/src/api`
Endpoints para comunicación externa.
- **webhook.ts**: Recibe payloads de LukeAPP y gestiona el envío de notificaciones a los destinatarios correctos.

### `/src/db`
Capa de persistencia de datos.
- **firebase.ts**: Inicialización de Firebase Admin SDK.
- **store.ts**: Gestión de historial de conversaciones y logs en Firestore.

## Despliegue

El proyecto está preparado para ejecutarse en entornos Node.js utilizando TypeScript.

### Scripts Disponibles
- `npm run dev`: Inicia el modo desarrollo con recarga automática (tsx).
- `npm run build`: Compila el código a JavaScript (`dist/`).
- `npm run start`: Ejecuta la versión compilada en producción.

---
© 2026 LukeAPP-Andina
