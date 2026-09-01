# gerogo's MCP dev-tool server

An [MCP](https://modelcontextprotocol.io) server that exposes this
project's own `apc` CLI (plus its compiled route table) as tools an MCP
client — Claude Desktop, Claude Code, any other MCP-speaking assistant —
can call while you're developing gerogo. It's a plain PHP script (no
Node, no extra dependency), talking JSON-RPC 2.0 over stdio — the same
protocol every other MCP server uses, just hand-rolled here instead of
pulling in an SDK.

**This is a dev tool, not part of the app.** It never gets booted by
`app.php`, never appears in `Runner::modules()`, and adds nothing to
what a real HTTP request goes through — it just shells out to `apc`
(or, for `list_routes`, boots `Runner` in a short-lived child process)
and hands the result back to whatever MCP client asked.

## Wiring it into a client

**Claude Code** — from this project's root:

```bash
claude mcp add gerogo -- php mcp-server
```

Or add it by hand to `.mcp.json` in the project root:

```json
{
  "mcpServers": {
    "gerogo": {
      "command": "php",
      "args": ["mcp-server"],
      "cwd": "/Users/axis/Projects/components_rn/ap"
    }
  }
}
```

**Claude Desktop** — add the same shape to `claude_desktop_config.json`
(Settings → Developer → Edit Config), using the **absolute** path to
`mcp-server` since Desktop doesn't run it from this project's directory:

```json
{
  "mcpServers": {
    "gerogo": {
      "command": "php",
      "args": ["/Users/axis/Projects/components_rn/ap/mcp-server"]
    }
  }
}
```

Restart the client afterward — MCP servers are only started at launch.

## What it can do

| Tool | What it does |
|---|---|
| `list_routes` | Every compiled route (method, path, controller, action) — the same table `Router` dispatches from. |
| `apc_build` | `apc build` — regenerate `runner/` in place, compile + cache routes, sync the schema. `clean: true` for `apc build --clean`. |
| `apc_install` | `apc install [module] [version]` — validate the whole app, or one `packages/<name>`. |
| `apc_clean` | `apc clean` — wipe `runner/` and the route cache, no rebuild. |
| `apc_start` | `apc start`, launched **detached** — the tool call returns as soon as the server has bound (or reports why it didn't); the server keeps running after. |
| `apc_stop` | `apc stop` — stop a server `apc_start` began, wherever it's running. |

`apc_build`/`apc_install`/`apc_start`/`apc_stop` all take an optional
`flavour` argument (`local`/`production`/`staging`, or any other name) —
see the root README's "Flavours" section for what that means. Leaving it
out uses whatever `apc` itself defaults to (a real `APP_ENV` env var,
else `local`).

## Manually poking at it

Every request is one line of JSON in, one line of JSON out — you don't
need a real MCP client to try it:

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | php mcp-server
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"list_routes","arguments":{}}}' | php mcp-server
```

## Why `apc_start` doesn't just shell out like the others

`apc start` never exits on its own — it runs the server in the
foreground until `Ctrl+C`/`apc stop`. Waiting for it the way every other
tool here does (`proc_close()`, which blocks until the child exits)
would hang the tool call forever. `apc_start` instead launches it via a
detached `nohup ... &`, waits ~1.5s to see whether it actually bound
successfully, and returns either way — the server itself is unaffected
by whether this MCP server process is still running.

One real gotcha hit and fixed while building this: `nohup CMD &` run
through PHP's `shell_exec()` only detaches cleanly as a **single**
command — wrapping it in a `cd path && nohup CMD &` compound (to set a
working directory) made `shell_exec()` block forever, even though the
exact same line runs instantly from an interactive shell. Bash forks an
extra subshell to background a multi-command job, and that subshell
doesn't release `popen()`'s own pipe until *it* exits — which, for a
server meant to keep running, is never. `apc_start` avoids this by
never needing `cd` in the first place (every path it passes is already
absolute).

## Adding a new tool

Add one entry to `GerogoTools::definitions()` (name, description, a
JSON Schema `inputSchema`) and one arm to the `match` in
`GerogoTools::call()`. Return a plain string — `McpServer` wraps it in
the `{content: [{type: "text", text: ...}]}` shape MCP expects, and
setting `isError` from whether your method threw. Shell out to `apc`
via `runApc()` if the capability already exists there; only reach for a
standalone script like `list-routes.php` when nothing in `apc` already
does what you need.
