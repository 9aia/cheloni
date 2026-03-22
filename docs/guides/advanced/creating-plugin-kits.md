# Creating Plugin Kits

A **plugin kit** is a reusable array of plugin definitions that you spread into `createCli({ plugins: [...] })`. There is no separate framework type: composition is normal TypeScript.

## Local kit module

```typescript
// src/plugin-kits/monitoring.ts
import { definePlugin } from "cheloni";

export const monitoringKit = [metricsPlugin, tracingPlugin] as const;
```

```typescript
// cli.ts
import { createCli, defineCli, definePlugin } from "cheloni";
import { monitoringKit } from "./plugin-kits/monitoring";

const cli = await createCli(
  defineCli({
    name: "my-cli",
    plugins: [otherPlugins, ...monitoringKit],
  }),
);
```

## Standard library `basicPluginKit`

For help, version, deprecation warnings, and default error handling, use the array exported from `cheloni/std/core`:

```typescript
import { basicPluginKit } from "cheloni/std/core";

const cli = await createCli({
  name: "my-cli",
  version: "1.0.0",
  plugins: [...basicPluginKit],
});
```

## Tips

- **Export kits from dedicated files** so teams can import one module.
- **Keep each kit focused** on one concern (observability, auth, etc.).
- **`onInit` order** follows the final `plugins` array order after all spreads.
