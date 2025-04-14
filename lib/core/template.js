function getTemplateFiles(framework, bundler, language, stateManager) {
  const baseFiles = [
    {
      path: '.gitignore',
      content: `node_modules
dist
.DS_Store
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
npm-debug.log*
yarn-debug.log*
yarn-error.log*
`
    },
    {
      path: '.babelrc',
      content: JSON.stringify({
        presets: [
          '@babel/preset-env',
          framework === 'react' ? '@babel/preset-react' : null,
          language === 'ts' ? '@babel/preset-typescript' : null
        ].filter(Boolean)
      }, null, 2)
    },
    {
      path: '.eslintrc.js',
      content: `module.exports = {
  root: true,
  env: {
    node: true,
    browser: true,
    es2021: true
  },
  extends: [
    'eslint:recommended',
    ${framework === 'react' ? "'plugin:react/recommended'," : "'plugin:vue/vue3-recommended',"}
    ${language === 'ts' ? "'plugin:@typescript-eslint/recommended'," : ''}
  ],
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
    ${framework === 'react' ? "jsx: true," : ''}
    ${language === 'ts' ? "parser: '@typescript-eslint/parser'," : ''}
  },
  plugins: [
    ${framework === 'react' ? "'react'," : "'vue',"}
    ${language === 'ts' ? "'@typescript-eslint'," : ''}
  ],
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off'
  }
};`
    },
    {
      path: 'README.md',
      content: `# ${framework === 'react' ? 'React' : 'Vue 3'} Project

This project was created using quick-rv-cli.

## Available Scripts

In the project directory, you can run:

### \`npm start\`

Runs the app in development mode.

### \`npm run build\`

Builds the app for production.

### \`npm test\`

Launches the test runner.

## Learn More

To learn more about ${framework === 'react' ? 'React' : 'Vue 3'}, check out the [documentation](${framework === 'react' ? 'https://reactjs.org' : 'https://v3.vuejs.org'}).`
    }
  ];

  if (language === 'ts') {
    baseFiles.push({
      path: 'tsconfig.json',
      content: JSON.stringify({
        "compilerOptions": {
          "target": "ES2020",
          "useDefineForClassFields": true,
          "lib": ["ES2020", "DOM", "DOM.Iterable"],
          "module": "ESNext",
          "skipLibCheck": true,
          "moduleResolution": "bundler",
          "allowImportingTsExtensions": true,
          "resolveJsonModule": true,
          "isolatedModules": true,
          "noEmit": true,
          "jsx": "react-jsx",
          "strict": true,
          "noUnusedLocals": true,
          "noUnusedParameters": true,
          "noFallthroughCasesInSwitch": true,
          "allowJs": true,
          "esModuleInterop": true,
          "allowSyntheticDefaultImports": true,
          "forceConsistentCasingInFileNames": true
        },
        "include": ["src"],
        "references": [{ "path": "./tsconfig.node.json" }]
      }, null, 2)
    });

    baseFiles.push({
      path: 'tsconfig.node.json',
      content: JSON.stringify({
        "compilerOptions": {
          "composite": true,
          "skipLibCheck": true,
          "module": "ESNext",
          "moduleResolution": "bundler",
          "allowSyntheticDefaultImports": true
        },
        "include": ["vite.config.ts"]
      }, null, 2)
    });

    baseFiles.push({
      path: 'src/vite-env.d.ts',
      content: `/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}`
    });
  }

  const frameworkFiles = framework === 'react' ? getReactFiles(language, stateManager) : getVue3Files(language, stateManager);
  const bundlerFiles = bundler === 'webpack' ? getWebpackFiles(framework, language) : getViteFiles(framework, language);

  return [...baseFiles, ...frameworkFiles, ...bundlerFiles];
}

function getReactFiles(language, stateManager) {
  const files = [
    {
      path: 'src/main.' + (language === 'ts' ? 'tsx' : 'jsx'),
      content: `import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
${stateManager === 'xstate' ? "import { counterActor } from './store';" : ''}

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');
const root = createRoot(rootElement);

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);`
    },
    {
      path: 'src/App.' + (language === 'ts' ? 'tsx' : 'jsx'),
      content: `import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Demo from './pages/Demo';
${getStateProviderImports(stateManager)}

function App() {
  return (
    ${getStateProviderWrapper(stateManager, 'start')}
    <div className="App">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/demo" element={<Demo />} />
      </Routes>
    </div>
    ${getStateProviderWrapper(stateManager, 'end')}
  );
}

export default App;`
    },
    {
      path: 'src/index.css',
      content: `body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.App {
  text-align: center;
}`
    }
  ];

  if (stateManager !== 'none') {
    files.push({
      path: 'src/store/index.' + (language === 'ts' ? 'ts' : 'js'),
      content: getReactStateManagerContent(stateManager, language)
    });
  }

  return files;
}

