import z from "zod";

export const priorityOptionSchema = z
  .enum(["low", "medium", "high"])
  .optional()
  .describe("Task priority");

export const statusFilterOptionSchema = z
  .enum(["pending", "completed", "all"])
  .optional()
  .describe("Filter by status");

export const taskIdPositionalSchema = z.number().describe("Task ID");
export const taskNamePositionalSchema = z.string().describe("Task name");
