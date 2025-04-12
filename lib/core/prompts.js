const questions = [
  {
    type: 'list',
    name: 'bundler',
    message: 'choose a bundler',
    choices: ['vite', 'webpack'],
    default: 'vite'
  },
  {
    type: 'list',
    name: 'framework',
    message: 'choose a framework',
    choices: ['vue3', 'vue2', 'react'],
    default: 'react'
  },
  {
    type: 'list',
    name: 'language',
    message: 'choose a language',
    when: answers => answers.framework !== 'vue2',
    choices: ['js', 'ts'],
    default: 'js'
  },
  {
    type: 'list',
    name: 'stateManager',
    message: 'choose a state manager',
    when: answers => {
      if (answers.framework === 'react') {
        return true;
      }
      if (answers.framework === 'vue3') {
        return true;
      }
      return false;
    },
    choices: answers => {
      if (answers.framework === 'react') {
        return ['redux', 'mobx', 'zustand', 'recoil', 'jotai', 'xstate', 'none'];
      }
      return ['pinia', 'vuex', 'none'];
    },
    default: 'none'
  },
  {
    type: 'list',
    name: 'testing',
    message: 'choose a testing tool',
    choices: ['jest', 'mocha', 'none'],
    default: 'none'
  }
];

module.exports = questions;