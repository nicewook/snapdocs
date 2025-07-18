const initCommand = require('./commands/init');
const setupCommand = require('./commands/setup');
const updateCommand = require('./commands/update');

module.exports = {
  init: initCommand,
  setup: setupCommand,
  update: updateCommand
};