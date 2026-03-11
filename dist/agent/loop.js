"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runAgentLoop = void 0;
const llm_js_1 = require("./llm.js");
const tools_js_1 = require("./tools.js");
const store_js_1 = require("../db/store.js");
const MAX_ITERATIONS = 5;
const SYSTEM_PROMPT = `
Eres jAIme, un asistente de IA personal, seguro y que funciona de forma local vía Telegram.
Fuiste creado desde cero por mí (tu creador) para ser simple, seguro y completamente bajo mi control.
Debes comunicarte SIEMPRE en español de forma natural.
Tienes memoria a largo plazo (usa save_memory, get_memory y list_memories para gestionar tus conocimientos sobre el usuario).
Tienes acceso a la hora actual con get_current_time.
Responde de manera concisa y directa, a menos que se te pida más detalle.
`;
const runAgentLoop = async (userMessage) => {
    // 1. Save user msg to DB
    await (0, store_js_1.insertMessage)({ role: "user", content: userMessage });
    let iterations = 0;
    let isDone = false;
    let finalReply = "Ocurrió un error inesperado al procesar tu solicitud.";
    // Tools definition
    const tools = (0, tools_js_1.getToolDefinitions)();
    while (!isDone && iterations < MAX_ITERATIONS) {
        iterations++;
        // 2. Fetch context (system prompt + recent history)
        const history = await (0, store_js_1.getRecentMessages)(10); // get last 10 messages
        const messages = [
            { role: "system", content: SYSTEM_PROMPT },
            ...history
        ];
        // 3. Call LLM
        const responseMessage = await (0, llm_js_1.callLLM)(messages, tools);
        // 4. Save LLM interaction
        if (responseMessage.content) {
            await (0, store_js_1.insertMessage)({
                role: "assistant",
                content: responseMessage.content
            });
        }
        if (responseMessage.tool_calls) {
            await (0, store_js_1.insertMessage)({
                role: "assistant",
                content: null,
                tool_calls: JSON.stringify(responseMessage.tool_calls)
            });
        }
        // 5. Check if LLM wants to use a tool
        if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
            for (const toolCall of responseMessage.tool_calls) {
                if (toolCall.type === "function") {
                    const functionName = toolCall.function.name;
                    const functionArgs = toolCall.function.arguments;
                    console.log(`[Agent] Calling tool: ${functionName} with ${functionArgs}`);
                    // Execute tool
                    const toolResult = await (0, tools_js_1.executeToolCall)(functionName, functionArgs);
                    console.log(`[Agent] Tool result for ${functionName}:`, toolResult);
                    // Save tool result
                    await (0, store_js_1.insertMessage)({
                        role: "tool",
                        tool_call_id: toolCall.id,
                        name: functionName,
                        content: toolResult
                    });
                }
            }
            // Loop again so LLM can read the tool result and answer the user
        }
        else {
            // 6. Final answer reached
            finalReply = responseMessage.content || "No tengo una respuesta (contenido vacío).";
            isDone = true;
        }
    }
    if (iterations >= MAX_ITERATIONS) {
        finalReply = "He alcanzado mi límite de iteraciones pensadas. ¿En qué más puedo ayudarte?";
    }
    return finalReply;
};
exports.runAgentLoop = runAgentLoop;
