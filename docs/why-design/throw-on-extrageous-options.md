# extrageousOptionsBehavior Design

## Why Three Behaviors

A boolean forces a false dichotomy. Real-world CLI tools need:
- `'throw'`: Strict validation for most commands
- `'filter-out'`: Silently ignore extras when they're harmless
- `'pass-through'`: Forward options to underlying tools in wrappers

These are fundamentally different behaviors, not just "strict" vs "permissive".

## Why `'throw'` (Default)

**Fail-Safe**: Prevents mistakes by catching typos and invalid options early.

**Schema as Contract**: The options schema defines what a command accepts. Extra options violate this contract.

**Explicit Opt-In**: Choosing `'filter-out'` or `'pass-through'` is a conscious decision that makes intent clear.

## Why `'filter-out'`

Discards extra options silently before they reach the handler. Useful when extras are harmless noise or future-proofing, but you don't need to forward them.

## Why `'pass-through'`

Preserves extra options for the handler. Essential for CLI wrappers that forward options to underlying tools, which do their own validation. This is also essential for tools that accept arbitrary user-defined options—filtering or throwing would block valid, user-intended data from reaching the handler.

## Why Per-Command

Commands have different semantic needs. A wrapper needs pass-through; a strict validator needs throw. Per-command configuration allows each to express its requirements without forcing a global policy.
