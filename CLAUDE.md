# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI文件管理器是一个使用Electron + React开发的Windows桌面应用程序，用于集中管理和整理用户电脑上的AI相关配置文件（rules、agents、skills、commands、plugins等）。

## Architecture

### Core Components
- **Main Process** (`src/main/`): Electron主进程，负责应用生命周期、IPC通信和文件操作
- **Renderer Process** (`src/renderer/`): React渲染进程，包含用户界面和业务逻辑
  - **Components** (`src/renderer/components/`): React UI组件（CategoryList, ResourceList, SearchBar, CategoryDialog）
  - **Utils** (`src/renderer/utils/`): 工具模块（scanner, config, translator）

### Key Modules
- **Scanner** (`src/renderer/utils/scanner.js`): 文件扫描模块，支持文件夹和文件两种形式的资源扫描
- **Config** (`src/main/config.js`): 配置管理模块，处理应用配置的读写

## Build & Development

### Commands
- `npm run dev`: 启动开发模式
- `npm start`: 构建并启动应用
- `npm run build`: 构建为Windows目录版（dist/win-unpacked/）
- `npm run build-renderer`: 构建React前端资源

### Development Workflow
1. 修改前端代码后运行`npx webpack --config webpack.config.js`重建
2. 使用`npm run dev`进行开发测试（终端会显示主进程日志）
3. 使用`npm run build`生成最终应用

### Debugging
- F12打开DevTools查看渲染进程日志
- 主进程日志（scanner.js等）显示在启动应用的终端中
- 开发模式下自动打开DevTools

## Configuration Structure

配置文件使用JSON格式存储类别信息：
```json
{
  "categories": [
    {
      "id": "unique-id",
      "name": "类别名称",
      "displayType": "folder|file",
      "descriptionFile": "描述文件名（仅folder类型）",
      "searchPaths": ["搜索路径数组"]
    }
  ]
}
```

### Config File Location
- 开发环境：项目根目录的`config.json`
- 打包后：exe同目录的`config.json`

## Platform Specifics

### File Scanning
- 支持文件夹形式（每个文件夹作为一个资源）和文件形式（每个.md文件作为一个资源）
- 自动解析YAML front matter获取资源描述
- **重要**：YAML解析支持Windows换行符（\r\n）和Unix换行符（\n）

### Build Target
- 使用`dir`目标而非`portable`，因为portable会解压到临时目录导致配置文件路径问题

## Dependencies
- Electron: 桌面应用框架
- React: 用户界面
- js-yaml: YAML解析
- Ant Design: UI组件库
