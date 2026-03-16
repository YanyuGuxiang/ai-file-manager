# AI 文件管理器

一个用于集中管理和整理用户电脑上 AI 相关配置文件（rules、agents、skills、commands、plugins 等）的 Windows 桌面应用程序。

## 功能特性

- 类别管理：支持自定义类别（如 rules、agents、skills、commands 等）
- 文件扫描：支持文件夹形式和文件形式两种展示类型
- YAML front matter 解析：从 Markdown 文件中提取元数据
- 描述翻译：自动将非中文描述翻译为中文
- 全局搜索：支持对资源名称、描述和路径进行模糊搜索
- 资源定位：点击资源可在文件管理器中快速定位

## 技术栈

- Electron：桌面应用框架
- React：用户界面
- Ant Design：UI 组件库
- js-yaml：YAML 解析

## 快速开始

1. 安装依赖：
```bash
npm install
```

2. 启动开发模式：
```bash
npm run dev
```

3. 打包应用：
```bash
npm run build
```

## 使用说明

首次运行应用会在程序同级目录生成 `config.json` 配置文件。您可以通过设置界面添加和配置各类别的搜索路径。

## 项目结构

```
ai-file-manager/
├── src/
│   ├── main/              # Electron 主进程
│   │   ├── index.js
│   │   └── preload.js
│   ├── renderer/          # React 渲染进程
│   │   ├── components/
│   │   ├── utils/
│   │   ├── App.js
│   │   └── index.js
│   └── shared/            # 共享代码
├── package.json
└── electron-builder.json
```

## 配置文件

应用配置存储在 `config.json` 文件中，默认配置如下：

```json
{
  "categories": [
    {
      "id": "default",
      "name": "默认类别",
      "displayType": "file",
      "searchPaths": []
    }
  ]
}
```

- `displayType`: "folder" 表示文件夹形式，"file" 表示文件形式
- `descriptionFile`: 文件夹形式下指定描述文件名
- `searchPaths`: 搜索路径数组