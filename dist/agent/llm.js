"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.callLLM = exports.openRouterClient = exports.groqClient = void 0;
const openai_1 = __importDefault(require("openai"));
const config_js_1 = require("../config.js");
// Main LLM client using Groq
exports.groqClient = new openai_1.default({
    apiKey: config_js_1.config.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1",
});
// Fallback LLM client using OpenRouter
exports.openRouterClient = new openai_1.default({
    apiKey: config_js_1.config.OPENROUTER_API_KEY,
    baseURL: "https://openrouter.ai/api/v1",
    defaultHeaders: {
        "HTTP-Referer": "https://jaime-agent.local",
        "X-Title": "jAIme Agent",
    }
});
const callLLM = async (messages, tools, useFallback = false) => {
    const client = useFallback ? exports.openRouterClient : exports.groqClient;
    const model = useFallback ? config_js_1.config.OPENROUTER_MODEL : "llama-3.3-70b-versatile"; // Default Groq model
    try {
        const response = await client.chat.completions.create({
            model,
            messages,
            tools,
            tool_choice: tools && tools.length > 0 ? "auto" : "none",
        });
        return response.choices[0].message;
    }
    catch (error) {
        console.error(`❌ LLM Error (Fallback: ${useFallback}):`, error);
        if (!useFallback) {
            console.log("⚠️ Retrying with fallback (OpenRouter)...");
            return (0, exports.callLLM)(messages, tools, true);
        }
        throw error;
    }
};
exports.callLLM = callLLM;
