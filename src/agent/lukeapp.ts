import { config } from "../config.js";
import type { AgentTool } from "./tools.js";

// Lightweight Supabase REST client (no SDK needed for simple queries)
const supabaseHeaders = {
    "Content-Type": "application/json",
    "apikey": config.SUPABASE_SERVICE_ROLE_KEY,
    "Authorization": `Bearer ${config.SUPABASE_SERVICE_ROLE_KEY}`,
    "Prefer": "count=exact",
};

async function supabaseQuery(table: string, params: Record<string, string> = {}): Promise<any[]> {
    const url = new URL(`${config.SUPABASE_URL}/rest/v1/${table}`);
    for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, value);
    }
    const res = await fetch(url.toString(), { headers: supabaseHeaders });
    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Supabase error (${res.status}): ${errText}`);
    }
    return res.json();
}

export const lukeappTools: Record<string, AgentTool> = {
    query_projects: {
        definition: {
            type: "function",
            function: {
                name: "query_projects",
                description: "Lists active projects registered in LukeAPP, including their company and status. Use this when asked about what projects exist.",
                parameters: {
                    type: "object",
                    properties: {},
                    required: [],
                },
            },
        },
        executor: async () => {
            const rows = await supabaseQuery("projects", {
                "select": "name,code,status,companies(name)",
                "limit": "20",
                "order": "created_at.desc",
            });
            if (!rows || rows.length === 0) return "No hay proyectos registrados.";
            return rows.map((p: any) =>
                `📁 **${p.name}** (${p.code}) — Estado: ${p.status} | Empresa: ${p.companies?.name ?? "N/D"}`
            ).join("\n");
        },
    },

    query_spools: {
        definition: {
            type: "function",
            function: {
                name: "query_spools",
                description: "Searches for spools (pipe segments) in LukeAPP by status or line number. Use when asked about fabrication progress, spool status, or line numbers.",
                parameters: {
                    type: "object",
                    properties: {
                        status: { type: "string", description: "Filter by status (e.g. PENDING, IN_PROGRESS, COMPLETED). Leave empty for all." },
                        limit: { type: "number", description: "Max results to return (default 10)." },
                    },
                    required: [],
                },
            },
        },
        executor: async ({ status, limit = 10 }: { status?: string; limit?: number }) => {
            const params: Record<string, string> = {
                "select": "spool_number,status,line_number,isometric_number,projects(name)",
                "limit": String(limit ?? 10),
                "order": "updated_at.desc",
            };
            if (status) params["status"] = `eq.${status.toUpperCase()}`;

            const rows = await supabaseQuery("spools", params);
            if (!rows || rows.length === 0) return "No se encontraron spools con ese filtro.";
            return rows.map((s: any) =>
                `🔩 Spool **${s.spool_number}** | Línea: ${s.line_number ?? "N/D"} | Iso: ${s.isometric_number ?? "N/D"} | Estado: ${s.status} | Proyecto: ${s.projects?.name ?? "N/D"}`
            ).join("\n");
        },
    },

    query_materials: {
        definition: {
            type: "function",
            function: {
                name: "query_materials",
                description: "Searches the material catalog in LukeAPP by item code or description. Use when asked about available materials, specifications, or stock.",
                parameters: {
                    type: "object",
                    properties: {
                        search: { type: "string", description: "Text to search in the material code or description." },
                        limit: { type: "number", description: "Max results to return (default 10)." },
                    },
                    required: ["search"],
                },
            },
        },
        executor: async ({ search, limit = 10 }: { search: string; limit?: number }) => {
            const params: Record<string, string> = {
                "select": "ident_code,description,unit,spec_code,projects(name)",
                "limit": String(limit ?? 10),
                "or": `(ident_code.ilike.*${search}*,description.ilike.*${search}*)`,
            };
            const rows = await supabaseQuery("material_catalog", params);
            if (!rows || rows.length === 0) return `No se encontraron materiales que coincidan con "${search}".`;
            return rows.map((m: any) =>
                `📦 **${m.ident_code}** | ${m.description} | Unidad: ${m.unit} | Spec: ${m.spec_code ?? "N/D"} | Proyecto: ${m.projects?.name ?? "N/D"}`
            ).join("\n");
        },
    },

    query_members: {
        definition: {
            type: "function",
            function: {
                name: "query_members",
                description: "Lists team members registered in LukeAPP projects. Use when asked about who works on a project or what roles people have.",
                parameters: {
                    type: "object",
                    properties: {
                        project_name: { type: "string", description: "Filter by partial project name (optional)." },
                    },
                    required: [],
                },
            },
        },
        executor: async ({ project_name }: { project_name?: string }) => {
            const params: Record<string, string> = {
                "select": "role,users(full_name,email),projects(name),company_roles(name)",
                "limit": "20",
            };
            const rows = await supabaseQuery("members", params);
            if (!rows || rows.length === 0) return "No se encontraron miembros.";

            let filtered = rows;
            if (project_name) {
                filtered = rows.filter((m: any) =>
                    m.projects?.name?.toLowerCase().includes(project_name.toLowerCase())
                );
            }
            if (filtered.length === 0) return `No se encontraron miembros en proyectos que coincidan con "${project_name}".`;

            return filtered.map((m: any) =>
                `👤 ${m.users?.full_name ?? m.users?.email ?? "N/D"} — Rol: ${m.company_roles?.name ?? m.role} | Proyecto: ${m.projects?.name ?? "Global"}`
            ).join("\n");
        },
    },
};
