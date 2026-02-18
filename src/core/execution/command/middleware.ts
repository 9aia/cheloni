import type { Command } from "~/core/creation/command";
import type { Middleware, NextFunction } from "~/core/creation/command/middleware";
import { halt, type Context } from "~/core/execution/command";

export interface ExecuteMiddlewareOptions {
    middlewares: Middleware[];
    command: Command;
}

export async function executeMiddleware(
    options: ExecuteMiddlewareOptions
): Promise<Context> {
    let context: Context = {};
    
    if (options.middlewares.length === 0) {
        return context;
    }
    
    let middlewareIndex = 0;
    
    const next: NextFunction = async () => {
        if (middlewareIndex < options.middlewares.length) {
            const middleware = options.middlewares[middlewareIndex++];
            if (middleware) {
                await middleware({
                    command: options.command,
                    context,
                    next,
                    halt,
                });
            }
        }
    };
    
    // Start middleware chain
    await next();
    
    return context;
}
