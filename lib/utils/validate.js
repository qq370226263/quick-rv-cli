const fs = require('fs-extra');
const path = require('path');
const logger = require('./logger');
const chalk = require('chalk');
const inquirer = require('inquirer');

async function validateProjectName(projectName) {
  if (!projectName) {
    logger.error('project name is required');
    process.exit(1);
  }

  // check if project name is valid
  if (!/^[a-zA-Z][\w-]*$/.test(projectName)) {
    logger.error('project name must start with a letter and can only contain letters, numbers, underscores, and hyphens');
    process.exit(1);
  }

  const projectPath = path.join(process.cwd(), projectName);
  
  if (await fs.exists(projectPath)) {

      console.log(chalk.red.bold('\n⚠️  Warning!'));
      console.log(chalk.yellow(`\nProject folder "${projectName}" already exists!`));
      
      const { action } = await inquirer.prompt([
        {
          name: 'action',
          type: 'confirm',
          message: chalk.red.bold('Delete existing project and continue?'),
          default: false
        }
      ]);

      if (!action) {
        console.log(chalk.yellow('\nOperation cancelled'));
        process.exit(1);
      }

      await fs.remove(projectPath);
      logger.info(`Deleted existing project "${projectName}"`);
    // logger.error(`Directory ${projectName} already exists`);
    // process.exit(1);
  }


  return true;
}

module.exports = {
  validateProjectName
};