const fs = require('fs-extra');
const path = require('path');
const execa = require('execa');


async function generateTest(projectName, options) {
  const { framework, language, testing } = options;
  const ext = language === 'ts' ? 'tsx' : 'jsx';
  const testPath = path.join(process.cwd(), projectName, 'test');
  
  await fs.ensureDir(testPath);
  
  await fs.writeFile(
    path.join(testPath, `Demo.test.${ext}`),
    generateTestContent(framework, testing, language === 'ts', options)
  );

  // generate Jest config file
  if (testing === 'jest') {
    await generateJestConfig(projectName, framework, language === 'ts', options);
  }

  await updatePackageJsonForTest(projectName, testing, options);
}

function generateTestContent(framework, testing, isTS, options) {
  if (testing === 'jest') {
    return framework === 'react' ? generateReactJestTest(isTS, options) : generateVueJestTest(isTS, options);
  } else if (testing === 'mocha') {
    return framework === 'react' ? generateReactMochaTest(isTS, options) : generateVueMochaTest(isTS, options);
  } else {
    return '';
  }
}

async function generateJestConfig(projectName, framework, isTS, options) {
  // babel.config.js
  const babelConfig = `export default {
    presets: [
      ['@babel/preset-env', {
        targets: { node: 'current' },
        modules: false
      }],
      ${framework === 'react' ? "'@babel/preset-react'," : ''}
      ${isTS ? "'@babel/preset-typescript'" : ''}
    ]
  };`;

  const transformConfig = framework === 'react' 
  ? `'^.+\\.(js|jsx|ts|tsx)$': 'babel-jest'`
  : `'^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  '^.+\\.vue$': ${framework === 'vue3' ? "'@vue/vue3-jest'" : "'@vue/vue2-jest'"}`;

  // jest.config.js
  const configContent = `export default {
    testEnvironment: 'jsdom',
    extensionsToTreatAsEsm: ['.jsx', ${isTS ? "'.ts', '.tsx'" : ''}],
    moduleFileExtensions: ['js', 'jsx', ${isTS ? "'ts', 'tsx'," : ''} 'json'${framework.includes('vue') ? ", 'vue'" : ''}],
    transform: {
      ${transformConfig}
    },
    moduleNameMapper: {
      '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
    },
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js']
  };`;

  const setupContent = `import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

// 添加对 TextEncoder 和 TextDecoder 的全局支持
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder;
}
if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = TextDecoder;
}`;

  await Promise.all([
    fs.writeFile(path.join(projectName, 'babel.config.js'), babelConfig),
    fs.writeFile(path.join(projectName, 'jest.config.js'), configContent),
    fs.writeFile(path.join(projectName, 'jest.setup.js'), setupContent)
  ]);

  // add basic dependencies
  const devDependencies = [
    'jest',
    'babel-jest',
    '@babel/core',
    '@babel/preset-env',
    '@babel/preset-react',
    '@testing-library/react',
    '@testing-library/jest-dom',
    'identity-obj-proxy'
  ];

  // if using TypeScript, add related dependencies
  if (isTS) {
    devDependencies.push(
      '@babel/preset-typescript',
      '@types/jest'
    );
  }

  // add corresponding dependencies based on the state manager
  if (options?.stateManager) {
    switch(options.stateManager) {
      case 'redux':
        devDependencies.push('react-redux', '@reduxjs/toolkit');
        break;
      case 'zustand':
        devDependencies.push('zustand');
        break;
      case 'jotai':
        devDependencies.push('jotai');
        break;
      case 'mobx':
        devDependencies.push('mobx', 'mobx-react');
        break;
      case 'xstate':
        devDependencies.push('xstate', '@xstate/react');
        break;
    }
  }

  // install all dependencies
  await execa('npm', [
    'install',
    '-D',
    ...devDependencies
  ], { cwd: projectName });
}
function getStateManagerImports(options) {
  const { stateManager } = options;
  switch(stateManager) {
    case 'redux':
      return `import { Provider } from 'react-redux';
import { store, incrementStore } from '../src/store';`;
    case 'zustand':
      return `import { useStore } from '../src/store';`;
    case 'jotai':
      return `import { Provider } from 'jotai';
import { countState } from '../src/store';`;
    case 'mobx':
      return `import { Provider } from 'mobx-react';
import { counterStore } from '../src/store';`;
    default:
      return '';
  }
}

