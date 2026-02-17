import type { Command } from "~/core/creation/command";
import type { Middleware, MiddlewareData, NextFunction } from "~/core/creation/command/middleware";

export interface ExecuteMiddlewareOptions {
    middlewares: Middleware[];
    command: Command;
}

export async function executeMiddleware(
    options: ExecuteMiddlewareOptions
): Promise<MiddlewareData> {
    let data: MiddlewareData = {};
    
    if (options.middlewares.length === 0) {
        return data;
    }
    
    let middlewareIndex = 0;
    
    const next: NextFunction = async () => {
        if (middlewareIndex < options.middlewares.length) {
            const middleware = options.middlewares[middlewareIndex++];
            if (middleware) {
                await middleware({
                    command: options.command,
                    data,
                    next,
                });
            }
        }
    };
    
    // Start middleware chain
    await next({ data });
    
    return data;
}
