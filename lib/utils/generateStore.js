const fs = require('fs-extra');
const path = require('path');
const logger = require('./logger');


async function generateStore(projectName, options) {
  const { framework, language, stateManager } = options;
  const ext = language === 'ts' ? 'ts' : 'js';
  const storePath = path.join(process.cwd(), projectName, 'src/store');
  
  await fs.ensureDir(storePath);
  
  await fs.writeFile(
    path.join(storePath, `index.${ext}`),
    generateStoreContent(framework, stateManager, language === 'ts')
  );

  await updateEntryFile(projectName, framework, stateManager, ext);
}

function generateStoreContent(framework, stateManager, isTS) {
  const typeAnnotations = isTS ? ': number' : '';
  
  switch (stateManager) {
    case 'redux':
      return `import { createSlice, configureStore } from '@reduxjs/toolkit';

const counterSlice = createSlice({
  name: 'counter',
  initialState: {
    value: 0
  },
  reducers: {
    incrementStore: (state) => {
      state.value += 1;
    }
  }
});

export const { incrementStore } = counterSlice.actions;

export const store = configureStore({
  reducer: {
    counter: counterSlice.reducer
  }
});

${isTS ? 'export type RootState = ReturnType<typeof store.getState>;' : ''}`;

    case 'pinia':
      return `import { defineStore } from 'pinia';

export const useCounterStore = defineStore('counter', {
  state: () => ({
    count${typeAnnotations}: 0
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
  },
  actions: {
    increment({ commit }) {
      commit('increment');
    }
  }
});`;

  case 'zustand':
    return `import { create } from 'zustand';

    ${isTS ? 'interface CounterState {\n  count: number;\n  increment: () => void;\n}\n' : ''}
    export const useStore = create${isTS ? '<CounterState>' : ''}((set) => ({
      count: 0,
      increment: () => set((state) => ({ count: state.count + 1 }))
    }));`;

  case 'mobx':
    return `import { makeAutoObservable } from 'mobx';

    export class CounterStore {
      count = 0;

      constructor() {
        makeAutoObservable(this);
      }

      increment() {
        this.count++;
      }
    }

export const counterStore = new CounterStore();`;
    case 'jotai':
      return `import { atom } from 'jotai';

export const countState = atom(0);`;

  case 'xstate':
    return `import { assign, setup, createActor } from 'xstate';

${isTS ? 'export type CounterContext = {\n  count: number;\n};\n\n' : ''}
const counterMachine = setup({
  ${isTS ? 'types: {\n    context: {} as CounterContext,\n  },\n  ' : ''}actions: {
    increment: assign(({ context }) => ({ count: context.count + 1 })),
    decrement: assign(({ context }) => ({ count: context.count - 1 })),
    reset: assign({ count: 0 })
  }
}).createMachine({
  id: 'counter',
  context: {
    count: 0
  },
  initial: 'active',
  states: {
    active: {
      on: {
        INCREMENT: {
          actions: 'increment'
        },
        DECREMENT: {
          actions: 'decrement'
        },
        RESET: {
          actions: 'reset'
        }
      }
    }
  }
});

export const counterActor = createActor(counterMachine);
counterActor.start();`;

  case 'none':
    return '';

  default:
    return '';
  }
}

async function updateEntryFile(projectName, framework, stateManager, ext) {
  try {
    const mainFile = path.join(process.cwd(), projectName, 'src', `main.${ext}`);
    
    // ensure file exists
    if (!await fs.pathExists(mainFile)) {
      logger.debug(`Looking for main file: ${mainFile}`);
      return;
    }

    let content = await fs.readFile(mainFile, 'utf-8');

    switch (stateManager) {
      case 'redux':
        content = `import { Provider } from 'react-redux';\nimport { store } from './store';\n${content}`;
        content = content.replace(
          '<App />',
          '<Provider store={store}><App /></Provider>'
        );
        break;
      case 'pinia':
        content = `import { createPinia } from 'pinia';\n${content}`;
        content = content.replace(
          'createApp(App)',
          'createApp(App).use(createPinia())'
        );
        break;
      case 'vuex':
        content = `import store from './store';\n${content}`;
        content = content.replace(
          'createApp(App)',
          'createApp(App).use(store)'
        );
        break;
    }

    await fs.writeFile(mainFile, content);
  } catch (error) {
    logger.error(`Failed to update main file: ${error.message}`);
  }
}

module.exports = {
  generateStore
};