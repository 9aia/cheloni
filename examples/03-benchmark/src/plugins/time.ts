import { definePlugin } from "cheloni";

export default definePlugin({
  name: "time",
  onBeforeCommandExecution: async ({ execute }) => {
    return await execute({
      ctx: {
        startTime: Date.now(),
      },
    });
  },
  onAfterCommandExecution: async ({ ctx }) => {
    const startTime = ctx.startTime;
    if (startTime === undefined) return;
    const duration = Date.now() - startTime;
    const verbose = ctx.verbose === true;

    if (verbose) {
      console.log(`\n⏱️  Command executed in ${duration}ms`);
    } else {
      console.log(`\n⏱️  ${duration}ms`);
    }
  },
});
