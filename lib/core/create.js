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


async function createProject(projectName, options) {
  const projectPath = path.join(process.cwd(), projectName);

  
  try {
    await checkNodeVersion();
    await checkPackageManager();

    // create project directory
    spinner.start('Creating project structure...');
    await fs.ensureDir(projectName);
    await createViteProject(projectName, options);
    spinner.succeed('Project structure created');
    
    // install extra dependencies
    spinner.start('Installing dependencies...');
    await installDependencies(projectName, options);
    spinner.succeed('Dependencies installed');
    
    // generate config file
    spinner.start('Generating project files...');
    await generatePages(projectName, options);
    await generateConfig(projectName, options);
    
    // if state manager is selected, generate store
    if (options.stateManager !== 'none') {
      await generateStore(projectName, options);
    }
    
    // if testing tool is selected, generate test file
    if (options.testing !== 'none') {
      await generateTest(projectName, options);
    }
    spinner.succeed('Project files generated');

    logger.success(`
      Project ${projectName} created successfully!
      
      Next Steps:
      
        cd ${projectName}
        npm run dev
          `);
  } catch (error) {
    spinner.fail('Failed to create project');
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
  }

  await execa('npm', [
    'create',
    'vite@latest',
    projectName,
    '--',
    '--template',
    template
  ]);

  await new Promise(resolve => setTimeout(resolve, 1000));

}

async function installDependencies(projectName, options) {
  const { framework } = options;
  const dependencies = ['axios'];
  
  // add router
  if (framework === 'react') {
    dependencies.push('react-router-dom');
  } else {
    dependencies.push('vue-router');
  }
  
  // add state manager
  if (options.stateManager !== 'none') {
    const statePackages = getStateManagerPackage(options.stateManager).split(' ');
    dependencies.push(...statePackages);  
  } else if (framework === 'vue2') {
    dependencies.push('vuex'); 
  }
  
  // add testing tool
  if (options.testing !== 'none') {
    dependencies.push(...getTestingPackages(options.testing));
  }
  
  // if webpack is selected, add webpack related dependencies
  if (options.bundler === 'webpack') {
    dependencies.push(
      'webpack',
      'webpack-cli',
      'webpack-dev-server',
      'html-webpack-plugin',
      'babel-loader',
      '@babel/core',
      '@babel/preset-env'
    );
    
    if (framework === 'react') {
      dependencies.push('@babel/preset-react');
    }
    
    if (options.language === 'ts') {
      dependencies.push('typescript', 'ts-loader', '@types/node');
    }
  }

  if (options.testing === 'jest') {
    const devDependencies = [
      'jest',
      'babel-jest',
      '@babel/core',
      '@babel/preset-env',
      '@testing-library/jest-dom',
      'identity-obj-proxy',
      'jest-environment-jsdom'
    ];

    if (framework === 'react') {
      devDependencies.push(
        '@babel/preset-react',
        '@testing-library/react'
      );
    } else if (framework === 'vue2') {
      devDependencies.push(
        '@vue/vue2-jest',
        '@vue/test-utils@1'
      );
    } else if (framework === 'vue3') {
      devDependencies.push(
        '@vue/vue3-jest',
        '@vue/test-utils'
      );
    }

    await execa('npm', ['install', '-D', ...devDependencies], { 
      cwd: projectName,
      stdio: ['ignore', 'ignore', 'inherit']
    });
  }

  try {
    await execa('npm', ['install', ...dependencies], { 
      cwd: projectName,
      stdio: ['ignore', 'ignore', 'inherit'] // 只继承 stderr，用于显示错误
    });
  } catch (error) {
    throw new Error(`Failed to install dependencies: ${error.message}`);
  }
}

function getStateManagerPackage(manager) {
  const packages = {
    redux: '@reduxjs/toolkit react-redux',
    mobx: 'mobx mobx-react-lite',
    zustand: 'zustand',
    recoil: 'recoil',
    jotai: 'jotai',
    xstate: 'xstate @xstate/react',
    pinia: 'pinia',
    vuex: 'vuex'
  };
  return packages[manager];
}

function getTestingPackages(testing) {
  const packages = {
    jest: ['jest', '@testing-library/jest-dom'],
    mocha: ['mocha', 'chai'],
  };
  return packages[testing];
}

module.exports = {
  createProject
};