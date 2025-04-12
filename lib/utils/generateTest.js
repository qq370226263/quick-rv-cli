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
    generateTestContent(framework, testing, language === 'ts')
  );

  // 生成 Jest 配置文件
  if (testing === 'jest') {
    await generateJestConfig(projectName, framework, language === 'ts');
  }

  await updatePackageJsonForTest(projectName, testing);
}

function generateTestContent(framework, testing, isTS) {
  if (testing === 'jest') {
    return framework === 'react' ? generateReactJestTest(isTS) : generateVueJestTest(isTS);
  } else if (testing === 'mocha') {
    return framework === 'react' ? generateReactMochaTest(isTS) : generateVueMochaTest(isTS);
  } else {
    return '';
  }
}

async function generateJestConfig(projectName, framework, isTS) {
  // babel.config.js
  const babelConfig = `module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    ${framework === 'react' ? "'@babel/preset-react'," : ''}
    ${isTS ? "'@babel/preset-typescript'" : ''}
  ],
};`;

  // jest.config.js
  const configContent = `module.exports = {
  testEnvironment: 'jsdom',
  moduleFileExtensions: ['js', 'jsx', ${isTS ? "'ts', 'tsx'," : ''} 'json'],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', {
      presets: [
        ['@babel/preset-env', { targets: { node: 'current' } }],
        ${framework === 'react' ? "'@babel/preset-react'," : ''}
        ${isTS ? "'@babel/preset-typescript'" : ''}
      ],
    }],
  },
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js']
};`;

  const setupContent = `import '@testing-library/jest-dom';`;

  await Promise.all([
    fs.writeFile(path.join(projectName, 'babel.config.js'), babelConfig),
    fs.writeFile(path.join(projectName, 'jest.config.js'), configContent),
    fs.writeFile(path.join(projectName, 'jest.setup.js'), setupContent)
  ]);

  // 添加必要的开发依赖
  await execa('npm', [
    'install',
    '-D',
    'jest',
    'babel-jest',
    '@babel/core',
    '@babel/preset-env',
    '@babel/preset-react',
    '@testing-library/react',
    '@testing-library/jest-dom',
    'identity-obj-proxy'
  ], { cwd: projectName });
}

function generateReactJestTest(isTS) {
  return `import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import Demo from '../src/pages/Demo';
${isTS ? "import '@testing-library/jest-dom';" : ''}

describe('Demo Page', () => {
  test('renders demo page', () => {
    render(<Demo />);
    expect(screen.getByText('Demo Page')).toBeInTheDocument();
  });

  test('increments counter when button is clicked', () => {
    render(<Demo />);
    const button = screen.getByText('Increment');
    fireEvent.click(button);
    expect(screen.getByText('Count: 1')).toBeInTheDocument();
  });
});`;
}

function generateReactMochaTest(isTS) {
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

async function updatePackageJsonForTest(projectName, testing) {
  const pkgPath = path.join(projectName, 'package.json');
  const pkg = await fs.readJson(pkgPath);

  pkg.scripts = {
    ...pkg.scripts,
    test: getTestCommand(testing)
  };

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