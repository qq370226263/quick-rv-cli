# Quick-RV-CLI

一个快速创建React和Vue项目的CLI工具，支持多种构建工具和状态管理方案。

## 功能特点

- 支持React和Vue框架
  - React 
  - Vue 3
  - Vue 2
- 支持多种构建工具
  - Vite
  - Webpack
- 支持JavaScript和TypeScript
- 多种状态管理方案
  - React: Redux, MobX, Zustand, Jotai, XState
  - Vue: Pinia, Vuex
- 测试工具集成
  - Jest
  - Mocha

## 安装

```bash
npm install -g quick-rv-cli
```

## 使用方法

```bash
# 初始化新项目
qrv init my-project

# 根据提示选择配置
```

## 配置选项

创建项目时，你可以配置以下选项：

1. 构建工具：Vite 或 Webpack
2. 前端框架：React, Vue 3 或 Vue 2
3. 编程语言：JavaScript 或 TypeScript
4. 状态管理：
   - React: Redux, MobX, Zustand, Jotai, XState
   - Vue: Pinia, Vuex
5. 测试工具：Jest, Mocha

## 开发

```bash
# 克隆仓库
git clone https://github.com/qq370226263/quick-rv-cli.git

# 安装依赖
cd quick-rv-cli
npm install

# 链接到全局
npm link
```

## 贡献指南

欢迎贡献代码，提交问题或功能建议！

## 许可证

MIT
