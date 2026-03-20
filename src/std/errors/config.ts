import { CheloniError } from "~/utils";

export class ConfigValidationError extends CheloniError {
    constructor(message: string, cause?: unknown) {
        super(message);
        this.name = "ConfigValidationError";
        this.cause = cause;
    }
}
