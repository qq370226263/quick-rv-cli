const fs = require('fs-extra');
const path = require('path');

async function generatePages(projectName, options) {
  const { framework, language, stateManager } = options;
  const ext = language === 'ts' ? 'tsx' : 'jsx';
  const srcPath = path.join(process.cwd(), projectName, 'src');
  const pagesPath = path.join(srcPath, 'pages');
  
  await fs.ensureDir(pagesPath);

  await generateMainFile(srcPath, framework, stateManager, ext);

  await generateAppFile(srcPath, framework, ext);

  // 生成页面文件
  await Promise.all([
    fs.writeFile(
      path.join(pagesPath, `Home.${ext}`),
      generateHomePage(framework, stateManager, language === 'ts')
    ),
    fs.writeFile(
      path.join(pagesPath, `Demo.${ext}`),
      generateDemoPage(framework, stateManager, language === 'ts')
    )
  ]);

  // 生成路由配置
  await generateRouter(projectName, framework, language === 'ts');
}

function generateMainFile(srcPath, framework, stateManager, ext) {
  let mainContent = '';
  
  if (framework === 'react') {
    mainContent = `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
${stateManager === 'redux' ? "import { Provider } from 'react-redux'\nimport { store } from './store'" : 
  stateManager === 'zustand' ? "import { useStore } from './store'" : ''}
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    ${stateManager === 'redux' ? '<Provider store={store}><App /></Provider>' : '<App />'}
  </React.StrictMode>
)`;
  }

  return fs.writeFile(path.join(srcPath, `main.${ext}`), mainContent);
}

function generateAppFile(srcPath, framework, ext) {
  const appContent = `import React from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import Home from './pages/Home'
import Demo from './pages/Demo'

function App() {
  return (
    <Router>
      <div>
        <nav>
          <Link to="/">Home</Link> | <Link to="/demo">Demo</Link>
        </nav>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/demo" element={<Demo />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App`;

  return fs.writeFile(path.join(srcPath, `App.${ext}`), appContent);
}


function generateHomePage(framework, stateManager, isTS) {
  if (framework === 'react') {
    return `import React from 'react';
${generateStateImports(stateManager, isTS)}

${isTS ? 'const Home: React.FC = () => {' : 'function Home() {'}
  ${generateStateHook(stateManager)}

  return (
    <div>
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
${generateVueStateLogic(framework, stateManager)}
</script>`;
  }
}

function generateDemoPage(framework, stateManager, isTS) {
  if (framework === 'react') {
    return `import React from 'react';
${generateStateImports(stateManager, isTS)}

${isTS ? 'const Demo: React.FC = () => {' : 'function Demo() {'}
  ${generateStateHook(stateManager)}

  return (
    <div>
      <h1>Demo Page</h1>
      <button onClick={increment}>
        Increment Count
      </button>
      <p>Current count: {count}</p>
    </div>
  );
}

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
${generateVueStateLogic(framework, stateManager)}
</script>`;
  }
}

function generateStateImports(stateManager, isTS) {
  switch (stateManager) {
    case 'redux':
      return `import { useSelector, useDispatch } from 'react-redux';
${isTS ? 'import { RootState } from \'../store\';' : ''}
import { increment } from '../store';`;
    case 'zustand':
      return 'import { useStore } from \'../store\';';
    case 'none':
      return '';
    case 'mobx':
      return 'import { useMobxStore } from \'../store\';';
    case 'jotai':
      return 'import { useAtomValue } from \'jotai\';';
    case 'xstate':
      return 'import { useMachine } from \'xstate\';';
    case 'pinia':
      return 'import { useCounterStore } from \'../store\';';
    case 'vuex':
      return 'import { useStore } from \'vuex\';';
    default:
      return '';
  }
}

function generateStateHook(stateManager) {
  switch (stateManager) {
    case 'redux':
      return `const count = useSelector((state${isTS ? ': RootState' : ''}) => state.counter.value);
  const dispatch = useDispatch();
  const increment = () => dispatch(increment());`;
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
      return `const { count, increment } = useCounterStore();`;
    case 'jotai':
      return `const count = useAtomValue(countState);
  const increment = () => setCount(count + 1);`;
    case 'xstate':
      return `const { count, increment } = useCounterStore();`;
    case 'none':
      return '';
  }
}

function generateVueStateLogic(framework, stateManager) {
  if (framework === 'vue3') {
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
  } else {
    // Vue 2
    return `export default {
      data() {
        return {
          count: 0
        }
      },
      methods: {
        increment() {
          this.$store.commit('increment');
        }
      },
      computed: {
        count() {
          return this.$store.state.count;
        }
      }
    }`;
  }
}

async function generateRouter(projectName, framework, isTS) {
  const ext = isTS ? 'ts' : 'js';
  const routerPath = path.join(projectName, 'src/router');
  await fs.ensureDir(routerPath);

  if (framework === 'react') {
    // 修改 App.tsx/jsx
    const appContent = `import React from 'react';
      import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
      import Home from './pages/Home';
      import Demo from './pages/Demo';

    ${isTS ? 'const App: React.FC = () => {' : 'function App() {'}
      return (
        <BrowserRouter>
          <div>
            <nav>
              <Link to="/">Home</Link> | <Link to="/demo">Demo</Link>
            </nav>

            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/demo" element={<Demo />} />
            </Routes>
          </div>
        </BrowserRouter>
      );
    }

      export default App;`;

    await fs.writeFile(
      path.join(projectName, `src/App.${isTS ? 'tsx' : 'jsx'}`),
      appContent
    );
  } else {
    // Vue router
    const routerContent = `import { ${framework === 'vue3' ? 'createRouter, createWebHistory' : 'createRouter, createWebHashHistory'} } from 'vue-router';
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
        history: ${framework === 'vue3' ? 'createWebHistory()' : 'createWebHashHistory()'},
        routes
      });

      export default router;`;

    await fs.writeFile(
      path.join(routerPath, `index.${ext}`),
      routerContent
    );
  }
}

module.exports = {
  generatePages
};