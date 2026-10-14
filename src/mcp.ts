import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { DeviceRegistry, PostTaskQueue, SimulatorDriver, runAction } from "./device.js";
import { getCostReport } from "./core.js";
import { DEFAULT_BRAND } from "./index.js";
const ok = (value: unknown) => ({ content: [{ type: "text" as const, text: JSON.stringify(value) }] });
const error = (value: unknown) => ({ ...ok({ error: value instanceof Error ? value.message : String(value) }), isError: true as const });
export interface McpDeps { registry?: DeviceRegistry; queue?: PostTaskQueue; driver?: SimulatorDriver; }
export function createMcpServer(deps: McpDeps = {}): McpServer { const registry = deps.registry ?? new DeviceRegistry(); const queue = deps.queue ?? new PostTaskQueue(); const driver = deps.driver ?? new SimulatorDriver(); const server = new McpServer({ name: DEFAULT_BRAND.command, version: DEFAULT_BRAND.version });
 server.registerTool("device_list", { description: "List registered owner devices.", inputSchema: {} }, async () => ok(registry.list()));
 server.registerTool("device_register", { description: "Register an owner device.", inputSchema: { udid: z.string(), label: z.string(), connectionType: z.enum(["wda", "esp32-hid", "simulator"]) } }, async (input) => { try { return ok(registry.register(input)); } catch (e) { return error(e); } });
 server.registerTool("device_action", { description: "Run a device action; defaults to safe dry run. humanCheckpoint always returns needs-human.", inputSchema: { udid: z.string(), action: z.object({ type: z.enum(["tap", "typeText", "pressKey", "screenshot", "launchApp", "home", "humanCheckpoint"]) }).passthrough(), execute: z.boolean().optional() } }, async ({ udid, action, execute }) => { const device = registry.get(udid); if (!device) return error("device not found"); try { return ok(await runAction(device, driver, action as never, { dryRun: !execute })); } catch (e) { return error(e); } });
 server.registerTool("create_post_task", { description: "Queue a phone posting task.", inputSchema: { device: z.string(), platform: z.string(), text: z.string(), mediaPath: z.string().optional() } }, async (input) => ok(queue.createPostTask(input.device, input.platform, input.text, input.mediaPath)));
 server.registerTool("claim_task", { description: "Claim a queued post task.", inputSchema: { id: z.string() } }, async ({ id }) => { try { return ok(queue.claimTask(id)); } catch (e) { return error(e); } });
 server.registerTool("complete_task", { description: "Complete a post task.", inputSchema: { id: z.string() } }, async ({ id }) => { try { return ok(queue.completeTask(id)); } catch (e) { return error(e); } });
 server.registerTool("fail_task", { description: "Fail a post task with an audit record.", inputSchema: { id: z.string(), detail: z.string().optional() } }, async ({ id, detail }) => { try { return ok(queue.failTask(id, detail)); } catch (e) { return error(e); } });
 server.registerTool("get_cost_report", { description: "Read session costs.", inputSchema: {} }, async () => ok(getCostReport())); return server; }
export async function startMcp(deps: McpDeps = {}): Promise<void> { const server = createMcpServer(deps); await server.connect(new StdioServerTransport()); }
