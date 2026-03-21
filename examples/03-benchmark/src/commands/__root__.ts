import { defineRootCommand } from 'cheloni';
import { runCommand } from './run';

export default defineRootCommand({
  commands: [runCommand],
});
