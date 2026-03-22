import { definePlugin } from "cheloni";

export default definePlugin({
  name: "time",
  onCommandExecution: async ({ execute }) => {
    const ctx = await execute({
      ctx: {
        startTime: Date.now(),
      },
    });
    const startTime = ctx.startTime;
    if (startTime === undefined) return ctx;
    const duration = Date.now() - startTime;
    const verbose = ctx.verbose === true;

    if (verbose) {
      console.log(`\n⏱️  Command executed in ${duration}ms`);
    } else {
      console.log(`\n⏱️  ${duration}ms`);
    }
    return ctx;
  },
});
