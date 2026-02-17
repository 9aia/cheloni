import type { Middleware } from "~/core/creation/command/middleware";

export type MiddlewareDefinition = Middleware;

export function defineMiddleware(definition: MiddlewareDefinition): MiddlewareDefinition {
    return definition;
}
