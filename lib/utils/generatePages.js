const fs = require('fs-extra');
const path = require('path');

async function generatePages(projectName, options) {
  const { framework, language, stateManager } = options;
  const ext = language === 'ts' ? 'tsx' : 'jsx';
  const srcPath = path.join(process.cwd(), projectName, 'src');
  const pagesPath = path.join(srcPath, 'pages');
  const routerPath = path.join(srcPath, 'router');
  
  await fs.mkdirp(pagesPath);
  await fs.mkdirp(routerPath);

  await generateRouter(projectName, framework, language === 'ts');

  await Promise.all([
    fs.writeFile(
      path.join(pagesPath, `Home.${ext}`),
      generateHomePage(framework, language, stateManager)
    ),
    fs.writeFile(
      path.join(pagesPath, `Demo.${ext}`),
      generateDemoPage(framework, language, stateManager)
    )
  ]);
}

async function generateRouter(projectName, framework, isTS) {
  const ext = isTS ? 'tsx' : 'jsx';
  const routerPath = path.join(process.cwd(), projectName, 'src/router');
  // 确保目录存在
  if (!fs.existsSync(routerPath)) {
    await fs.mkdirp(routerPath);
  }

  if (framework === 'react') {
    const routerContent = `import { Routes, Route } from 'react-router-dom';
import Home from '../pages/Home';
import Demo from '../pages/Demo';

function Router() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/demo" element={<Demo />} />
    </Routes>
  );
}

export default Router;`;

    await fs.writeFile(
      path.join(routerPath, `index.${ext}`),
      routerContent
    );
  } else {
    // Vue router
    const routerContent = `import { createRouter, createWebHistory } from 'vue-router';
import Home from '../pages/Home.vue';
import Demo from '../pages/Demo.vue';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/demo',
    name: 'Demo',
    component: Demo
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;`;

    await fs.writeFile(
      path.join(routerPath, `index.${ext}`),
      routerContent
    );
  }
}

function generateHomePage(framework, language, stateManager) {
  if (framework === 'react') {
    const safeStateManager = stateManager || 'none';
    
    const stateImports = generateHomeStateImports(safeStateManager, language === 'ts');
    const stateHook = generateHomeStateHook(safeStateManager, language === 'ts');
    
    return `import React from 'react';
import { Link } from 'react-router-dom';
${stateImports}

${language === 'ts' ? 'const Home: React.FC = () => {' : 'function Home() {'}
  ${stateHook}

  return (
    <div>
      <nav>
        <Link to="/">Home</Link> |
        <Link to="/demo">Demo</Link>
      </nav>
      <h1>Home Page</h1>
      <p>Count: {count}</p>
    </div>
  );
}

export default Home;`;
  } else {
    // Vue template
    return `<template>
  <div>
    <h1>Home Page</h1>
    <p>Count: {{ ${stateManager === 'pinia' ? 'counter.count' : 'count'} }}</p>
  </div>
</template>

<script ${framework === 'vue3' ? 'setup ' : ''}${language === 'ts' ? 'lang="ts"' : ''}>
${generateHomeVueStateLogic(framework, stateManager)}
</script>`;
  }
}

function generateDemoPage(framework, language, stateManager) {
  if (framework === 'react') {
    const safeStateManager = stateManager || 'none';
    
    const stateImports = generateDemoStateImports(safeStateManager, language === 'ts');
    const stateHook = generateDemoStateHook(safeStateManager, language === 'ts');
    
    const componentDefinition = safeStateManager === 'mobx' 
      ? `${language === 'ts' ? 'const Demo: React.FC = observer(() => {' : 'const Demo = observer(() => {'}`
      : `${language === 'ts' ? 'const Demo: React.FC = () => {' : 'function Demo() {'}`;

    return `import React from 'react';
import { Link } from 'react-router-dom';
${stateImports}

${componentDefinition}
  ${stateHook}

  return (
    <div>
      <nav>
        <Link to="/">Home</Link> |
        <Link to="/demo">Demo</Link>
      </nav>
      <h1>Demo Page</h1>
      <button onClick={increment}>
        Increment Count
      </button>
      <p>Current count: {count}</p>
    </div>
  );
}${safeStateManager === 'mobx' ? ')' : ''}

export default Demo;`;
  } else {
    // Vue template
    return `<template>
  <div>
    <h1>Demo Page</h1>
    <button @click="increment">
      Increment Count
    </button>
    <p>Current count: {{ ${stateManager === 'pinia' ? 'counter.count' : 'count'} }}</p>
  </div>
</template>

<script ${framework === 'vue3' ? 'setup ' : ''}${language === 'ts' ? 'lang="ts"' : ''}>
${generateDemoVueStateLogic(framework, stateManager)}
</script>`;
  }
}

