import { describe, expect, test } from "vitest";
import { parseArgs, runCli, type CliIo } from "./cli.js";
import { DeviceRegistry, PostTaskQueue, SimulatorDriver } from "./device.js";
function io(): CliIo & { lines: string[] } { const lines: string[] = []; return { lines, out: x => lines.push(x), err: x => lines.push(x), registry: new DeviceRegistry(), queue: new PostTaskQueue(), driver: new SimulatorDriver() }; }
describe("cli", () => { test("help and device registration", async () => { const x = io(); expect(parseArgs([]).command).toBe("help"); expect(await runCli(["device", "register", "--udid", "u", "--label", "mine", "--connection", "simulator"], x)).toBe(0); expect(JSON.parse(x.lines[0])).toMatchObject({ udid: "u" }); }); });
