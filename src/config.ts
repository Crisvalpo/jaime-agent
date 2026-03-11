import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
    TELEGRAM_BOT_TOKEN: z.string().min(1, "Bot token is required"),
    TELEGRAM_ALLOWED_USER_IDS: z.string().transform((val) =>
        val.split(",").map((id) => parseInt(id.trim(), 10)).filter(id => !isNaN(id))
    ),
    GROQ_API_KEY: z.string().min(1, "Groq API key is required"),
    OPENROUTER_API_KEY: z.string().min(1, "OpenRouter API key is required"),
    OPENROUTER_MODEL: z.string().default("openrouter/free"),
    // LukeAPP Supabase Connection
    // SUPABASE_INTERNAL_URL: used on the Ubuntu server to bypass Cloudflare tunnel (e.g. http://localhost:8000)
    // If not set, falls back to SUPABASE_URL (public tunnel, used locally)
    SUPABASE_URL: z.string().url().min(1, "Supabase URL is required"),
    SUPABASE_INTERNAL_URL: z.string().url().optional(),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, "Supabase Service Role Key is required"),
});

const parseEnv = () => {
    const result = envSchema.safeParse(process.env);
    if (!result.success) {
        console.error("❌ Invalid environment variables:", result.error.format());
        process.exit(1);
    }
    return result.data;
};

export const config = parseEnv();
