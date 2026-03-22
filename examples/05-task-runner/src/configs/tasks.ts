import z from "zod";

export const tasksConfigSchema = z.record(z.string(), z.string());
export type TasksConfig = z.infer<typeof tasksConfigSchema>;
