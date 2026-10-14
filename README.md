# agentic-device

`agentic-device` is a TypeScript library, CLI, and MCP server for assisting with **devices you own and control**. It supports setup-oriented UI actions and creates auditable phone-posting tasks; it does not bypass passcodes, CAPTCHAs, or verification codes.

## Safety

- Register only your own iPhones by UDID.
- `device action` is dry-run by default; add `--execute` only after review.
- `humanCheckpoint` always pauses with `needs-human`, including for CAPTCHA, passcode, and verification-code steps.
- Drivers surface failures as `VendorError`; they never claim failed hardware/network work succeeded.

## CLI

```sh
agentic-device device register --udid MY_PHONE --label "My iPhone" --connection simulator
agentic-device device list
agentic-device device action --udid MY_PHONE --action '{"type":"home"}'
agentic-device device post-task --udid MY_PHONE --platform example --text "Hello"
agentic-device device queue
agentic-device mcp
```

## Library

```ts
import { DeviceRegistry, SimulatorDriver, runAction } from "agentic-device";
const registry = new DeviceRegistry();
const phone = registry.register({ udid: "mine", label: "My iPhone", connectionType: "simulator" });
await runAction(phone, new SimulatorDriver(), { type: "home" }); // dry run by default
```

## Upstream bases

The WDA driver is based on the protocol exposed by [appium/WebDriverAgent](https://github.com/appium/WebDriverAgent). ESP32 HID integrations are designed around [ESP32-BLE-Keyboard](https://github.com/T-vK/ESP32-BLE-Keyboard). Production task workflow concepts acknowledge [prod-farm-ios-core](https://github.com/). These integrations are for owner-operated devices only.
