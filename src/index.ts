export { VERSION } from "./version.js";
export { defineBrand, createLogger, GuardError, VendorError, createGuards, recordCost, getCostReport, resetCosts } from "./core.js";
export type { BrandConfig, LogLevel, Logger, LoggerOptions, CapsConfig, QuietHoursConfig, GuardsConfig, Guards, CostEntry, CostReport } from "./core.js";
export { DeviceRegistry, WdaDriver, Esp32HidDriver, SimulatorDriver, runAction, PostTaskQueue } from "./device.js";
export type { Device, ConnectionType, DeviceAction, ActionResult, DeviceDriver, WdaDriverOptions, SerialTransport, RunActionOptions, PostTask, PostTaskStatus } from "./device.js";
import { defineBrand, type BrandConfig } from "./core.js";
import { VERSION } from "./version.js";
export const DEFAULT_BRAND: BrandConfig = defineBrand({ name: "Agentic Device", command: "agentic-device", description: "Control your own iPhones through approved device drivers.", keywords: ["iphone", "esp32", "webdriveragent", "device", "mcp"], version: VERSION });
