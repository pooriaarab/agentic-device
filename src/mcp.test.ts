import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { describe, expect, test } from "vitest";
import { createMcpServer } from "./mcp.js";
describe("mcp", () => { test("exposes device and task tools", async () => { const [ct, st] = InMemoryTransport.createLinkedPair(); const server = createMcpServer(); await server.connect(st); const client = new Client({ name: "test", version: "1" }); await client.connect(ct); try { const names = (await client.listTools()).tools.map(t => t.name); expect(names).toContain("device_register"); expect(names).toContain("create_post_task"); } finally { await client.close(); await server.close(); } }); });
