import { defineRootCommand } from "cheloni";
import { readCommand } from "./read";
import { writeCommand } from "./write";

export default defineRootCommand({
  commands: [readCommand, writeCommand],
});
