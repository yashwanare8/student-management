// MCP Server 1: Database (talks to the Render API -> MongoDB Atlas)
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const API = (process.env.API_URL || "").trim().replace(/\/+$/, "");
if (!API) { console.error("API_URL is not set"); process.exit(1); }

const out = (t, isError = false) => ({ content: [{ type: "text", text: t }], isError });

async function call(method, path = "", body) {
  try {
    const res = await fetch(API + path, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(90000) // Render free tier may take ~50s to wake up
    });
    const data = await res.json().catch(() => ({}));
    return out(JSON.stringify(data, null, 2), !res.ok);
  } catch (e) {
    return out("Request failed: " + e.message, true);
  }
}

const server = new McpServer({ name: "student-database", version: "1.0.0" });

server.tool(
  "add_student",
  "Add a new student to the MongoDB Atlas database",
  {
    studentId: z.string(), name: z.string(), email: z.string(),
    department: z.string(), semester: z.number().int().min(1).max(12),
    contact: z.string().optional()
  },
  async (args) => call("POST", "", args)
);

server.tool(
  "list_students",
  "List all students, or search by ID, name or department",
  { search: z.string().optional() },
  async ({ search }) => call("GET", search ? `?search=${encodeURIComponent(search)}` : "")
);

server.tool(
  "update_student",
  "Update details of an existing student (identified by studentId)",
  {
    studentId: z.string(), name: z.string().optional(), email: z.string().optional(),
    department: z.string().optional(), semester: z.number().int().min(1).max(12).optional(),
    contact: z.string().optional()
  },
  async ({ studentId, ...changes }) => call("PUT", "/" + encodeURIComponent(studentId), changes)
);

server.tool(
  "delete_student",
  "Delete a student by studentId",
  { studentId: z.string() },
  async ({ studentId }) => call("DELETE", "/" + encodeURIComponent(studentId))
);

await server.connect(new StdioServerTransport());
console.error("student-database MCP server running");
