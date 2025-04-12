const fs = require('fs-extra');
const path = require('path');
const logger = require('./logger');

async function validateProjectName(projectName) {
  if (!projectName) {
    logger.error('请提供项目名称');
    process.exit(1);
  }

  const projectPath = path.join(process.cwd(), projectName);
  
  if (await fs.exists(projectPath)) {
    logger.error(`目录 ${projectName} 已存在`);
    process.exit(1);
  }

  // 检查项目名称是否合法
  if (!/^[a-zA-Z][\w-]*$/.test(projectName)) {
    logger.error('项目名称必须以字母开头，且只能包含字母、数字、下划线和横线');
    process.exit(1);
  }

  return true;
}

module.exports = {
  validateProjectName
};