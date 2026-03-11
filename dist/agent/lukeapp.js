"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lukeappTools = void 0;
const config_js_1 = require("../config.js");
// Lightweight Supabase REST client
const supabaseUrl = config_js_1.config.SUPABASE_INTERNAL_URL ?? config_js_1.config.SUPABASE_URL;
const supabaseHeaders = {
    "Content-Type": "application/json",
    "apikey": config_js_1.config.SUPABASE_SERVICE_ROLE_KEY,
    "Authorization": `Bearer ${config_js_1.config.SUPABASE_SERVICE_ROLE_KEY}`,
    "Prefer": "count=exact",
};
async function supabaseQuery(table, params = {}) {
    const url = new URL(`${supabaseUrl}/rest/v1/${table}`);
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
exports.lukeappTools = {
    query_projects: {
        definition: {
            type: "function",
            function: {
                name: "query_projects",
                description: "Lists active projects registered in LukeAPP.",
                parameters: { type: "object", properties: {}, required: [] },
            },
        },
        executor: async () => {
            const rows = await supabaseQuery("projects", {
                "select": "name,code,status,companies(name)",
                "limit": "10",
            });
            if (!rows || rows.length === 0)
                return "No hay proyectos registrados.";
            return rows.map((p) => `📁 **${p.name}** (${p.code}) — Estado: ${p.status} | Empresa: ${p.companies?.name ?? "N/D"}`).join("\n");
        },
    },
    query_spools: {
        definition: {
            type: "function",
            function: {
                name: "query_spools",
                description: "Searches for spools in projects. Use when asked about spool status.",
                parameters: {
                    type: "object",
                    properties: {
                        status: { type: "string", description: "Filter by status (PENDING, IN_FABRICATION, etc.)" },
                    },
                    required: [],
                },
            },
        },
        executor: async ({ status }) => {
            const params = {
                "select": "spool_number,status,line_number,iso_number,projects(name)",
                "limit": "10",
            };
            if (status)
                params["status"] = `eq.${status.toUpperCase()}`;
            const rows = await supabaseQuery("spools", params);
            if (!rows || rows.length === 0)
                return "No se encontraron spools.";
            return rows.map((s) => `🔩 Spool **${s.spool_number}** | Línea: ${s.line_number ?? "N/D"} | Iso: ${s.iso_number ?? "N/D"} | Estado: ${s.status}`).join("\n");
        },
    },
    query_materials: {
        definition: {
            type: "function",
            function: {
                name: "query_materials",
                description: "Searches in the material catalog.",
                parameters: {
                    type: "object",
                    properties: {
                        search: { type: "string", description: "Item code or description" },
                    },
                    required: ["search"],
                },
            },
        },
        executor: async ({ search }) => {
            const params = {
                "select": "ident_code,short_desc,spec_code",
                "limit": "10",
                "or": `(ident_code.ilike.*${search}*,short_desc.ilike.*${search}*)`,
            };
            const rows = await supabaseQuery("material_catalog", params);
            if (!rows || rows.length === 0)
                return `Sin resultados para "${search}".`;
            return rows.map((m) => `📦 **${m.ident_code}** | ${m.short_desc} | Spec: ${m.spec_code ?? "N/D"}`).join("\n");
        },
    },
    query_members: {
        definition: {
            type: "function",
            function: {
                name: "query_members",
                description: "Lists project members and their roles.",
                parameters: { type: "object", properties: {}, required: [] },
            },
        },
        executor: async () => {
            // Updated to match your schema: role_id and functional_role (via company_roles)
            const params = {
                "select": "role_id,users(full_name,email),projects(name),company_roles(name)",
                "limit": "20",
            };
            const rows = await supabaseQuery("members", params);
            if (!rows || rows.length === 0)
                return "No se encontraron miembros.";
            return rows.map((m) => `👤 ${m.users?.full_name ?? m.users?.email ?? "N/D"} — Rol: ${m.company_roles?.name ?? m.role_id} | Proyecto: ${m.projects?.name ?? "Global"}`).join("\n");
        },
    },
    query_isometrics: {
        definition: {
            type: "function",
            function: {
                name: "query_isometrics",
                description: "Lists isometrics from projects.",
                parameters: {
                    type: "object",
                    properties: {
                        line: { type: "string", description: "Line number" }
                    },
                    required: []
                },
            },
        },
        executor: async ({ line }) => {
            const params = {
                "select": "iso_number,line_number,sheet,revision_status,projects(name)",
                "limit": "10",
            };
            if (line)
                params["line_number"] = `ilike.*${line}*`;
            const rows = await supabaseQuery("isometrics", params);
            if (!rows || rows.length === 0)
                return "No se encontraron isométricos.";
            return rows.map((i) => `📐 **${i.iso_number}** | Línea: ${i.line_number ?? "N/D"} | Lámina: ${i.sheet ?? "1"} | Estado: ${i.revision_status}`).join("\n");
        },
    },
};
