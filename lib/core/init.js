const inquirer = require('inquirer');
const { createProject } = require('./create');
const questions = require('./prompts');
const { validateProjectName } = require('../utils/validate');
const logger = require('../utils/logger');
const spinner = require('../utils/spinner');

async function init(projectName) {
  try {
    // validate project name
    await validateProjectName(projectName);

    logger.title('Project Configuration');
    const answers = await inquirer.prompt(questions);

    // don't start the spinner here, let createProject manage its own spinner
    // spinner.start('Creating project...');
    await createProject(projectName, answers);

    // ensure any spinners are stopped
    spinner.stop();

    // show next steps
    showNextSteps(projectName);
  } catch (error) {
    // if an error is thrown, ensure the spinner stops
    spinner.fail('Project creation failed');
    spinner.stop();
    logger.error(error.message);
    process.exit(1);
  }
}

function showNextSteps(projectName) {
  logger.title('Next Steps');
  logger.info(`
  cd ${projectName}
  npm run dev
  `);
  
  logger.success('Let\'s start coding!');
}

module.exports = {
  init
};