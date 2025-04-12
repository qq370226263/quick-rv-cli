const inquirer = require('inquirer');
const { createProject } = require('./create');
const questions = require('./prompts');
const { validateProjectName } = require('../utils/validate');
const logger = require('../utils/logger');
const spinner = require('../utils/spinner');

async function init(projectName) {
  try {
    // 验证项目名称
    await validateProjectName(projectName);

    logger.title('Project Configuration');
    const answers = await inquirer.prompt(questions);

    // 创建项目
    spinner.start('Creating project...');
    await createProject(projectName, answers);
    spinner.succeed('Project created successfully!');

    // 显示后续步骤
    showNextSteps(projectName);
  } catch (error) {
    spinner.fail('Project creation failed');
    logger.error(error.message);
    process.exit(1);
  }
}

function showNextSteps(projectName) {
  logger.title('Next Steps');
  logger.info(`
  cd ${projectName}
  npm install
  npm run dev
  `);
  
  logger.success('Let\'s start coding!');
}

module.exports = {
  init
};