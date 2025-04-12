const chalk = require('chalk');

const logger = {
  debug: (msg) => process.env.DEBUG && console.log(chalk.gray(msg)),
  info: (msg) => console.log(chalk.blue(msg)),
  success: (msg) => console.log(chalk.green('✔ ' + msg)),
  warning: (msg) => console.log(chalk.yellow('⚠ ' + msg)),
  error: (msg) => console.log(chalk.red('✘ ' + msg)),
};

module.exports = logger;