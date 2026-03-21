import { gitRefSchema } from "./ref";

export const branchNameSchema = gitRefSchema.refine((v) => v !== "@", "Branch name must not be '@'");
