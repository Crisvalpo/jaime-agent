import OpenAI from "openai";
import { config } from "../config.js";

// Main LLM client using Groq
export const groqClient = new OpenAI({
    apiKey: config.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1",
});

// Fallback LLM client using OpenRouter
export const openRouterClient = new OpenAI({
    apiKey: config.OPENROUTER_API_KEY,
    baseURL: "https://openrouter.ai/api/v1",
    defaultHeaders: {
        "HTTP-Referer": "https://jaime-agent.local",
        "X-Title": "jAIme Agent",
    }
});

export const callLLM = async (
    messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
    tools?: OpenAI.Chat.Completions.ChatCompletionTool[],
    useFallback = false
): Promise<OpenAI.Chat.Completions.ChatCompletionMessage> => {
    const client = useFallback ? openRouterClient : groqClient;
    const model = useFallback ? config.OPENROUTER_MODEL : "llama-3.3-70b-versatile"; // Default Groq model

    try {
        const response = await client.chat.completions.create({
            model,
            messages,
            tools,
            tool_choice: tools && tools.length > 0 ? "auto" : "none",
        });

        return response.choices[0].message;
    } catch (error) {
        console.error(`❌ LLM Error (Fallback: ${useFallback}):`, error);
        if (!useFallback) {
            console.log("⚠️ Retrying with fallback (OpenRouter)...");
            return callLLM(messages, tools, true);
        }
        throw error;
    }
};
