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
  
  // create basic CSS file
  const indexCss = `body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

code {
  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New', monospace;
}`;

  await fs.writeFile(
    path.join(srcPath, 'index.css'),
    indexCss
  );
  
  // create an empty App.css file
  await fs.writeFile(
    path.join(srcPath, `App.css`),
    `/* App styles */`
  );
  
  // create a simple App component
  const appContent = framework === 'react' ? 
    `import React from 'react';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Welcome to ${projectName}</h1>
        <p>
          Edit <code>src/App.${ext}</code> and save to reload.
        </p>
      </header>
    </div>
  );
}

export default App;` :
    `<template>
  <div class="App">
    <header class="App-header">
      <h1>Welcome to ${projectName}</h1>
      <p>
        Edit <code>src/App.vue</code> and save to reload.
      </p>
    </header>
  </div>
</template>

<script>
export default {
  name: 'App'
}
</script>

<style>
.App {
  text-align: center;
  margin-top: 60px;
}
</style>`;

  await fs.writeFile(
    path.join(srcPath, `App.${framework === 'react' ? ext : 'vue'}`),
    appContent
  );
  
  // create entry file
  const mainContent = framework === 'react' ?
    `import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);` :
    `import { ${framework === 'vue3' ? 'createApp' : 'Vue'} } from 'vue';
import App from './App.vue';

${framework === 'vue3' ?
  "createApp(App).mount('#app');" :
  `new Vue({
  render: h => h(App),
}).$mount('#app');`}`;

  await fs.writeFile(
    path.join(srcPath, `main.${ext}`),
    mainContent
  );
  
  // create .gitignore
  const gitignore = `# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

node_modules
dist
dist-ssr
*.local

# Editor directories and files
.vscode/*
!.vscode/extensions.json
.idea
.DS_Store
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?`;

  await fs.writeFile(
    path.join(projectName, '.gitignore'),
    gitignore
  );
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
      stdio: ['ignore', 'ignore', 'inherit'] // only inherit stderr, for displaying errors
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
    jotai: 'jotai',
    xstate: 'xstate@^5.0.0 @xstate/react@^5.0.0',
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