# Free Layout Demo

一个基于Vue 3的自由布局组件，支持拖拽、调整大小、吸附对齐等功能。

## ✨ 功能特性

- 🖱️ **拖拽功能**：支持元素拖拽定位
- 📏 **调整大小**：8个方向的resize手柄
- 🎯 **智能对齐**：边缘对齐、中心对齐、尺寸匹配
- 📐 **吸附系统**：自动吸附到网格和其他元素
- 🎨 **现代UI**：美观的拖拽手柄和视觉反馈
- ⚡ **性能优化**：虚拟化渲染、节流控制

## 🚀 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

### 预览构建结果

```bash
npm run preview
```

## 🌐 在线演示

访问在线演示：[https://githubjike.github.io/free-layout-demo/](https://githubjike.github.io/free-layout-demo/)

## 📦 部署

本项目已配置GitHub Actions自动部署到GitHub Pages。

<!-- ### 自动部署

1. 推送到 `main` 或 `master` 分支
2. GitHub Actions自动构建和部署
3. 访问地址：`https://你的用户名.github.io/free-layout-demo`

### 手动部署

```bash
# 安装gh-pages
npm install -g gh-pages

# 构建并部署
npm run deploy
```

详细部署说明请查看 [DEPLOYMENT.md](./DEPLOYMENT.md) -->

## 🏗️ 项目结构

```
src/
├── components/          # Vue组件
│   ├── DraggableElement.vue      # 可拖拽元素
│   ├── FreeLayoutWorkspace.vue   # 布局工作空间
│   └── ...
├── composables/        # 组合式函数
│   ├── useDraggable.js           # 拖拽逻辑
│   ├── useElementManager.js      # 元素管理
│   └── ...
└── examples/           # 示例代码
```

## 🎯 使用示例

### 基本用法

```vue
<template>
  <FreeLayoutWorkspace
    :elements="elements"
    :enable-resize="true"
    :resize-handles="['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw']"
    @drag-start="handleDragStart"
    @resize-start="handleResizeStart"
  />
</template>

<script>
import { FreeLayoutWorkspace } from './components'

export default {
  components: { FreeLayoutWorkspace },
  data() {
    return {
      elements: [
        { id: 1, x: 100, y: 100, width: 200, height: 150, content: '元素1' },
        { id: 2, x: 350, y: 100, width: 200, height: 150, content: '元素2' }
      ]
    }
  },
  methods: {
    handleDragStart(element, event) {
      console.log('开始拖拽:', element)
    },
    handleResizeStart(element, event, direction) {
      console.log('开始调整大小:', element, direction)
    }
  }
}
</script>
```

## 🔧 配置选项

### FreeLayoutWorkspace Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `elements` | Array | [] | 元素数组 |
| `showGrid` | Boolean | true | 是否显示网格 |
| `enableResize` | Boolean | true | 是否启用调整大小 |
| `resizeHandles` | Array | ['se'] | 调整大小的手柄位置 |
| `snapDistance` | Number | 10 | 吸附距离 |
| `enableSnap` | Boolean | true | 是否启用吸附 |

### DraggableElement Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `element` | Object | - | 元素数据对象 |
| `isDragging` | Boolean | false | 是否正在拖拽 |
| `isResizing` | Boolean | false | 是否正在调整大小 |
| `enableResize` | Boolean | true | 是否启用调整大小 |
| `resizeHandles` | Array | ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'] | 调整大小的手柄位置 |

## 🎨 组合功能

### 多选操作
- **框选多选**：在空白区域拖拽鼠标进行框选，选择多个组件
- **单选操作**：点击单个组件进行单选
- **组合管理**：选中多个组件后右键选择"成组"操作

### 组合特性
- **整体操作**：组合后的组件作为整体进行拖拽和调整大小
- **视觉反馈**：显示组合边框和组件数量
- **灵活解组**：右键选择"解组"可以解除组合关系

### 使用流程
1. 在空白区域拖拽鼠标框选多个组件
2. 右键点击选中的组件显示操作菜单
3. 选择"成组"将组件组合为一个整体
4. 拖拽组合边框或调整手柄操作整个组合
5. 选择"解组"可以解除组合关系

## 🎨 自定义样式

组件使用Less预处理器，你可以通过CSS变量自定义主题：

```less
.draggable-element {
  --primary-color: #4ecdc4;
  --border-color: #45b7aa;
  --selected-color: #ff6b6b;
  
  background: var(--primary-color);
  border-color: var(--border-color);
}
```

## 🤝 贡献

欢迎提交Issue和Pull Request！

## �� 许可证

MIT License
