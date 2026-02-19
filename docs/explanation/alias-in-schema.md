# Alias in Schema

## Why is the global option alias defined within the schema rather than as a top-level property?

Defining the alias inside the schema (using `.meta({ aliases: [...] })`) ensures a consistent pattern with per-command options, which also declare their aliases in their option schema. This approach keeps all metadata about an option—including its aliases—grouped together in the place where the option itself is defined, making your CLI definitions more intuitive and easier to maintain.
