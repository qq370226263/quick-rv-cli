const fs = require('fs-extra');
const path = require('path');
const { fileURLToPath } = require('url');

async function generateConfig(projectName, options) {
  const { framework, language, bundler } = options;
  const isTS = language === 'ts';

  if (bundler === 'webpack') {
    await generateWebpackConfig(projectName, framework, isTS);
  }

  if (isTS) {
    await generateTSConfig(projectName, framework);
  }

  await updatePackageJson(projectName, bundler, isTS);
}

async function generateWebpackConfig(projectName, framework, isTS) {
  const configExt = isTS ? 'ts' : 'mjs';
  
  const configContent = `import path from 'path';
import { fileURLToPath } from 'url';
import HtmlWebpackPlugin from 'html-webpack-plugin';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

${isTS ? `import type { Configuration } from 'webpack';
import type { Configuration as DevServerConfiguration } from 'webpack-dev-server';

interface WebpackConfiguration extends Configuration {
  devServer?: DevServerConfiguration;
}` : ''}

${isTS ? 'const config: WebpackConfiguration = {' : 'export default {'}
  entry: './src/main.${isTS ? 'tsx' : 'jsx'}',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
  },
  resolve: {
    extensions: ['.js', '.jsx'${isTS ? ", '.ts', '.tsx'" : ''}],
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)${isTS ? '|ts|tsx' : ''}$/,
        exclude: [/node_modules/, /\.html$/],
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              '@babel/preset-env',
              ${framework === 'react' ? "'@babel/preset-react'," : ''}
              ${isTS ? "'@babel/preset-typescript'" : ''}
            ]
          }
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './index.html',
      inject: true
    })
  ],
  devServer: {
    static: {
      directory: path.join(__dirname, 'public')
    },
    port: 3000,
    hot: true,
    historyApiFallback: true
  }
}${isTS ? ';\n\nexport default config;' : ''};`;

  await fs.writeFile(
    path.join(projectName, `webpack.config.${configExt}`),
    configContent
  );

  if (isTS) {
    const tsNodeConfig = {
      compilerOptions: {
        module: "ESNext",
        moduleResolution: "node"
      }
    };

    await fs.writeFile(
      path.join(projectName, 'tsconfig.webpack.json'),
      JSON.stringify(tsNodeConfig, null, 2)
    );
  }
}

async function generateTSConfig(projectName, framework) {
  const tsConfig = {
    compilerOptions: {
      target: "ES2020",
      useDefineForClassFields: true,
      lib: ["ES2020", "DOM", "DOM.Iterable"],
      module: "ESNext",
      skipLibCheck: true,
      moduleResolution: "bundler",
      allowImportingTsExtensions: true,
      resolveJsonModule: true,
      isolatedModules: true,
      noEmit: true,
      strict: true,
      noUnusedLocals: true,
      noUnusedParameters: true,
      noFallthroughCasesInSwitch: true,
      jsx: framework === 'react' ? "react-jsx" : "preserve",
    },
    include: ["src/**/*.ts", "src/**/*.tsx", "src/**/*.vue"],
    references: [{ path: "./tsconfig.node.json" }]
  };

  await fs.writeFile(
    path.join(projectName, 'tsconfig.json'),
    JSON.stringify(tsConfig, null, 2)
  );
}

async function updatePackageJson(projectName, bundler, isTS) {
  const pkgPath = path.join(projectName, 'package.json');
  const pkg = await fs.readJson(pkgPath);

  pkg.type = 'module';

  const webpackCommand = isTS 
    ? "node --import 'data:text/javascript,import { register } from \"node:module\"; import { pathToFileURL } from \"node:url\"; register(\"ts-node/esm\", pathToFileURL(\"./\"));' ./node_modules/webpack/bin/webpack.js"
    : 'webpack';

  pkg.scripts = {
    ...pkg.scripts,
    dev: bundler === 'webpack' ? `${webpackCommand} serve --mode development` : 'vite',
    build: bundler === 'webpack' ? `${webpackCommand} --mode production` : 'vite build',
    preview: bundler === 'webpack' ? 'serve dist' : 'vite preview'
  };

  if (bundler === 'webpack') {
    pkg.devDependencies = {
      ...pkg.devDependencies,
      'webpack': '^5.88.0',
      'webpack-cli': '^5.1.4',
      'webpack-dev-server': '^4.15.1',
      'html-webpack-plugin': '^5.5.3',
      'style-loader': '^3.3.3',
      'css-loader': '^6.8.1',
      'babel-loader': '^9.1.3',
      '@babel/core': '^7.22.5',
      '@babel/preset-env': '^7.22.5',
      '@babel/preset-react': '^7.22.5',
      'cross-env': '^7.0.3'
    };

    if (isTS) {
      pkg.devDependencies = {
        ...pkg.devDependencies,
        'ts-node': '^10.9.1',
        'typescript': '^5.0.0',
        '@types/webpack': '^5.28.1',
        '@babel/preset-typescript': '^7.22.5'
      };
    }
  }

  await fs.writeJson(pkgPath, pkg, { spaces: 2 });
}

module.exports = {
  generateConfig
};