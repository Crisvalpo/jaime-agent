import { setMemory, getMemory, getAllMemories } from "../db/store.js";

type ToolExecutor = (args: any) => Promise<string> | string;

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

// Custom tools
const tools: Record<string, AgentTool> = {
    get_current_time: {
        definition: {
            type: "function",
            function: {
                name: "get_current_time",
                description: "Returns the current local date and time. Use this when the user asks for the time or date.",
                parameters: {
                    type: "object",
                    properties: {},
                    required: [],
                },
            },
        },
        executor: () => {
            const now = new Date();
            return `Current time is: ${now.toLocaleString("es-ES")} (Timezone offset: ${now.getTimezoneOffset()})`;
        },
    },

    save_memory: {
        definition: {
            type: "function",
            function: {
                name: "save_memory",
                description: "Saves a piece of information, preference, or context about the user into long-term memory. Use this when the user tells you something you should remember for future conversations.",
                parameters: {
                    type: "object",
                    properties: {
                        key: { type: "string", description: "A unique, snake_case identifier for this memory. e.g. 'user_name', 'favorite_food'" },
                        value: { type: "string", description: "The content to remember." }
                    },
                    required: ["key", "value"],
                },
            },
        },
        executor: async ({ key, value }) => {
            await setMemory(key, value);
            return `Successfully saved memory '${key}'.`;
        },
    },

    get_memory: {
        definition: {
            type: "function",
            function: {
                name: "get_memory",
                description: "Retrieves a specific piece of information from long-term memory using its key. If you are unsure of the key, use list_memories first.",
                parameters: {
                    type: "object",
                    properties: {
                        key: { type: "string", description: "The key of the memory to block." }
                    },
                    required: ["key"],
                },
            },
        },
        executor: async ({ key }) => {
            const val = await getMemory(key);
            return val ? `Memory '${key}': ${val}` : `No memory found for key '${key}'.`;
        },
    },

    list_memories: {
        definition: {
            type: "function",
            function: {
                name: "list_memories",
                description: "Returns a list of all saved memory keys. Use this to find out what information you have stored about the user.",
                parameters: {
                    type: "object",
                    properties: {},
                    required: [],
                },
            },
        },
        executor: async () => {
            const memories = await getAllMemories();
            if (!memories || memories.length === 0) return "No memories saved yet.";
            return `Saved memory columns:\n${memories.map((m: any) => `- ${m.key}: ${m.value}`).join("\n")}`;
        },
    }
};

export const getToolDefinitions = () => Object.values(tools).map(t => t.definition);

export const executeToolCall = async (name: string, argsRaw: string): Promise<string> => {
    const tool = tools[name];
    if (!tool) {
        return `Error: Tool '${name}' not found.`;
    }

    try {
        const args = JSON.parse(argsRaw);
        return await tool.executor(args);
    } catch (error: any) {
        return `Error executing tool '${name}': ${error.message}`;
    }
};
