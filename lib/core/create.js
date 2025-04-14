const path = require('path');
const fs = require('fs-extra');
const execa = require('execa');
const logger = require('../utils/logger');
const spinner = require('../utils/spinner');
const { cleanup } = require('../utils/cleanup');
const { generateStore } = require('../utils/generateStore');
const { generateConfig } = require('../utils/generateConfig');
const { generateTest } = require('../utils/generateTest');
const { generatePages } = require('../utils/generatePages');
const { checkNodeVersion, checkPackageManager } = require('../utils/checkDependencies');
const { getTemplateFiles } = require('./template');

async function createProject(projectName, options) {
  const projectPath = path.join(process.cwd(), projectName);

  try {
    // start the overall project creation spinner
    spinner.start('Creating project...');
    
    await checkNodeVersion();
    await checkPackageManager();

    // create project directory
    spinner.start('Creating project structure...');
    await fs.ensureDir(projectName);
    
    // choose the way to create project based on the bundler
    if (options.bundler === 'vite') {
      await createViteProject(projectName, options);
    } else if (options.bundler === 'webpack') {
      await createWebpackProject(projectName, options);
    }
    
    spinner.succeed('Project structure created');
    
    // install extra dependencies
    spinner.start('Installing dependencies...');
    await installDependencies(projectName, options);
    spinner.succeed('Dependencies installed');
    
    // generate config files
    spinner.start('Generating project files...');
    await generatePages(projectName, options);
    await generateConfig(projectName, options);
    
    // if state manager is selected, generate store
    if (options.stateManager !== 'none') {
      await generateStore(projectName, options);
    }
    
    // if testing tool is selected, generate test files
    if (options.testing !== 'none') {
      await generateTest(projectName, options);
    }
    spinner.succeed('Project files generated');

    // the final overall completion message
    spinner.succeed(`Project ${projectName} created successfully!`);

    // ensure no active spinner
    spinner.stop();
  } catch (error) {
    // ensure the spinner stops in case of error
    spinner.fail('Failed to create project');
    spinner.stop();
    logger.error(error.message);
    await cleanup(projectPath);
    process.exit(1);
  }
}

async function createViteProject(projectName, options) {
  const { framework, language } = options;
  let template;

  switch (framework) {
    case 'react':
      template = language === 'ts' ? 'react-ts' : 'react';
      break;
    case 'vue3':
      template = language === 'ts' ? 'vue-ts' : 'vue';
      break;
    case 'vue2':
      template = 'vue';
      break;
    default:
      throw new Error(`Unsupported framework: ${framework}`);
  }

  try {
    // run the vite create command
    await execa('npm', [
      'create',
      'vite@latest',
      projectName,
      '--',
      '--template',
      template
    ]);
    
    // wait for file system operations to complete
    await new Promise(resolve => setTimeout(resolve, 1000));
  } catch (error) {
    // 抛出更有意义的错误消息
    throw new Error(`Failed to create Vite project: ${error.message}`);
  }
}

async function createWebpackProject(projectName, options) {
  const { framework, language } = options;
  const ext = language === 'ts' ? 'tsx' : 'jsx';
  const srcPath = path.join(process.cwd(), projectName, 'src');
  const publicPath = path.join(process.cwd(), projectName, 'public');
  
  // create basic directory structure
  await fs.ensureDir(srcPath);
  await fs.ensureDir(publicPath);
  await fs.ensureDir(path.join(srcPath, 'pages'));
  await fs.ensureDir(path.join(srcPath, 'assets'));
  await fs.ensureDir(path.join(srcPath, 'store'));
  await fs.ensureDir(path.join(srcPath, 'router'));
  
  // create package.json
  const packageJson = {
    name: projectName,
    version: '0.1.0',
    private: true,
    type: 'module',
    scripts: {
      "dev": "echo 'Development server will be configured later'",
      "build": "echo 'Build script will be configured later'",
      "test": "echo 'Test script will be configured later'"
    }
  };
  
  await fs.writeFile(
    path.join(projectName, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );
  // 使用 template.js 中的模板文件
  const templateFiles = getTemplateFiles(framework, 'webpack', language, options.stateManager);
  for (const file of templateFiles) {
    const filePath = path.join(projectName, file.path);
    const dirPath = path.dirname(filePath);
    await fs.ensureDir(dirPath);
    await fs.writeFile(filePath, file.content);
  }
}

async function installDependencies(projectName, options) {
  const { framework, language, stateManager, testing } = options;
  const projectPath = path.join(process.cwd(), projectName);
  
  // get all required dependencies
  const coreDeps = getCoreDependencies(framework, language);
  const stateManagerDeps = getStateManagerPackage(stateManager, framework);
  const testingDeps = getTestingPackages(testing, framework);
  
  // combine all dependencies
  const dependencies = [...coreDeps, ...stateManagerDeps, ...testingDeps];
  
  // install dependencies
  try {
    await execa('npm', ['install', ...dependencies], { cwd: projectPath });
  } catch (error) {
    throw new Error(`Failed to install dependencies: ${error.message}`);
  }
}

function getCoreDependencies(framework, language) {
  const deps = [];
  
  // add framework specific dependencies
  if (framework === 'react') {
    deps.push('react', 'react-dom', 'react-router-dom');
    if (language === 'ts') {
      deps.push('@types/react', '@types/react-dom', '@types/react-router-dom');
    }
  } else if (framework === 'vue3') {
    deps.push('vue@3');
    if (language === 'ts') {
      deps.push('@vue/runtime-core');
    }
  }
  
  // add webpack dependencies
  deps.push(
    'webpack',
    'webpack-cli',
    'webpack-dev-server',
    'html-webpack-plugin',
    'css-loader',
    'style-loader',
    'babel-loader',
    '@babel/core',
    '@babel/preset-env'
  );
  
  if (framework === 'react') {
    deps.push('@babel/preset-react');
  }
  
  if (language === 'ts') {
    deps.push('typescript', '@babel/preset-typescript', 'ts-loader');
  }
  
  return deps;
}

function getStateManagerPackage(manager, framework) {
  const deps = [];
  
  switch (manager) {
    case 'redux':
      deps.push('@reduxjs/toolkit', 'react-redux');
      break;
    case 'mobx':
      deps.push('mobx', 'mobx-react');
      break;
    case 'zustand':
      deps.push('zustand');
      break;
    case 'jotai':
      deps.push('jotai');
      break;
    case 'xstate':
      deps.push('xstate', '@xstate/react');
      break;
    case 'pinia':
      deps.push('pinia');
      break;
    case 'vuex':
      deps.push('vuex@4');
      break;
  }
  
  return deps;
}

function getTestingPackages(testing, framework) {
  const deps = [];
  
  if (testing === 'jest') {
    deps.push('jest', 'jest-environment-jsdom', 'babel-jest', 'identity-obj-proxy');
    
    if (framework === 'react') {
      deps.push('@testing-library/react', '@testing-library/user-event', '@testing-library/jest-dom');
    } else {
      deps.push('@testing-library/vue');
    }
  }
  
  return deps;
}

module.exports = {
  createProject
};