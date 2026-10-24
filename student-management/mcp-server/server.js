const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const { Server } = require("@modelcontextprotocol/sdk/server/index.js");
const {
  CallToolRequestSchema,
  ListToolsRequestSchema
} = require("@modelcontextprotocol/sdk/types.js");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");

const apiBaseUrl = process.env.API_BASE_URL?.replace(/\/+$/, "");
const apiToken = process.env.MCP_API_TOKEN;

if (!apiBaseUrl || !apiToken) {
  console.error("Set API_BASE_URL and MCP_API_TOKEN in the MCP server environment.");
  process.exit(1);
}

const tools = [
  {
    name: "list_students",
    description: "Find or list students in the student management database.",
    inputSchema: {
      type: "object",
      properties: { search: { type: "string", description: "Optional name, ID, or department search." } }
    }
  },
  {
    name: "add_student",
    description: "Add a student record to the database.",
    inputSchema: {
      type: "object",
      properties: {
        studentId: { type: "string" },
        name: { type: "string" },
        email: { type: "string" },
        department: { type: "string" },
        semester: { type: "number", minimum: 1, maximum: 12 },
        contact: { type: "string" }
      },
      required: ["studentId", "name", "email", "department", "semester"]
    }
  },
  {
    name: "update_student",
    description: "Update fields for a student identified by their student ID.",
    inputSchema: {
      type: "object",
      properties: {
        studentId: { type: "string" },
        name: { type: "string" },
        email: { type: "string" },
        department: { type: "string" },
        semester: { type: "number", minimum: 1, maximum: 12 },
        contact: { type: "string" }
      },
      required: ["studentId"]
    }
  },
  {
    name: "delete_student",
    description: "Permanently delete a student record by student ID.",
    inputSchema: {
      type: "object",
      properties: { studentId: { type: "string" } },
      required: ["studentId"]
    }
  },
  {
    name: "get_background_color",
    description: "Get the current website background color.",
    inputSchema: { type: "object", properties: {} }
  },
  {
    name: "set_background_color",
    description: "Set the website background color using a hex color such as #f2f5f9. The site updates within a few seconds.",
    inputSchema: {
      type: "object",
      properties: {
        color: { type: "string", pattern: "^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$" }
      },
      required: ["color"]
    }
  }
];

async function apiRequest(path, { method = "GET", body, authenticated = true } = {}) {
  const headers = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (authenticated) headers.Authorization = `Bearer ${apiToken}`;

  const response = await fetch(`${apiBaseUrl}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.message || `Backend request failed (${response.status})`);
  }
  return result;
}

function resultText(result) {
  return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
}

const server = new Server(
  { name: "student-management", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params;

  try {
    let result;
    switch (name) {
      case "list_students": {
        const query = args.search ? `?search=${encodeURIComponent(args.search)}` : "";
        result = await apiRequest(`/mcp/students${query}`);
        break;
      }
      case "add_student":
        result = await apiRequest("/mcp/students", { method: "POST", body: args });
        break;
      case "update_student": {
        const { studentId, ...changes } = args;
        if (!Object.keys(changes).length) throw new Error("Provide at least one field to update.");
        result = await apiRequest(`/mcp/students/${encodeURIComponent(studentId)}`, {
          method: "PUT",
          body: changes
        });
        break;
      }
      case "delete_student":
        result = await apiRequest(`/mcp/students/${encodeURIComponent(args.studentId)}`, {
          method: "DELETE"
        });
        break;
      case "get_background_color":
        result = await apiRequest("/settings", { authenticated: false });
        break;
      case "set_background_color":
        result = await apiRequest("/mcp/settings", {
          method: "PUT",
          body: { backgroundColor: args.color }
        });
        break;
      default:
        return {
          content: [{ type: "text", text: `Unknown tool: ${name}` }],
          isError: true
        };
    }
    return resultText(result);
  } catch (error) {
    return {
      content: [{ type: "text", text: error.message }],
      isError: true
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("MCP server failed:", error);
  process.exit(1);
});
