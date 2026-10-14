---
name: agentic-device
description: Control your own iPhones for posting via WebDriverAgent and ESP32 HID. Keywords: iphone,esp32,webdriveragent,device,agentic-suite,cli,mcp.
---

# agentic-device

Control your own iPhones for posting via WebDriverAgent and ESP32 HID.

## Use the SDK

```js
import { summarizeText, dispatchText } from "agentic-device";

summarizeText("some text");
await dispatchText("some text", { dryRun: true });
```

## Use the CLI

```sh
agentic-device summary --text "some text"
agentic-device dispatch --text "some text" --dry-run
```

## Use the MCP server

Start the server with `agentic-device mcp`. Call `summarize_text`
for stats, `dispatch_text` for routes, `get_cost_report` for costs.

## Rules

- Preview each route with dry run first.
- Report guard denials and adapter errors as failures.
- Read the cost report at the end.
