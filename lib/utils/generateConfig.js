const fs = require('fs-extra');
const path = require('path');
const { fileURLToPath } = require('url');

async function generateConfig(projectName, options) {
  const { framework, language, bundler } = options;
  const isTS = language === 'ts';

  // generate corresponding config based on bundler
  if (bundler === 'webpack') {
    // generate HTML template
    await generateHtmlTemplate(projectName, framework);
    // generate webpack config
    await generateWebpackConfig(projectName, framework, isTS);
    
  } else if (bundler === 'vite') {
    // generate vite config
    await generateViteConfig(projectName, framework, isTS);
  }

  if (isTS) {
    await generateTSConfig(projectName, framework, bundler);
  }

  await updatePackageJson(projectName, bundler, isTS);
}

// generate HTML template
async function generateHtmlTemplate(projectName, framework) {
  const htmlContent = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${framework === 'react' ? 'React' : 'Vue'} App</title>
  </head>
  <body>
    <div id="${framework === 'react' ? 'root' : 'app'}"></div>
    <!-- webpack will inject bundle here -->
  </body>
</html>
`;

  await fs.writeFile(
    path.join(projectName, 'index.html'),
    htmlContent
  );
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
    publicPath: '/'
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
    static: [
      {
        directory: path.join(__dirname, 'public')
      },
      {
        directory: path.join(__dirname, 'src')
      }
    ],
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

async function generateTSConfig(projectName, framework, bundler) {
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
    include: ["src/**/*.ts", "src/**/*.tsx", "src/**/*.vue"]
  };

  // only add reference to tsconfig.node.json when using Vite
  if (bundler === 'vite') {
    tsConfig.references = [{ path: "./tsconfig.node.json" }];
    
    // create tsconfig.node.json file at the same time
    const tsNodeConfig = {
      compilerOptions: {
        composite: true,
        skipLibCheck: true,
        module: "ESNext",
        moduleResolution: "bundler",
        allowSyntheticDefaultImports: true
      },
      include: ["vite.config.ts"]
    };
    
    await fs.writeFile(
      path.join(projectName, 'tsconfig.node.json'),
      JSON.stringify(tsNodeConfig, null, 2)
    );
  }

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

// generate Vite config
async function generateViteConfig(projectName, framework, isTS) {
  const viteConfig = `import { defineConfig } from 'vite'
import ${framework === 'react' ? 'react' : 'vue'} from '@vitejs/plugin-${framework === 'react' ? 'react' : 'vue'}'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [${framework === 'react' ? 'react()' : 'vue()'}],
})
`;

  await fs.writeFile(
    path.join(projectName, 'vite.config.ts'),
    viteConfig
  );
}

module.exports = {
  generateConfig
};