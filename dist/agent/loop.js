"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runAgentLoop = void 0;
const llm_js_1 = require("./llm.js");
const tools_js_1 = require("./tools.js");
const store_js_1 = require("../db/store.js");
const MAX_ITERATIONS = 5;
const SYSTEM_PROMPT = `
Eres jAIme, el asistente inteligente de LukeAPP. Ayudas a Cristian y su equipo con datos de proyectos industriales.

Personalidad:
- Profesional, amable y directo. No uses textos largos ni rellenos innecesarios.
- Habla en español de forma natural.

Capacidades:
- Tienes acceso a herramientas para consultar proyectos, spools, materiales y miembros. Úsalas siempre que el usuario pregunte algo relacionado.
- Si el usuario te saluda o parece perdido, ofrécele ayuda mencionando qué puedes consultar (proyectos, spools, etc.) de forma amigable, sin forzar un menú rígido.

Regla de Oro:
- Cuando uses una herramienta, presenta SIEMPRE los datos encontrados de forma clara antes de continuar la conversación.
`;
const runAgentLoop = async (userId, userMessage) => {
    // 1. Save user msg to Firestore
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
            const assistantMsg = {
                role: "assistant",
                content: responseMessage.content || null,
                tool_calls: responseMessage.tool_calls
            };
            messages.push(assistantMsg);
            await (0, store_js_1.insertMessage)(userId, assistantMsg);
            for (const toolCall of responseMessage.tool_calls) {
                if (toolCall.type === "function") {
                    const functionName = toolCall.function.name;
                    const functionArgs = toolCall.function.arguments;
                    console.log(`[Agent:${userId}] Calling tool: ${functionName}`);
                    const toolResult = await (0, tools_js_1.executeToolCall)(functionName, functionArgs, userId);
                    console.log(`[Agent:${userId}] Tool Result:`, toolResult);
                    const toolMsg = {
                        role: "tool",
                        tool_call_id: toolCall.id,
                        name: functionName,
                        content: toolResult
                    };
                    messages.push(toolMsg);
                    await (0, store_js_1.insertMessage)(userId, toolMsg);
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
