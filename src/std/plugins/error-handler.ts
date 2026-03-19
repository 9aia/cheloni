import { definePlugin } from "~/core/definition/plugin";
import { showError } from "~/std/services/error-handling";

export default definePlugin({
    name: "error-handler",
    onError: ({ error }) => {
        showError(error);
        return true;
    },
});
