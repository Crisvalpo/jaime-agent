import { callLLM } from "./llm.js";
import { getToolDefinitions, executeToolCall } from "./tools.js";
import { insertMessage, getRecentMessages } from "../db/store.js";

const MAX_ITERATIONS = 5;

const SYSTEM_PROMPT = `
Eres jAIme, asistente de LukeAPP con acceso a datos reales de proyectos industriales.
Idioma: siempre español. Respuestas: cortas y concretas.

FLUJO OBLIGATORIO:
1. Si el usuario saluda o no sabe qué pedir → muestra este menú exacto:
   "¿Qué quieres consultar?
   a) Proyectos activos
   b) Estado de spools
   c) Materiales
   d) Miembros del equipo"

2. Si el usuario elige una opción (a/b/c/d o escribe algo relacionado) → llama INMEDIATAMENTE a la herramienta correspondiente y muestra los resultados. NO muestres sub-menús.
   - a o "proyectos" → llama query_projects
   - b o "spools" → llama query_spools
   - c o "materiales" → llama query_materials
   - d o "miembros" → llama query_members

3. Después de mostrar resultados → pregunta: "¿Qué más quieres consultar?" con el menú breve.

NUNCA muestres sub-menús. NUNCA pidas más información antes de llamar a la herramienta.
`;

export const runAgentLoop = async (userId: string, userMessage: string): Promise<string> => {
    // 1. Save user msg to Firestore (isolated by userId)
    await insertMessage(userId, { role: "user", content: userMessage });

    let iterations = 0;
    let isDone = false;
    let finalReply = "Ocurrió un error inesperado al procesar tu solicitud.";

    const tools = getToolDefinitions();

    // Load history for this specific user
    const history = await getRecentMessages(userId, 10);
    const messages: any[] = [
        { role: "system", content: SYSTEM_PROMPT },
        ...history
    ];

    while (!isDone && iterations < MAX_ITERATIONS) {
        iterations++;

        const responseMessage = await callLLM(messages, tools);

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
                    const toolResult = await executeToolCall(functionName, functionArgs, userId);

                    messages.push({
                        role: "tool",
                        tool_call_id: toolCall.id,
                        name: functionName,
                        content: toolResult
                    });
                }
            }
        } else {
            finalReply = responseMessage.content || "No tengo una respuesta.";
            isDone = true;
            await insertMessage(userId, { role: "assistant", content: finalReply });
        }
    }

    if (iterations >= MAX_ITERATIONS) {
        finalReply = "He alcanzado mi límite de iteraciones. ¿En qué más puedo ayudarte?";
    }

    return finalReply;
};
