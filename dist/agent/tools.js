"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeToolCall = exports.getToolDefinitions = void 0;
const store_js_1 = require("../db/store.js");
const lukeapp_js_1 = require("./lukeapp.js");
const appsheet_js_1 = require("./appsheet.js");
const coreTools = {
    get_current_time: {
        definition: {
            type: "function",
            function: {
                name: "get_current_time",
                description: "Returns the current date and time in Spanish. Use when the user asks for the time or date.",
                parameters: { type: "object", properties: {}, required: [] },
            },
        },
        executor: () => {
            const now = new Date();
            return `Fecha y hora actual: ${now.toLocaleString("es-ES")}`;
        },
    },
    save_memory: {
        definition: {
            type: "function",
            function: {
                name: "save_memory",
                description: "Saves a key-value fact about the user into long-term memory for future conversations.",
                parameters: {
                    type: "object",
                    properties: {
                        key: { type: "string", description: "Unique identifier in snake_case, e.g. 'user_name'" },
                        value: { type: "string", description: "Content to remember." }
                    },
                    required: ["key", "value"],
                },
            },
        },
        executor: async ({ key, value }, userId) => {
            await (0, store_js_1.setMemory)(userId, key, value);
            return `Memoria '${key}' guardada.`;
        },
    },
    get_memory: {
        definition: {
            type: "function",
            function: {
                name: "get_memory",
                description: "Retrieves a specific memory by key.",
                parameters: {
                    type: "object",
                    properties: {
                        key: { type: "string" }
                    },
                    required: ["key"],
                },
            },
        },
        executor: async ({ key }, userId) => {
            const val = await (0, store_js_1.getMemory)(userId, key);
            return val ? `Memoria '${key}': ${val}` : `No hay memoria guardada para '${key}'.`;
        },
    },
    list_memories: {
        definition: {
            type: "function",
            function: {
                name: "list_memories",
                description: "Lists all saved memory keys for the current user.",
                parameters: { type: "object", properties: {}, required: [] },
            },
        },
        executor: async (_args, userId) => {
            const memories = await (0, store_js_1.getAllMemories)(userId);
            if (!memories || memories.length === 0)
                return "Sin memorias guardadas todavía.";
            return memories.map((m) => `- ${m.key}: ${m.value}`).join("\n");
        },
    },
};
// Merge core tools with LukeAPP data tools and AppSheet
const allTools = { ...coreTools, ...lukeapp_js_1.lukeappTools, ...appsheet_js_1.appsheetTools };
const getToolDefinitions = () => Object.values(allTools).map(t => t.definition);
exports.getToolDefinitions = getToolDefinitions;
const executeToolCall = async (name, argsRaw, userId = "unknown") => {
    const tool = allTools[name];
    if (!tool)
        return `Error: Herramienta '${name}' no encontrada.`;
    try {
        const args = JSON.parse(argsRaw);
        return await tool.executor(args, userId);
    }
    catch (error) {
        return `Error ejecutando '${name}': ${error.message}`;
    }
};
exports.executeToolCall = executeToolCall;
