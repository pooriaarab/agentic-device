import { describe, expect, test } from "vitest";
import { DeviceRegistry, Esp32HidDriver, SimulatorDriver, WdaDriver, PostTaskQueue, runAction } from "./device.js";
describe("device library", () => {
 test("simulator records an executed action and dry run is default", async () => { const registry = new DeviceRegistry(); const device = registry.register({ udid: "u", label: "mine", connectionType: "simulator" }); const driver = new SimulatorDriver(); expect(await runAction(device, driver, { type: "tap", x: 1, y: 2 })).toMatchObject({ dryRun: true }); expect(driver.actions).toHaveLength(0); await runAction(device, driver, { type: "tap", x: 1, y: 2 }, { dryRun: false }); expect(driver.actions).toHaveLength(1); });
 test("human checkpoint always needs a human", async () => { const result = await runAction({ udid: "u", label: "mine", connectionType: "simulator" }, new SimulatorDriver(), { type: "humanCheckpoint", reason: "CAPTCHA" }, { dryRun: false }); expect(result).toMatchObject({ needsHuman: true, dryRun: true }); });
 test("queue has audit entries", () => { const queue = new PostTaskQueue(); const task = queue.createPostTask("u", "x", "hi"); expect(queue.claimTask(task.id).audit).toHaveLength(2); expect(queue.completeTask(task.id).status).toBe("completed"); });
 test("ESP serial failures are VendorError", async () => { const driver = new Esp32HidDriver({ write: () => { throw new Error("no serial"); } }); await expect(driver.home()).rejects.toMatchObject({ code: "VENDOR_FAILED" }); });
 test("WDA accepts injected fetch", async () => { const driver = new WdaDriver("http://wda", { fetchFn: async () => new Response("{}", { status: 200 }) }); await expect(driver.home()).resolves.toEqual({}); });
});
