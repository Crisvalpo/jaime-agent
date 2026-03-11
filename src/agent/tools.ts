import { setMemory, getMemory, getAllMemories } from "../db/store.js";
import { lukeappTools } from "./lukeapp.js";

// userId is always passed from the bot handler, "unknown" as safe fallback
type ToolExecutor = (args: any, userId: string) => Promise<string> | string;

export interface ToolDefinition {
    type: "function";
    function: {
        name: string;
        description: string;
        parameters: any;
    };
}

export interface AgentTool {
    definition: ToolDefinition;
    executor: ToolExecutor;
}

const coreTools: Record<string, AgentTool> = {
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
        executor: async ({ key, value }: { key: string; value: string }, userId: string) => {
            await setMemory(userId, key, value);
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
        executor: async ({ key }: { key: string }, userId: string) => {
            const val = await getMemory(userId, key);
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
        executor: async (_args: any, userId: string) => {
            const memories = await getAllMemories(userId);
            if (!memories || memories.length === 0) return "Sin memorias guardadas todavía.";
            return memories.map((m: any) => `- ${m.key}: ${m.value}`).join("\n");
        },
    },
};

// Merge core tools with LukeAPP data tools
const allTools: Record<string, AgentTool> = { ...coreTools, ...lukeappTools };

export const getToolDefinitions = () => Object.values(allTools).map(t => t.definition);

export const executeToolCall = async (name: string, argsRaw: string, userId: string = "unknown"): Promise<string> => {
    const tool = allTools[name];
    if (!tool) return `Error: Herramienta '${name}' no encontrada.`;

    try {
        const args = JSON.parse(argsRaw);
        return await tool.executor(args, userId);
    } catch (error: any) {
        return `Error ejecutando '${name}': ${error.message}`;
    }
};
