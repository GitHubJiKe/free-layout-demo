# 自由布局组件系统

这是一个完全组件化的自由布局系统，提供了可复用的组件和 hooks，便于在其他项目中使用。

## 🏗️ 架构概览

```
src/
├── composables/           # 可复用的逻辑hooks
│   ├── useDraggable.js   # 拖拽逻辑hook
│   └── useElementManager.js # 元素管理hook
├── components/            # 组件
│   ├── DraggableElement.vue      # 可拖拽元素组件
│   ├── FreeLayoutWorkspace.vue   # 工作区组件
│   └── FreeLayoutApp.vue         # 主应用组件
└── App.vue              # 示例应用
```

## 🎯 核心组件

### FreeLayoutApp

主应用组件，整合了所有功能。

```vue
<template>
    <FreeLayoutApp
        title="我的布局编辑器"
        :show-grid="true"
        :enable-resize="true"
        :snap-distance="10"
        :enable-snap="true"
        @drag-start="handleDragStart"
        @layout-exported="handleExport"
    >
        <template #element-content="{ element }">
            <!-- 自定义元素内容 -->
            <div>{{ element.content }}</div>
        </template>
    </FreeLayoutApp>
</template>
```

### FreeLayoutWorkspace

工作区组件，处理拖拽和吸附逻辑。

```vue
<template>
    <FreeLayoutWorkspace
        :elements="elements"
        :show-grid="true"
        :enable-resize="true"
        @drag-start="handleDragStart"
        @drag-end="handleDragEnd"
    />
</template>
```

### DraggableElement

可拖拽元素组件，支持自定义内容。

```vue
<template>
    <DraggableElement
        :element="element"
        :is-dragging="isDragging"
        :enable-resize="true"
        @mousedown="handleMouseDown"
    >
        <template #default="{ element }">
            <!-- 自定义元素内容 -->
            <div>{{ element.content }}</div>
        </template>
    </DraggableElement>
</template>
```

## 🔧 Composables

### useDraggable

拖拽逻辑 hook，提供完整的拖拽功能。

```javascript
import { useDraggable } from "@/composables/useDraggable";

const {
    draggingId,
    resizingId,
    snapLines,
    startDrag,
    startResize,
    handleMouseMove,
    handleMouseLeave,
} = useDraggable({
    elements: elementsRef,
    workspaceRef,
    snapDistance: 10,
    enableSnap: true,
    onDragStart: (element, event) => {
        console.log("开始拖拽:", element);
    },
    onDragEnd: (element) => {
        console.log("结束拖拽:", element);
    },
});
```

### useElementManager

元素管理 hook，提供元素的增删改查功能。

```javascript
import { useElementManager } from "@/composables/useElementManager";

const {
    elements,
    addElement,
    removeElement,
    updateElement,
    clearElements,
    exportLayout,
    importLayout,
} = useElementManager({
    initialElements: [],
    generateId: () => Date.now() + Math.random(),
});

// 添加元素
const newElement = addElement({
    content: "新元素",
    x: 100,
    y: 100,
    width: 120,
    height: 80,
});

// 导出布局
const layoutData = exportLayout();
```

## 📋 Props 配置

### FreeLayoutApp Props

| 属性            | 类型    | 默认值          | 说明               |
| --------------- | ------- | --------------- | ------------------ |
| title           | String  | '自由布局 Demo' | 应用标题           |
| initialElements | Array   | []              | 初始元素数组       |
| showGrid        | Boolean | true            | 是否显示网格       |
| enableResize    | Boolean | true            | 是否启用调整大小   |
| resizeHandles   | Array   | ['se']          | 调整大小的手柄位置 |
| snapDistance    | Number  | 10              | 吸附距离           |
| enableSnap      | Boolean | true            | 是否启用吸附       |

### FreeLayoutWorkspace Props

| 属性          | 类型    | 默认值 | 说明               |
| ------------- | ------- | ------ | ------------------ |
| elements      | Array   | []     | 元素数组           |
| showGrid      | Boolean | true   | 是否显示网格       |
| enableResize  | Boolean | true   | 是否启用调整大小   |
| resizeHandles | Array   | ['se'] | 调整大小的手柄位置 |
| snapDistance  | Number  | 10     | 吸附距离           |
| enableSnap    | Boolean | true   | 是否启用吸附       |

### DraggableElement Props

| 属性          | 类型    | 默认值 | 说明               |
| ------------- | ------- | ------ | ------------------ |
| element       | Object  | -      | 元素数据对象       |
| isDragging    | Boolean | false  | 是否正在拖拽       |
| isResizing    | Boolean | false  | 是否正在调整大小   |
| enableResize  | Boolean | true   | 是否启用调整大小   |
| resizeHandles | Array   | ['se'] | 调整大小的手柄位置 |

