"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const zod_1 = require("zod");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const envSchema = zod_1.z.object({
    TELEGRAM_BOT_TOKEN: zod_1.z.string().min(1, "Bot token is required"),
    TELEGRAM_ALLOWED_USER_IDS: zod_1.z.string().transform((val) => val.split(",").map((id) => parseInt(id.trim(), 10)).filter(id => !isNaN(id))),
    GROQ_API_KEY: zod_1.z.string().min(1, "Groq API key is required"),
    OPENROUTER_API_KEY: zod_1.z.string().min(1, "OpenRouter API key is required"),
    OPENROUTER_MODEL: zod_1.z.string().default("openrouter/free"),
    DB_PATH: zod_1.z.string().default("./memory.db"),
});
const parseEnv = () => {
    const result = envSchema.safeParse(process.env);
    if (!result.success) {
        console.error("❌ Invalid environment variables:", result.error.format());
        process.exit(1);
    }
    return result.data;
};
exports.config = parseEnv();