// 获取状态管理器的导入语句
function getStateProviderImports(stateManager) {
  switch (stateManager) {
    case 'redux':
      return "import { Provider } from 'react-redux';\nimport { store } from './store';";
    case 'jotai':
      return "import { Provider } from 'jotai';";
    case 'mobx':
      return '';
    case 'zustand':
      return '';
    case 'xstate':
      return '';
    default:
      return '';
  }
}

// 获取状态管理器的包装组件
function getStateProviderWrapper(stateManager, position) {
  if (position === 'start') {
    switch (stateManager) {
      case 'redux':
        return '<Provider store={store}>';
      case 'jotai':
        return '<Provider>';
      default:
        return '';
    }
  } else {
    switch (stateManager) {
      case 'redux':
      case 'jotai':
        return '</Provider>';
      default:
        return '';
    }
  }
}

function getVue3Files(language, stateManager) {
  const files = [
    {
      path: 'src/main.' + (language === 'ts' ? 'ts' : 'js'),
      content: `import { createApp } from 'vue';
import App from './App.vue';
import './index.css';

createApp(App).mount('#app');`
    },
    {
      path: 'src/App.vue',
      content: `<template>
  <div class="app">
    <header class="app-header">
      <h1>Welcome to Vue 3</h1>
    </header>
  </div>
</template>

<script ${language === 'ts' ? 'lang="ts"' : ''}>
export default {
  name: 'App'
};
</script>

<style>
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.app {
  text-align: center;
}

.app-header {
  background-color: #282c34;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: calc(10px + 2vmin);
  color: white;
}
</style>`
    }
  ];

  if (stateManager !== 'none') {
    files.push({
      path: 'src/store/index.' + (language === 'ts' ? 'ts' : 'js'),
      content: getVue3StateManagerContent(stateManager, language)
    });
  }

  return files;
}

function getWebpackFiles(framework, language) {
  return [
    {
      path: 'webpack.config.' + (language === 'ts' ? 'ts' : 'js'),
      content: `const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './src/main.${framework === 'react' ? (language === 'ts' ? 'tsx' : 'jsx') : (language === 'ts' ? 'ts' : 'js')}',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js'
  },
  module: {
    rules: [
      {
        test: /\.${framework === 'react' ? (language === 'ts' ? 'tsx' : 'jsx') : (language === 'ts' ? 'ts' : 'js')}$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader'
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
      template: './public/index.html'
    })
  ],
  resolve: {
    extensions: ['.${framework === 'react' ? (language === 'ts' ? 'tsx' : 'jsx') : (language === 'ts' ? 'ts' : 'js')}', '.js', '.json']
  }
};`
    }
  ];
}

function getViteFiles(framework, language) {
  return [
    {
      path: 'vite.config.' + (language === 'ts' ? 'ts' : 'js'),
      content: `import { defineConfig } from 'vite';
import ${framework === 'react' ? 'react' : 'vue'} from '@vitejs/plugin-${framework === 'react' ? 'react' : 'vue'}';

export default defineConfig({
  plugins: [${framework === 'react' ? 'react()' : 'vue()'}],
  server: {
    port: 3000
  }
});`
    }
  ];
}

function getReactStateManagerContent(manager, language) {
  switch (manager) {
    case 'redux':
      return `import { configureStore } from '@reduxjs/toolkit';
import counterReducer from './counterSlice';

export const store = configureStore({
  reducer: {
    counter: counterReducer
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;`;
    case 'mobx':
      return `import { makeAutoObservable } from 'mobx';

class CounterStore {
  count = 0;

  constructor() {
    makeAutoObservable(this);
  }

  increment() {
    this.count++;
  }
}

export const counterStore = new CounterStore();`;
    case 'zustand':
      return `import { create } from 'zustand';

interface CounterState {
  count: number;
  increment: () => void;
}

export const useStore = create<CounterState>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 }))
}));`;
    case 'jotai':
      return `import { atom } from 'jotai';

export const countState = atom(0);`;
    case 'xstate':
      return `import { createMachine } from 'xstate';

export const counterMachine = createMachine({
  id: 'counter',
  initial: 'active',
  context: {
    count: 0
  },
  states: {
    active: {
      on: {
        INCREMENT: {
          actions: (context) => {
            context.count++;
          }
        }
      }
    }
  }
});`;
    default:
      return '';
  }
}

function getVue3StateManagerContent(manager, language) {
  switch (manager) {
    case 'pinia':
      return `import { defineStore } from 'pinia';

export const useCounterStore = defineStore('counter', {
  state: () => ({
    count: 0
  }),
  actions: {
    increment() {
      this.count++;
    }
  }
});`;
    case 'vuex':
      return `import { createStore } from 'vuex';

export default createStore({
  state: {
    count: 0
  },
  mutations: {
    increment(state) {
      state.count++;
    }
  }
});`;
    default:
      return '';
  }
}

module.exports = {
  getTemplateFiles
}; 