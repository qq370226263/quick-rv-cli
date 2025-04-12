const fs = require('fs-extra');
const path = require('path');

async function generateConfig(projectName, options) {
  const { framework, language, bundler } = options;
  const isTS = language === 'ts';

  if (bundler === 'webpack') {
    await generateWebpackConfig(projectName, framework, isTS);
  }

  if (isTS) {
    await generateTSConfig(projectName, framework);
  }

  await updatePackageJson(projectName, bundler);
}

async function generateWebpackConfig(projectName, framework, isTS) {
  const configContent = `const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
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
        exclude: /node_modules/,
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
      template: './index.html'
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
};`;

  await fs.writeFile(
    path.join(projectName, `webpack.config.${isTS ? 'ts' : 'js'}`),
    configContent
  );
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

async function updatePackageJson(projectName, bundler) {
  const pkgPath = path.join(projectName, 'package.json');
  const pkg = await fs.readJson(pkgPath);

  pkg.scripts = {
    ...pkg.scripts,
    dev: bundler === 'webpack' ? 'webpack serve --mode development' : 'vite',
    build: bundler === 'webpack' ? 'webpack --mode production' : 'vite build',
    preview: bundler === 'webpack' ? 'serve dist' : 'vite preview'
  };

  await fs.writeJson(pkgPath, pkg, { spaces: 2 });
}

module.exports = {
  generateConfig
};