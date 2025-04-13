# Quick-RV-CLI

## 简介 | Introduction
一个快速创建React和Vue项目的CLI工具，支持多种构建工具和状态管理方案。
会生成一个带有Home和Demo页面的项目，有基本的目录结构。

A quick create React and Vue project CLI tool, support multiple build tools and state management solutions.
It will generate a project with a Home and Demo page, with a basic directory structure.


## 功能特点 | Features

- 支持React和Vue框架 | Surport React and Vue Framework
  - React 
  - Vue 3
  - Vue 2
- 支持多种构建工具 | Surport multiple build tools
  - Vite
  - Webpack
- 支持JavaScript和TypeScript | Surport JavaScript and TypeScript
- 多种状态管理方案 | Multiple state management solutions
  - React: Redux, MobX, Zustand, Jotai, XState
  - Vue: Pinia, Vuex
- 测试工具集成 | Test tools integration
  - Jest
  - Mocha

## 安装 | Installation

```bash
npm install -g quick-rv-cli
```

## 使用方法 | Usage

```bash
# 初始化新项目
qrv init my-project

# 根据提示选择配置
```

## 配置选项 | Configuration Options

创建项目时，你可以配置以下选项：
When creating a new project, you can configure the following options:

1. 构建工具 | build tools
   - Vite
   - Webpack
2. 前端框架 | Frameworks
   - React
   - Vue 3
   - Vue 2
3. 编程语言 | Language
   - JavaScript
   - TypeScript
4. 状态管理 | State Manage
   - React: Redux, MobX, Zustand, Jotai, XState
   - Vue: Pinia, Vuex
5. 测试工具 | Test tools
   - Jest
   - Mocha

## 开发

```bash
# 克隆仓库 | Clone the repository
git clone https://github.com/qq370226263/quick-rv-cli.git

# 安装依赖 | Install dependencies
##临时安装
npx install quick-rv-cli

##全局安装
npm install -g quick-rv-cli
```


## 贡献指南

欢迎贡献代码，提交问题或功能建议！

## 许可证

MIT
