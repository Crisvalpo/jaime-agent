import { callLLM } from "./llm.js";
import { getToolDefinitions, executeToolCall } from "./tools.js";
import { insertMessage, getRecentMessages } from "../db/store.js";

const MAX_ITERATIONS = 5;

const SYSTEM_PROMPT = `
Eres jAIme, el asistente inteligente de LukeAPP-Andina. Ayudas a Cristian y su equipo con datos de proyectos industriales.

Personalidad:
- Profesional, amable y directo. No uses textos largos ni rellenos innecesarios.
- Habla en español de forma natural.

Capacidades:
- Tienes acceso a herramientas para consultar proyectos, spools, materiales y miembros. Úsalas siempre que el usuario pregunte algo relacionado.
- Si el usuario te saluda o parece perdido, ofrécele ayuda mencionando qué puedes consultar (proyectos, spools, etc.) de forma amigable, sin forzar un menú rígido.

Regla de Oro:
- Cuando uses una herramienta, presenta SIEMPRE los datos encontrados de forma clara antes de continuar la conversación.
`;

export const runAgentLoop = async (userId: string, userMessage: string): Promise<string> => {
    // 1. Save user msg to Firestore
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
            const assistantMsg = {
                role: "assistant",
                content: responseMessage.content || null,
                tool_calls: responseMessage.tool_calls
            };
            messages.push(assistantMsg);
            await insertMessage(userId, assistantMsg);

            for (const toolCall of responseMessage.tool_calls) {
                if (toolCall.type === "function") {
                    const functionName = toolCall.function.name;
                    const functionArgs = toolCall.function.arguments;

                    console.log(`[Agent:${userId}] Calling tool: ${functionName}`);
                    const toolResult = await executeToolCall(functionName, functionArgs, userId);
                    console.log(`[Agent:${userId}] Tool Result:`, toolResult);

                    const toolMsg = {
                        role: "tool",
                        tool_call_id: toolCall.id,
                        name: functionName,
                        content: toolResult
                    };
                    messages.push(toolMsg);
                    await insertMessage(userId, toolMsg);
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
