#!/usr/bin/env node

const { program } = require('commander');
const { init } = require('../lib/core/init');
const { version } = require('../package.json');
const logger = require('../lib/utils/logger');


process.on('uncaughtException', (err) => {
  logger.error('An error occurred: ' + err.message);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  logger.error('An error occurred: ' + err.message);
  process.exit(1);
});

program
  .version(version, '-v, --version')
  .description('A CLI tool for quickly creating React and Vue projects');

program
  .command('init <project-name>')
  .description('Initialize a new project')
  .action(async (projectName) => {
    try {
      await init(projectName);
    } catch (err) {
      logger.error(err.message);
      process.exit(1);
    }
  });

program.parse(process.argv);