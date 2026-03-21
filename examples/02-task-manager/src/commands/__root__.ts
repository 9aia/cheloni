import { defineRootCommand } from 'cheloni';
import { addCommand } from './add';
import { completeCommand } from './complete';
import { deleteCommand } from './delete';
import { listCommand } from './list';

export default defineRootCommand({
  commands: [addCommand, listCommand, completeCommand, deleteCommand],
});
