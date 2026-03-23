Add configurable polarity support to inline flags to basic-args plugin config, example:

```js
polarity: (flagName) => ({ positive: `enable-${flagName}`, negative: `disable-${flagName}` })
```

Signature:
```ts
type PolarityConfig = false | ((flagName: string) => { positive: string, negative: string });
```

Default:
```ts
polarity: noPrefixPolarity;
```

Presets:
```ts
const noPrefixPolarity: PolarityConfig = (flagName) => ({ positive: flagName, negative: `no-${flagName}` });
const enableDisablePrefixPolarity: PolarityConfig = (flagName) => ({ positive: `enable-${flagName}`, negative: `disable-${flagName}` });
```
