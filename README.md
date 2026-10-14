# agentic-device

[![npm version](https://img.shields.io/npm/v/agentic-device)](https://www.npmjs.com/package/agentic-device)
[![npm downloads per month](https://img.shields.io/npm/dm/agentic-device)](https://www.npmjs.com/package/agentic-device)
[![license](https://img.shields.io/npm/l/agentic-device)](https://www.npmjs.com/package/agentic-device)

[npm package](https://www.npmjs.com/package/agentic-device) · [CLI](#cli) · [Library](#library) · [Safety](#safety) · [Limits](#limits)

agentic-device is a TypeScript library, CLI, and MCP server for driving phones **you own** — an iPhone through WebDriverAgent or an ESP32 HID bridge — so an agent can run setup-oriented UI actions and queue auditable phone-posting tasks.
It is a consent-first device pack: actions dry-run by default and anything that needs a human (passcode, CAPTCHA, verification code) stops with `needs-human` instead of faking progress.

## Install

```sh
npm install agentic-device
```

Requires Node.js and the published `dist/` build. Two runtime dependencies: the MCP SDK and zod.

## Post your first task

```sh
agentic-device device register --udid MY_PHONE_UDID --label "My iPhone" --connection simulator
agentic-device device action --udid MY_PHONE_UDID --action '{"type":"home"}'
agentic-device device post-task --udid MY_PHONE_UDID --platform instagram --text "Ship day"
agentic-device device queue
```

`device action` and `post-task` are dry runs until you pass `--execute`, and `device action` stays a review gate even then: the run reports what the driver did or the `VendorError` it hit.

## CLI

```sh
agentic-device device register --udid <id> --label <label> --connection <wda|esp32-hid|simulator>
agentic-device device list
agentic-device device action --udid <id> --action <json> [--execute]
agentic-device device post-task --udid <id> --platform <name> --text <text> [--media <path>]
agentic-device device queue [--claim|--complete|--fail <task-id>]
agentic-device costs
agentic-device mcp
```

## Library

```ts
import { DeviceRegistry, SimulatorDriver, runAction } from "agentic-device";

const registry = new DeviceRegistry();
const phone = registry.register({ udid: "mine", label: "My iPhone", connectionType: "simulator" });
await runAction(phone, new SimulatorDriver(), { type: "home" }); // dry run
```

## MCP server

`agentic-device mcp` (or `npx agentic-device-mcp`) serves the same registry, queue, drivers, and cost report as tools on stdio, so a host such as Claude Code or Cursor can register a device, preview an action, and read the task queue.

## Use cases

- A support agent queues a product-announcement post for a device on your desk and you approve the run.
- A QA agent drives its own simulator through an app's onboarding to capture screenshots.
- A posting pipeline records each device task as an auditable queue entry instead of an untracked script.

## Alternatives and related tools

- [Appium](https://appium.io) is the general mobile-automation framework; WebDriverAgent is its iOS driver, and agentic-device speaks the same protocol for the posting-task subset.
- [ESP32-BLE-Keyboard](https://github.com/T-vK/ESP32-BLE-Keyboard) is the reference firmware for the Bluetooth-HID path.
- Full device-farm products (BrowserStack App Automate, Firebase Test Lab) rent you devices at scale; this pack is for the phones on your own desk.

## Safety

- Register only your own phones by UDID.
- `device action` is a dry run by default; pass `--execute` only after review.
- `humanCheckpoint` always returns `needs-human` for passcode, CAPTCHA, and verification-code steps — the pack never bypasses a platform check.
- Drivers surface failures as `VendorError`; they never report failed hardware or network work as success.

## Limits

- No passcode, CAPTCHA, two-factor, or App Store review bypass — ever.
- The WebDriverAgent path needs a reachable WDA endpoint for a physical device; `simulator` is the zero-hardware option.
- The posting queue is in-process by default; persist tasks in your own store for production runs.

## Upstream bases

The WDA driver follows the protocol exposed by [appium/WebDriverAgent](https://github.com/appium/WebDriverAgent). The ESP32 HID path is designed around [ESP32-BLE-Keyboard](https://github.com/T-vK/ESP32-BLE-Keyboard). These integrations are for owner-operated devices only.

## License

MIT
