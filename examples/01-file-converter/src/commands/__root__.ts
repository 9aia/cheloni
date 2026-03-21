import { defineRootCommand } from 'cheloni';
import { convertCommand } from './convert';

export default defineRootCommand({
  commands: [convertCommand],
});
