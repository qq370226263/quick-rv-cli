const questions = [
  {
    type: 'list',
    name: 'framework',
    message: 'Select a framework:',
    choices: [
      {
        name: 'React',
        value: 'react'
      },
      {
        name: 'Vue 3',
        value: 'vue3'
      }
    ]
  },
  {
    type: 'list',
    name: 'language',
    message: 'Select a language:',
    choices: [
      {
        name: 'JavaScript',
        value: 'js'
      },
      {
        name: 'TypeScript',
        value: 'ts'
      }
    ]
  },
  {
    type: 'list',
    name: 'bundler',
    message: 'Select a bundler:',
    choices: [
      {
        name: 'Vite',
        value: 'vite'
      },
      {
        name: 'Webpack',
        value: 'webpack'
      }
    ]
  },
  {
    type: 'list',
    name: 'stateManager',
    message: 'Select a state manager:',
    choices: [
      {
        name: 'None',
        value: 'none'
      },
      {
        name: 'Redux Toolkit',
        value: 'redux',
        when: (answers) => answers.framework === 'react'
      },
      {
        name: 'MobX',
        value: 'mobx',
        when: (answers) => answers.framework === 'react'
      },
      {
        name: 'Zustand',
        value: 'zustand',
        when: (answers) => answers.framework === 'react'
      },
      {
        name: 'Jotai',
        value: 'jotai',
        when: (answers) => answers.framework === 'react'
      },
      {
        name: 'XState',
        value: 'xstate',
        when: (answers) => answers.framework === 'react'
      },
      {
        name: 'Pinia',
        value: 'pinia',
        when: (answers) => answers.framework === 'vue3'
      },
      {
        name: 'Vuex',
        value: 'vuex',
        when: (answers) => answers.framework === 'vue3'
      }
    ]
  },
  {
    type: 'list',
    name: 'testing',
    message: 'Select a testing tool:',
    choices: [
      {
        name: 'None',
        value: 'none'
      },
      {
        name: 'Jest',
        value: 'jest'
      }
    ]
  }
];

module.exports = questions;