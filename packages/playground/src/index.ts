import { createCli, defineRootCommand, executeCli } from "cheloni";

const rootCommand = defineRootCommand({
  commands: [
    {
      name: "hello",
      handler: () => console.log("Hello, world!"),
    },
  ],
});

const cli = await createCli({
  metaUrl: import.meta.url,
  command: rootCommand,
});

await executeCli({ cli });

// import z from "zod";
// import { createCli, defineCommand, defineMiddleware, executeCli } from "cheloni";
// import {
//   deprecationPlugin,
//   errorHandlerPlugin,
//   helpPlugin,
//   versionPlugin,
//   dryRunOptionSchema,
// } from "cheloni/std/core";
// import { configPlugin } from "cheloni/std/config";
// import { verbosePlugin } from "cheloni/std/logger";

// const basicPluginKit = [errorHandlerPlugin, helpPlugin, versionPlugin, deprecationPlugin] as const;

// const loggerMiddleware = defineMiddleware(async ({ next }) => {
//   console.log("logger");
//   return next();
// });

// const configMiddleware = defineMiddleware(async ({ next }) => {
//   console.log("config");
//   return next({ ctx: { config: { verbose: true } } });
// });

// const authMiddleware = defineMiddleware(async ({ next }) => {
//   console.log("auth");
//   return next({ ctx: { session: { user: "test" } } });
// });

// const deploy = defineCommand({
//   name: "deploy",
//   description: "Deploy to production",
//   paths: ["deploy", "d"], // `d` is now considered a alias for the command
//   positional: z.enum(["staging", "production"]).meta({ description: "Environment" }),
//   options: z.object({
//     dryRun: dryRunOptionSchema,
//     force: z
//       .boolean()
//       .optional()
//       .meta({ aliases: ["f"] }),
//     variadic: z
//       .array(z.string())
//       .optional()
//       .meta({ description: "Variadic arguments", aliases: ["v"] }),
//   }),
//   middleware: [loggerMiddleware, configMiddleware, authMiddleware],
//   examples: ["deploy staging", "deploy production --force"],
//   details: "Deploys your application to the specified environment.",
//   handler: async ({ positional, options }) => {
//     /**
//      * Full type inference:
//      * {
//      *   positional: "staging" | "production",
//      *   options: { dryRun?: boolean, force?: boolean },
//      *   ctx: { session: Session }
//      * }
//      */
//     console.log(`Deploying to ${positional}...`);
//     if (options.dryRun) console.log("Dry run mode");
//     if (options.force) console.log("Force mode enabled");
//   },
// });

// const run = defineCommand({
//   name: "run",
//   options: z.object({
//     watch: z
//       .boolean()
//       .default(true)
//       .meta({
//         aliases: ["w"],
//         description: "Re-run when files change",
//       }),
//   }),
//   handler: ({ options }) => {
//     // options.watch is boolean
//     console.log("Watch mode:", options.watch);
//   },
// });

// const add = defineCommand({
//   name: "add",
//   positional: z.coerce.number().meta({ name: "number" }),
//   handler: ({ positional }) => {
//     // positional: number
//     console.log("Adding:", positional);
//   },
// });

// const deploy2 = defineCommand({
//   name: "deploy2",
//   positional: z.string().meta({
//     name: "environment",
//     description: "Environment name (dev, staging, prod)",
//   }),
//   handler: ({ positional }) => {
//     // positional: string
//     console.log("Deploying to:", positional);
//   },
// });

// const show = defineCommand({
//   name: "show",
//   positional: z.string().optional().meta({ name: "id" }),
//   handler: ({ positional }) => {
//     // positional is string | undefined
//     console.log("Showing:", positional);
//   },
// });

// const show2 = defineCommand({
//   name: "show2",
//   positional: z.array(z.string()).meta({ name: "scripts" }),
//   handler: ({ positional }) => {
//     // positional: string[]
//     console.log("Showing:", positional.join(", "));
//   },
// });

// const cli = await createCli({
//   name: "my-cli",
//   version: "1.0.0",
//   command: {
//     commands: [deploy, run, add, deploy2, show, show2],
//     bequeathOptions: [], // Options inherited by subcommands
//   },
//   plugins: [configPlugin, verbosePlugin, ...basicPluginKit],
// });

// await executeCli({ cli });

// export default createCli({
//   name: "my-cli",
//   version: "1.0.0",
//   command: {
//     commands: [deploy, run],
//     bequeathOptions: [], // Options inherited by subcommands
//   },
//   plugins: [configPlugin, verbosePlugin, ...basicPluginKit],
// });
