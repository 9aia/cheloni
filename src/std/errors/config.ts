import { CheloniError } from "~/utils";

export class ConfigValidationError extends CheloniError {
    constructor(message: string) {
        super(message);
        this.name = "ConfigValidationError";
    }
}
