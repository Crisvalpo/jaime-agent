"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runAgentLoop = void 0;
const llm_js_1 = require("./llm.js");
const tools_js_1 = require("./tools.js");
const store_js_1 = require("../db/store.js");
const MAX_ITERATIONS = 5;
const SYSTEM_PROMPT = `
Eres jAIme, asistente de LukeAPP con acceso a datos reales de proyectos industriales.
Idioma: siempre español. Respuestas breves y directas.

FLUJO OBLIGATORIO:
1. Si el usuario saluda o no sabe qué pedir → muestra este menú exacto:
   "¿Qué quieres consultar?
   a) Proyectos activos
   b) Estado de spools
   c) Materiales
   d) Miembros del equipo"

2. Si el usuario elige una opción o hace una pregunta relacionada → llama la herramienta SIN hacer más preguntas:
   - a o "proyectos" → query_projects
   - b o "spools" → query_spools
   - c o "materiales" → query_materials
   - d o "miembros" → query_members

3. Cuando recibas el resultado de la herramienta → PRIMERO escribe los resultados completos al usuario. LUEGO, en la misma respuesta, pregunta: "¿Qué más quieres consultar?" con el menú breve.

CRÍTICO: Nunca respondas solo con el menú si ya tienes datos de una herramienta. Los datos van SIEMPRE antes del menú.
`;
const runAgentLoop = async (userId, userMessage) => {
    // 1. Save user msg to Firestore (isolated by userId)
    await (0, store_js_1.insertMessage)(userId, { role: "user", content: userMessage });
    let iterations = 0;
    let isDone = false;
    let finalReply = "Ocurrió un error inesperado al procesar tu solicitud.";
    const tools = (0, tools_js_1.getToolDefinitions)();
    // Load history for this specific user
    const history = await (0, store_js_1.getRecentMessages)(userId, 10);
    const messages = [
        { role: "system", content: SYSTEM_PROMPT },
        ...history
    ];
    while (!isDone && iterations < MAX_ITERATIONS) {
        iterations++;
        const responseMessage = await (0, llm_js_1.callLLM)(messages, tools);
        if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
            messages.push({
                role: "assistant",
                content: responseMessage.content || null,
                tool_calls: responseMessage.tool_calls
            });
            for (const toolCall of responseMessage.tool_calls) {
                if (toolCall.type === "function") {
                    const functionName = toolCall.function.name;
                    const functionArgs = toolCall.function.arguments;
                    console.log(`[Agent:${userId}] Calling tool: ${functionName}`);
                    const toolResult = await (0, tools_js_1.executeToolCall)(functionName, functionArgs, userId);
                    messages.push({
                        role: "tool",
                        tool_call_id: toolCall.id,
                        name: functionName,
                        content: toolResult
                    });
                }
            }
        }
        else {
            finalReply = responseMessage.content || "No tengo una respuesta.";
            isDone = true;
            await (0, store_js_1.insertMessage)(userId, { role: "assistant", content: finalReply });
        }
    }
    if (iterations >= MAX_ITERATIONS) {
        finalReply = "He alcanzado mi límite de iteraciones. ¿En qué más puedo ayudarte?";
    }
    return finalReply;
};
exports.runAgentLoop = runAgentLoop;
