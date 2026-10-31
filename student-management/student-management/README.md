
---

## MCP Integration (Claude controls Website + Database)

Two MCP servers in `mcp-servers/` let Claude act as one agent across platforms:

| MCP Server | Platform it updates | Tools |
|------------|--------------------|-------|
| `student-database` | MongoDB Atlas (via Render API) | add / list / update / delete student |
| `student-website` | Netlify (via GitHub push) | set color, set title, get info |

**Setup**
1. `cd mcp-servers && npm install`
2. Open Claude Desktop → Settings → Developer → Edit Config, and add:
```json
{
  "mcpServers": {
    "student-database": {
      "command": "node",
      "args": ["C:/FULL/PATH/student-management/mcp-servers/database-server.js"],
      "env": { "API_URL": "https://student-management-vwym.onrender.com/api/students" }
    },
    "student-website": {
      "command": "node",
      "args": ["C:/FULL/PATH/student-management/mcp-servers/website-server.js"],
      "env": { "FRONTEND_DIR": "C:/FULL/PATH/student-management/frontend" }
    }
  }
}
```
3. Fully quit and reopen Claude Desktop. Both servers should appear in the tools menu.

**Demo prompt (one prompt, two platforms)**
> Change the website primary color to green and add student ST205, Amit Patel, amit@example.com, CSE, semester 3.
