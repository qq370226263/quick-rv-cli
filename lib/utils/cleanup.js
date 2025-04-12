const fs = require('fs-extra');
const path = require('path');
const logger = require('./logger');

async function cleanup(projectPath) {
  try {
    await fs.remove(projectPath);
    logger.info(`Cleaned up ${projectPath}`);
  } catch (err) {
    logger.warning(`Failed to clean up ${projectPath}`);
  }
}

module.exports = {
  cleanup
};