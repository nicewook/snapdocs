import { initCommand } from './commands/init';
import { setupCommand } from './commands/setup';
import { updateCommand } from './commands/update';

export {
  initCommand as init,
  setupCommand as setup,
  updateCommand as update
};

export default {
  init: initCommand,
  setup: setupCommand,
  update: updateCommand
};