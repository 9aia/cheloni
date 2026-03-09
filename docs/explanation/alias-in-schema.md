# Alias in Schema

## Why is the option alias defined within the schema rather than as a top-level property?

Defining the alias inside the schema (using `.meta({ aliases: [...] })`) ensures a consistent pattern across all options — whether they are inline command options or reusable bequeath options. This approach keeps all metadata about an option—including its aliases—grouped together in the place where the option itself is defined, making your CLI definitions more intuitive and easier to maintain.
