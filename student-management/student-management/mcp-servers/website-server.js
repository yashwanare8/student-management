// MCP Server 2: Website (edits frontend files, pushes to GitHub -> Netlify auto-deploys)
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { readFile, writeFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";

const run = promisify(execFile);
const DIR = process.env.FRONTEND_DIR;
if (!DIR) { console.error("FRONTEND_DIR is not set"); process.exit(1); }
const CSS = path.join(DIR, "style.css");
const HTML = path.join(DIR, "index.html");

const out = (t, isError = false) => ({ content: [{ type: "text", text: t }], isError });
const isColor = (c) => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(c) || /^[a-z]{3,20}$/i.test(c);
const esc = (s) => s.replace(/[&<>"']/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

async function publish(message) {
  const git = (...a) => run("git", a, { cwd: DIR });
  const { stdout } = await git("status", "--porcelain", "--", ".");
  if (!stdout.trim()) return "No changes to publish (already up to date).";
  await git("add", "-A", ".");
  await git("commit", "-m", message);
  await git("push");
  return "Pushed to GitHub. Netlify will redeploy automatically in about 30-60 seconds.";
}

const server = new McpServer({ name: "student-website", version: "1.0.0" });

server.tool(
  "set_color",
  "Change the website color and publish it live. target 'primary' = header and buttons, 'background' = page background. color = name (green) or hex (#2e7d32)",
  { target: z.enum(["primary", "background"]), color: z.string() },
  async ({ target, color }) => {
    try {
      if (!isColor(color)) return out("Invalid color. Use a color name or hex like #2e7d32.", true);
      const v = target === "primary" ? "--primary" : "--bg";
      const re = new RegExp(`(${v}\\s*:\\s*)[^;]+;`);
      let css = await readFile(CSS, "utf8");
      if (!re.test(css)) return out(`${v} not found in style.css. Update style.css first.`, true);
      css = css.replace(re, (m, p1) => p1 + color + ";");
      await writeFile(CSS, css);
      return out(`${target} color set to ${color}. ` + await publish(`Set ${target} color to ${color}`));
    } catch (e) { return out("Failed: " + e.message, true); }
  }
);

server.tool(
  "set_site_title",
  "Change the website heading/title text and publish it live",
  { title: z.string().min(1).max(80) },
  async ({ title }) => {
    try {
      let html = await readFile(HTML, "utf8");
      html = html
        .replace(/<h1>[\s\S]*?<\/h1>/, () => `<h1>${esc(title)}</h1>`)
        .replace(/<title>[\s\S]*?<\/title>/, () => `<title>${esc(title)}</title>`);
      await writeFile(HTML, html);
      return out(`Title set to "${title}". ` + await publish(`Set site title to ${title}`));
    } catch (e) { return out("Failed: " + e.message, true); }
  }
);

server.tool(
  "get_site_info",
  "Show the website's current colors and title",
  {},
  async () => {
    try {
      const css = await readFile(CSS, "utf8");
      const html = await readFile(HTML, "utf8");
      const get = (v) => (css.match(new RegExp(`${v}\\s*:\\s*([^;]+);`)) || [])[1];
      const h1 = (html.match(/<h1>([\s\S]*?)<\/h1>/) || [])[1];
      return out(JSON.stringify({ primary: get("--primary"), background: get("--bg"), title: h1 }, null, 2));
    } catch (e) { return out("Failed: " + e.message, true); }
  }
);

await server.connect(new StdioServerTransport());
console.error("student-website MCP server running");
