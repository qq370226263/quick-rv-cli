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
${isTS ? "import ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';" : ''}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

${isTS ? `import type { Configuration } from 'webpack';
import type { Configuration as DevServerConfiguration } from 'webpack-dev-server';

interface WebpackConfiguration extends Configuration {
  devServer?: DevServerConfiguration;
}

const config: WebpackConfiguration = {` : 'const config = {'}
  entry: './src/main.${isTS ? 'tsx' : 'jsx'}',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    publicPath: '/'
  },
  resolve: {
    extensions: ['.js', '.jsx'${isTS ? ", '.ts', '.tsx'" : ''}],
    extensionAlias: {
      '.js': ['.js', '.ts'],
      '.jsx': ['.jsx', '.tsx']
    },
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  module: {
    rules: [
      ${isTS ? `{
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: [
                ['@babel/preset-env', { targets: { node: 'current' } }],
                ${framework === 'react' ? "'@babel/preset-react'," : ''}
                '@babel/preset-typescript'
              ]
            }
          },
          {
            loader: 'ts-loader',
            options: {
              transpileOnly: true,
              compilerOptions: {
                module: 'ESNext'
              }
            }
          }
        ]
      },` : ''}
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env', { targets: { node: 'current' } }],
              ${framework === 'react' ? "'@babel/preset-react'," : ''}
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
    })${isTS ? `,
    new ForkTsCheckerWebpackPlugin({
      typescript: {
        diagnosticOptions: {
          semantic: true,
          syntactic: true,
        },
        mode: 'write-references',
      },
    })` : ''}
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
};

export default config;`;

  await fs.writeFile(
    path.join(projectName, `webpack.config.${configExt}`),
    configContent
  );

  if (isTS) {
    const tsNodeConfig = {
      compilerOptions: {
        module: "ESNext",
        moduleResolution: "node",
        allowJs: true,
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
        baseUrl: ".",
        paths: {
          "@/*": ["src/*"]
        }
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
      moduleResolution: "node",
      allowImportingTsExtensions: true,
      resolveJsonModule: true,
      isolatedModules: true,
      noEmit: true,
      strict: true,
      noUnusedLocals: true,
      noUnusedParameters: true,
      noFallthroughCasesInSwitch: true,
      jsx: framework === 'react' ? "react-jsx" : "preserve",
      esModuleInterop: true,
      allowSyntheticDefaultImports: true,
      forceConsistentCasingInFileNames: true,
      baseUrl: ".",
      paths: {
        "@/*": ["src/*"]
      }
    },
    include: ["src/**/*.ts", "src/**/*.tsx", "src/**/*.vue"],
    exclude: ["node_modules", "dist"]
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
        moduleResolution: "node",
        allowSyntheticDefaultImports: true,
        esModuleInterop: true
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
    ? "node --loader ts-node/esm ./node_modules/webpack/bin/webpack.js"
    : 'webpack';

  pkg.scripts = {
    ...pkg.scripts,
    dev: bundler === 'webpack' ? `${webpackCommand} serve --mode development` : 'vite',
    build: bundler === 'webpack' ? `${webpackCommand} --mode production` : 'vite build',
    preview: bundler === 'webpack' ? 'serve dist' : 'vite preview',
    typecheck: isTS ? 'tsc --noEmit' : ''
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
        '@babel/preset-typescript': '^7.22.5',
        '@types/node': '^20.0.0',
        'ts-loader': '^9.4.2',
        'fork-ts-checker-webpack-plugin': '^8.0.0'
      };
    }
  } else if (bundler === 'vite') {
    pkg.devDependencies = {
      ...pkg.devDependencies,
      'vite': '^4.4.0',
      '@vitejs/plugin-react': '^4.0.0',
      '@vitejs/plugin-vue': '^4.0.0',
      'terser': '^5.19.0'
    };

    if (isTS) {
      pkg.devDependencies = {
        ...pkg.devDependencies,
        'typescript': '^5.0.0',
        '@types/node': '^20.0.0'
      };
    }
  }

  await fs.writeJson(pkgPath, pkg, { spaces: 2 });
}

// generate Vite config
async function generateViteConfig(projectName, framework, isTS) {
  const viteConfig = `import { defineConfig } from 'vite'
import ${framework === 'react' ? 'react' : 'vue'} from '@vitejs/plugin-${framework === 'react' ? 'react' : 'vue'}'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [${framework === 'react' ? 'react()' : 'vue()'}],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\\/api/, '')
      }
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom'],
          'utils': ['lodash', 'axios']
        }
      }
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'vue', 'vue-router', 'axios']
  }
})`;

  await fs.writeFile(
    path.join(projectName, 'vite.config.ts'),
    viteConfig
  );
}

module.exports = {
  generateConfig
};