function getStateManagerWrapper(component, options) {
  const { stateManager } = options;
  switch(stateManager) {
    case 'redux':
      return `<Provider store={store}>
        ${component}
      </Provider>`;
    case 'zustand':
      return component;
    case 'jotai':
      return `<Provider>
        ${component}
      </Provider>`;
    case 'mobx':
      return `<Provider store={counterStore}>
        ${component}
      </Provider>`;
    default:
      return component;
  }
}

function generateReactJestTest(isTS, options) {
  const { stateManager } = options;
  let storeSetup = '';
  
  // add different store setup for different state managers
  if (stateManager === 'zustand') {
    storeSetup = `
  beforeEach(() => {
    useStore.setState({ count: 0 });
  });`;
  }

  return `import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
${getStateManagerImports(options)}
import Demo from '../src/pages/Demo';
${isTS ? "import '@testing-library/jest-dom';" : ''}

describe('Demo Page', () => {${storeSetup}

  test('renders demo page', () => {
    render(
      ${wrapWithRouter(getStateManagerWrapper('<Demo />', options))}
    );
    expect(screen.getByText('Demo Page')).toBeInTheDocument();
  });

  test('increments counter when button is clicked', () => {
    render(
      ${wrapWithRouter(getStateManagerWrapper('<Demo />', options))}
    );
    const button = screen.getByText('Increment Count');
    fireEvent.click(button);
    expect(screen.getByText('Current count: 1')).toBeInTheDocument();
  });
});`;
}

function wrapWithRouter(component) {
  return `<BrowserRouter>
      ${component}
    </BrowserRouter>`;
}

function generateReactMochaTest(isTS, options) {
  return `import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import Demo from '../src/pages/Demo';
${isTS ? "import '@testing-library/jest-dom';" : ''}

describe('Demo Page', () => {
  it('renders demo page', () => {
    render(<Demo />);
    expect(screen.getByText('Demo Page')).toBeInTheDocument();
  });
});`;
}

function generateVueJestTest(isTS) {
  return `import { mount } from '@vue/test-utils';
import Demo from '../src/pages/Demo';
${isTS ? "import '@testing-library/jest-dom';" : ''}

describe('Demo Page', () => {
  it('renders demo page', () => {
    const wrapper = mount(Demo);
  });
});`;
}

function generateVueMochaTest(isTS) {
  return `import { mount } from '@vue/test-utils';
import Demo from '../src/pages/Demo';
${isTS ? "import '@testing-library/jest-dom';" : ''}

describe('Demo Page', () => {
  it('renders demo page', () => {
    const wrapper = mount(Demo);
  });
});`;
}

async function updatePackageJsonForTest(projectName, testing, options) {
  const pkgPath = path.join(projectName, 'package.json');
  const pkg = await fs.readJson(pkgPath);

  if (options.testing === 'jest') {
    pkg.scripts = {
      ...pkg.scripts,
      test: 'node --experimental-vm-modules node_modules/jest/bin/jest.js'
    };
    
    // all projects use ESM
    pkg.type = 'module';
  }

  await fs.writeJson(pkgPath, pkg, { spaces: 2 });
}

function getTestCommand(testing) {
  switch (testing) {
    case 'jest':
      return 'jest';
    case 'mocha':
      return 'mocha';
    case 'cypress':
      return 'cypress open';
    default:
      return 'echo "No test specified"';
  }
}

module.exports = {
  generateTest
};