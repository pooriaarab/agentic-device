import { randomUUID } from "node:crypto";
import { GuardError, VendorError, createDryRunResult, type DispatchResult, type Guards, type Logger } from "./core.js";

export type ConnectionType = "wda" | "esp32-hid" | "simulator";
export interface Device { udid: string; label: string; connectionType: ConnectionType; }

export class DeviceRegistry {
  private readonly devices = new Map<string, Device>();
  register(device: Device): Device {
    if (!device.udid.trim() || !device.label.trim()) throw new Error("device udid and label are required");
    this.devices.set(device.udid, { ...device });
    return { ...device };
  }
  list(): Device[] { return [...this.devices.values()].map((device) => ({ ...device })); }
  get(udid: string): Device | undefined { const device = this.devices.get(udid); return device && { ...device }; }
}

export type DeviceAction =
  | { type: "tap"; x: number; y: number }
  | { type: "typeText"; text: string }
  | { type: "pressKey"; key: string }
  | { type: "screenshot" }
  | { type: "launchApp"; bundleId: string }
  | { type: "home" }
  | { type: "humanCheckpoint"; reason: string };
export interface ActionResult { dryRun: boolean; device: string; action: DeviceAction["type"]; result?: unknown; needsHuman?: boolean; }
export interface DeviceDriver { readonly name: string; tap(x: number, y: number): Promise<unknown>; typeText(text: string): Promise<unknown>; pressKey(key: string): Promise<unknown>; screenshot(): Promise<unknown>; launchApp(bundleId: string): Promise<unknown>; home(): Promise<unknown>; }

export interface WdaDriverOptions { fetchFn?: typeof fetch; }
export class WdaDriver implements DeviceDriver {
  readonly name = "wda"; private readonly fetchFn: typeof fetch;
  constructor(private readonly endpoint: string, options: WdaDriverOptions = {}) { this.fetchFn = options.fetchFn ?? fetch; }
  private async request(path: string, body?: unknown): Promise<unknown> {
    let response: Response; try { response = await this.fetchFn(`${this.endpoint.replace(/\/$/, "")}${path}`, { method: body === undefined ? "GET" : "POST", headers: { "content-type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) }); } catch (error) { throw new VendorError(`WDA request failed: ${String(error)}`, { cause: error }); }
    if (!response.ok) throw new VendorError(`WDA returned status ${response.status}`, { status: response.status });
    try { return await response.json(); } catch { return undefined; }
  }
  tap(x: number, y: number): Promise<unknown> { return this.request("/wda/tap/0", { x, y }); }
  typeText(text: string): Promise<unknown> { return this.request("/wda/keys", { value: [...text] }); }
  pressKey(key: string): Promise<unknown> { return this.request("/wda/keys", { value: [key] }); }
  screenshot(): Promise<unknown> { return this.request("/screenshot"); }
  launchApp(bundleId: string): Promise<unknown> { return this.request("/wda/apps/launch", { bundleId }); }
  home(): Promise<unknown> { return this.request("/wda/pressButton", { name: "home" }); }
}

export interface SerialTransport { write(frame: string): Promise<void> | void; }
export class Esp32HidDriver implements DeviceDriver {
  readonly name = "esp32-hid"; constructor(private readonly transport: SerialTransport) {}
  private async send(type: string, value?: unknown): Promise<unknown> { try { await this.transport.write(JSON.stringify({ type, value })); return { type, value }; } catch (error) { throw new VendorError(`ESP32 HID transport failed: ${String(error)}`, { cause: error }); } }
  tap(x: number, y: number): Promise<unknown> { return this.send("tap", { x, y }); }
  typeText(text: string): Promise<unknown> { return this.send("text", text); }
  pressKey(key: string): Promise<unknown> { return this.send("key", key); }
  screenshot(): Promise<unknown> { throw new VendorError("ESP32 HID cannot take screenshots"); }
  launchApp(bundleId: string): Promise<unknown> { return this.send("launchApp", bundleId); }
  home(): Promise<unknown> { return this.send("key", "HOME"); }
}

export class SimulatorDriver implements DeviceDriver {
  readonly name = "simulator"; readonly actions: Array<{ type: string; value?: unknown }> = [];
  private record(type: string, value?: unknown): unknown { const item = { type, value }; this.actions.push(item); return item; }
  async tap(x: number, y: number): Promise<unknown> { return this.record("tap", { x, y }); }
  async typeText(text: string): Promise<unknown> { return this.record("typeText", text); }
  async pressKey(key: string): Promise<unknown> { return this.record("pressKey", key); }
  async screenshot(): Promise<unknown> { return this.record("screenshot"); }
  async launchApp(bundleId: string): Promise<unknown> { return this.record("launchApp", bundleId); }
  async home(): Promise<unknown> { return this.record("home"); }
}

export interface RunActionOptions { guards?: Guards; logger?: Logger; dryRun?: boolean; }
function actionText(action: DeviceAction): string { return action.type === "typeText" ? action.text : JSON.stringify(action); }
export async function runAction(device: Device, driver: DeviceDriver, action: DeviceAction, options: RunActionOptions = {}): Promise<ActionResult> {
  if (action.type === "humanCheckpoint") return { dryRun: true, device: device.udid, action: action.type, needsHuman: true, result: { reason: action.reason } };
  options.guards?.checkDispatch(actionText(action));
  if (options.dryRun !== false) return { dryRun: true, device: device.udid, action: action.type };
  let result: unknown;
  switch (action.type) { case "tap": result = await driver.tap(action.x, action.y); break; case "typeText": result = await driver.typeText(action.text); break; case "pressKey": result = await driver.pressKey(action.key); break; case "screenshot": result = await driver.screenshot(); break; case "launchApp": result = await driver.launchApp(action.bundleId); break; case "home": result = await driver.home(); break; }
  options.guards?.recordDispatch(); options.logger?.info(`ran ${action.type} on ${device.udid}`);
  return { dryRun: false, device: device.udid, action: action.type, result };
}

export type PostTaskStatus = "queued" | "claimed" | "completed" | "failed";
export interface PostTask { id: string; device: string; platform: string; text: string; mediaPath?: string; status: PostTaskStatus; audit: Array<{ at: string; event: string; detail?: string }>; }
export class PostTaskQueue {
  private readonly tasks = new Map<string, PostTask>();
  createPostTask(device: string, platform: string, text: string, mediaPath?: string): PostTask { const task: PostTask = { id: randomUUID(), device, platform, text, mediaPath, status: "queued", audit: [{ at: new Date().toISOString(), event: "created" }] }; this.tasks.set(task.id, task); return structuredClone(task); }
  claimTask(id: string): PostTask { return this.transition(id, "claimed", "claimed"); }
  completeTask(id: string): PostTask { return this.transition(id, "completed", "completed"); }
  failTask(id: string, detail?: string): PostTask { return this.transition(id, "failed", "failed", detail); }
  list(): PostTask[] { return [...this.tasks.values()].map((task) => structuredClone(task)); }
  private transition(id: string, status: PostTaskStatus, event: string, detail?: string): PostTask { const task = this.tasks.get(id); if (!task) throw new Error(`task not found: ${id}`); task.status = status; task.audit.push({ at: new Date().toISOString(), event, detail }); return structuredClone(task); }
}
