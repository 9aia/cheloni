import { CheloniError } from "~/utils/errors";

export class CliError extends CheloniError {
    constructor(message: string) {
        super(message);
        this.name = "CliError";
    }
}
