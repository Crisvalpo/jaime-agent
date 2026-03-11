import { callLLM } from "./llm.js";
import { getToolDefinitions, executeToolCall } from "./tools.js";
import { insertMessage, getRecentMessages } from "../db/store.js";

const MAX_ITERATIONS = 5;

const SYSTEM_PROMPT = `
Eres jAIme, un asistente de IA personal, seguro y que funciona de forma local vía Telegram.
Fuiste creado desde cero por mí (tu creador) para ser simple, seguro y completamente bajo mi control.
Debes comunicarte SIEMPRE en español de forma natural.
Tienes memoria a largo plazo (usa save_memory, get_memory y list_memories para gestionar tus conocimientos sobre el usuario).
Tienes acceso a la hora actual con get_current_time.
Responde de manera concisa y directa, a menos que se te pida más detalle.
`;

export const runAgentLoop = async (userMessage: string): Promise<string> => {
    // 1. Save user msg to DB
    await insertMessage({ role: "user", content: userMessage });

    let iterations = 0;
    let isDone = false;
    let finalReply = "Ocurrió un error inesperado al procesar tu solicitud.";

    // Tools definition
    const tools = getToolDefinitions();

    while (!isDone && iterations < MAX_ITERATIONS) {
        iterations++;

        // 2. Fetch context (system prompt + recent history)
        const history = await getRecentMessages(10); // get last 10 messages
        const messages: any[] = [
            { role: "system", content: SYSTEM_PROMPT },
            ...history
        ];

        // 3. Call LLM
        const responseMessage = await callLLM(messages, tools);

        // 4. Save LLM interaction
        if (responseMessage.content) {
            await insertMessage({
                role: "assistant",
                content: responseMessage.content
            });
        }

        if (responseMessage.tool_calls) {
            await insertMessage({
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
                    const toolResult = await executeToolCall(functionName, functionArgs);

                    console.log(`[Agent] Tool result for ${functionName}:`, toolResult);

                    // Save tool result
                    await insertMessage({
                        role: "tool",
                        tool_call_id: toolCall.id,
                        name: functionName,
                        content: toolResult
                    });
                }
            }
            // Loop again so LLM can read the tool result and answer the user
        } else {
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
