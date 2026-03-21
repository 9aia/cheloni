import type { AnyMiddleware, MiddlewareFactory } from "~/core";

export interface ConfigMiddlewareOptions {
    config: unknown;
    configFile: string | undefined;
}

export const configMiddleware: MiddlewareFactory<ConfigMiddlewareOptions, AnyMiddleware> = (options) => {
    return async ({ next }) => {
        return next({ ctx: { config: options.config, configFile: options.configFile } });
    };
};
