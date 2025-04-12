const execa = require('execa');
const logger = require('./logger');

async function checkNodeVersion() {
  const requiredVersion = '14.0.0';
  const currentVersion = process.version;
  
  if (compareVersions(currentVersion, requiredVersion) < 0) {
    logger.error(`Need Node.js ${requiredVersion} or higher`);
    process.exit(1);
  }
}

async function checkPackageManager() {
  try {
    await execa('npm', ['--version']);
  } catch (err) {
    logger.error('Please install npm first');
    process.exit(1);
  }
}

function compareVersions(v1, v2) {
  const v1Parts = v1.replace('v', '').split('.');
  const v2Parts = v2.split('.');
  
  for (let i = 0; i < 3; i++) {
    const num1 = parseInt(v1Parts[i]);
    const num2 = parseInt(v2Parts[i]);
    
    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }
  
  return 0;
}

module.exports = {
  checkNodeVersion,
  checkPackageManager
};