function generateHomeStateImports(stateManager, isTS) {
  switch (stateManager) {
    case 'redux':
      return `import { useSelector } from 'react-redux';
${isTS ? 'import { RootState } from \'../store\';' : ''}`;
    case 'zustand':
      return 'import { useStore } from \'../store\';';
    case 'none':
      return '';
    case 'mobx':
      return `import { observer } from 'mobx-react';
import { counterStore } from '../store';`;
    case 'jotai':
      return `import { useAtom } from 'jotai';
import { countState } from '../store';`;
    case 'xstate':
      return `import { useSelector } from '@xstate/react';
import { counterActor } from '../store';`;
    case 'pinia':
      return 'import { useCounterStore } from \'../store\';';
    case 'vuex':
      return 'import { useStore } from \'vuex\';';
    default:
      return '';
  }
}

function generateHomeStateHook(stateManager, isTS) {
  switch (stateManager) {
    case 'redux':
      return `const count = useSelector((state${isTS ? ': RootState' : ''}) => state.counter.value);`;
    case 'zustand':
      return `const { count } = useStore();`;
    case 'none':
      return `const [count] = React.useState(0);`;
    case 'pinia':
      return `const { count } = useCounterStore();`;
    case 'vuex':
      return `const count = computed(() => store.state.count);`;
    case 'mobx':
      return `const count = counterStore.count;`;
    case 'jotai':
      return `const [count] = useAtom(countState);`;
    case 'xstate':
      return `const count = useSelector(counterActor, (state) => state.context.count);`;
    default:
      return `const [count] = React.useState(0);`;
  }
}

function generateDemoStateImports(stateManager, isTS) {
  switch (stateManager) {
    case 'redux':
      return `import { useSelector, useDispatch } from 'react-redux';
${isTS ? 'import { RootState } from \'../store\';' : ''}
import { incrementStore } from '../store';`;
    case 'zustand':
      return 'import { useStore } from \'../store\';';
    case 'none':
      return '';
    case 'mobx':
      return `import { observer } from 'mobx-react';
import { counterStore } from '../store';`;
    case 'jotai':
      return `import { useAtom } from 'jotai';
import { countState } from '../store';`;
    case 'xstate':
      return `import { useSelector } from '@xstate/react';
import { counterActor } from '../store';`;
    case 'pinia':
      return 'import { useCounterStore } from \'../store\';';
    case 'vuex':
      return 'import { useStore } from \'vuex\';';
    default:
      return '';
  }
}

function generateDemoStateHook(stateManager, isTS) {
  switch (stateManager) {
    case 'redux':
      return `const count = useSelector((state${isTS ? ': RootState' : ''}) => state.counter.value);
  const dispatch = useDispatch();
  const increment = () => dispatch(incrementStore());`;
    case 'zustand':
      return `const { count, increment } = useStore();`;
    case 'none':
      return `const [count, setCount] = React.useState(0);
  const increment = () => setCount(count + 1);`;
    case 'pinia':
      return `const { count, increment } = useCounterStore();`;
    case 'vuex':
      return `const count = computed(() => store.state.count);
  const increment = () => store.commit('increment');`;
    case 'mobx':
      return `const count = counterStore.count;
  const increment = () => counterStore.increment();`;
    case 'jotai':
      return `const [count, setCount] = useAtom(countState);
  const increment = () => setCount(count + 1);`;
    case 'xstate':
      return `const count = useSelector(counterActor, (state) => state.context.count);
  const increment = () => counterActor.send({ type: 'INCREMENT' });`;
    default:
      return `const [count, setCount] = React.useState(0);
  const increment = () => setCount(count + 1);`;
  }
}

function generateHomeVueStateLogic(framework, stateManager) {
  switch (stateManager) {
    case 'pinia':
      return `import { useCounterStore } from '../store';
      const counter = useCounterStore();`;
    case 'vuex':
      return `import { useStore } from 'vuex';
      const store = useStore();
      const count = computed(() => store.state.count);`;
    case 'none':
      return `import { ref } from 'vue';
      const count = ref(0);`;
  }
}

function generateDemoVueStateLogic(framework, stateManager) {
  switch (stateManager) {
    case 'pinia':
      return `import { useCounterStore } from '../store';
      const counter = useCounterStore();
      const increment = () => counter.increment();`;
    case 'vuex':
      return `import { useStore } from 'vuex';
      const store = useStore();
      const count = computed(() => store.state.count);
      const increment = () => store.commit('increment');`;
    case 'none':
      return `import { ref } from 'vue';
      const count = ref(0);
      const increment = () => count.value++;`;
  }
}

module.exports = {
  generatePages
};