## 🎨 Events

### FreeLayoutApp Events

-   `grid-toggled`: 网格切换事件
-   `drag-start`: 拖拽开始
-   `drag-move`: 拖拽移动
-   `drag-end`: 拖拽结束
-   `resize-start`: 调整大小开始
-   `resize-move`: 调整大小移动
-   `resize-end`: 调整大小结束
-   `layout-exported`: 布局导出
-   `layout-imported`: 布局导入

### FreeLayoutWorkspace Events

-   `drag-start`: 拖拽开始
-   `drag-move`: 拖拽移动
-   `drag-end`: 拖拽结束
-   `resize-start`: 调整大小开始
-   `resize-move`: 调整大小移动
-   `resize-end`: 调整大小结束

### DraggableElement Events

-   `mousedown`: 鼠标按下
-   `resize-start`: 调整大小开始

## 💡 使用示例

### 基础使用

```vue
<template>
    <FreeLayoutApp
        title="简单布局编辑器"
        @drag-start="handleDragStart"
        @drag-end="handleDragEnd"
    />
</template>

<script>
export default {
    methods: {
        handleDragStart(element, event) {
            console.log("开始拖拽:", element.content);
        },
        handleDragEnd(element) {
            console.log("结束拖拽:", element.content);
        },
    },
};
</script>
```

### 自定义元素内容

```vue
<template>
    <FreeLayoutApp>
        <template #element-content="{ element }">
            <div class="custom-element">
                <h3>{{ element.content }}</h3>
                <p>尺寸: {{ element.width }} × {{ element.height }}</p>
                <p>位置: ({{ element.x }}, {{ element.y }})</p>
            </div>
        </template>
    </FreeLayoutApp>
</template>
```

### 高级配置

```vue
<template>
    <FreeLayoutApp
        :show-grid="false"
        :enable-resize="false"
        :enable-snap="false"
        :snap-distance="20"
        :resize-handles="['se', 'sw', 'ne', 'nw']"
        @layout-exported="saveLayout"
        @layout-imported="loadLayout"
    />
</template>

<script>
export default {
    methods: {
        saveLayout(layoutData) {
            localStorage.setItem("layout", JSON.stringify(layoutData));
        },
        loadLayout(layoutData) {
            console.log("布局已加载:", layoutData);
        },
    },
};
</script>
```

## 🔄 数据格式

### 元素数据格式

```javascript
{
  id: "unique-id",
  x: 100,           // X坐标
  y: 100,           // Y坐标
  width: 120,       // 宽度
  height: 80,       // 高度
  content: "元素内容", // 内容
  startX: 0,        // 拖拽开始X偏移
  startY: 0         // 拖拽开始Y偏移
}
```

### 布局导出格式

```javascript
[
    {
        id: "element-1",
        x: 100,
        y: 100,
        width: 120,
        height: 80,
        content: "元素1",
    },
    {
        id: "element-2",
        x: 250,
        y: 150,
        width: 150,
        height: 100,
        content: "元素2",
    },
];
```

## 🚀 扩展功能

### 添加新的元素类型

```vue
<template>
    <DraggableElement :element="element" :is-dragging="isDragging">
        <template #default="{ element }">
            <div :class="['element', element.type]">
                <component
                    :is="getElementComponent(element.type)"
                    :element="element"
                />
            </div>
        </template>
    </DraggableElement>
</template>

<script>
import TextElement from "./elements/TextElement.vue";
import ImageElement from "./elements/ImageElement.vue";

export default {
    components: {
        TextElement,
        ImageElement,
    },
    methods: {
        getElementComponent(type) {
            const components = {
                text: "TextElement",
                image: "ImageElement",
            };
            return components[type] || "TextElement";
        },
    },
};
</script>
```

### 自定义吸附规则

```javascript
// 在useDraggable中扩展calculateSnap函数
const calculateSnap = (currentElement, newX, newY, elements, snapDistance) => {
    // 自定义吸附逻辑
    const snapLines = [];
    let finalX = newX;
    let finalY = newY;

    // 添加自定义吸附规则
    elements.forEach((element) => {
        if (element.id === currentElement.id) return;

        // 自定义吸附逻辑...
    });

    return { x: finalX, y: finalY, snapLines };
};
```

## 📦 打包发布

可以将组件系统打包为 npm 包：

```bash
# 构建库
npm run build:lib

# 发布到npm
npm publish
```

## 🤝 贡献

欢迎提交 Issue 和 Pull Request 来改进这个组件系统！
