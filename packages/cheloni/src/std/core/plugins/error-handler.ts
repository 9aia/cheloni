import { definePlugin } from "~/core/definition/plugin";
import { showError } from "~/std/core/views";

export default definePlugin({
  name: "error-handler",
  onError: ({ error }) => {
    showError({ error });
    return true;
  },
});
