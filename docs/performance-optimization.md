# 自由布局系统性能优化指南

## 概述

当自由布局系统处理大量元素（如 1000+个元素）或复杂组件（如图表、3D 渲染等）时，性能问题会变得非常明显。本文档详细介绍了各种性能优化策略和实现方案。

## 🎯 性能瓶颈分析

### 主要性能瓶颈

1. **渲染性能**

    - DOM 节点过多导致重排重绘
    - 复杂组件（图表、3D 等）渲染开销
    - 频繁的样式计算和布局

2. **拖拽性能**

    - 实时碰撞检测计算
    - 吸附线计算
    - 元素位置更新

3. **内存占用**
    - 大量元素对象占用内存
    - 事件监听器累积
    - 组件实例过多

## 🚀 优化策略

### 1. 虚拟化渲染 (Virtual Scrolling)

#### 实现原理

只渲染可视区域内的元素，其他元素用占位符代替。

```javascript
// 虚拟化渲染组件
export function useVirtualization(options = {}) {
    const {
        containerRef,
        itemHeight = 80,
        itemWidth = 120,
        buffer = 5, // 缓冲区大小
    } = options;

    const visibleItems = ref([]);
    const scrollTop = ref(0);
    const scrollLeft = ref(0);

    const calculateVisibleItems = () => {
        const container = containerRef.value;
        if (!container) return;

        const { width, height } = container.getBoundingClientRect();
        const startRow = Math.floor(scrollTop.value / itemHeight);
        const endRow = Math.ceil((scrollTop.value + height) / itemHeight);
        const startCol = Math.floor(scrollLeft.value / itemWidth);
        const endCol = Math.ceil((scrollLeft.value + width) / itemWidth);

        // 添加缓冲区
        const bufferStartRow = Math.max(0, startRow - buffer);
        const bufferEndRow = endRow + buffer;
        const bufferStartCol = Math.max(0, startCol - buffer);
        const bufferEndCol = endCol + buffer;

        visibleItems.value = elements.value.filter((element) => {
            const elementRow = Math.floor(element.y / itemHeight);
            const elementCol = Math.floor(element.x / itemWidth);
            return (
                elementRow >= bufferStartRow &&
                elementRow <= bufferEndRow &&
                elementCol >= bufferStartCol &&
                elementCol <= bufferEndCol
            );
        });
    };

    return {
        visibleItems,
        calculateVisibleItems,
    };
}
```

#### 使用示例

```vue
<template>
    <div
        class="virtualized-workspace"
        ref="containerRef"
        @scroll="handleScroll"
    >
        <div class="virtualized-container" :style="containerStyle">
            <DraggableElement
                v-for="element in visibleItems"
                :key="element.id"
                :element="element"
                :is-dragging="element.id === draggingId"
            />
        </div>
    </div>
</template>

<script>
import { useVirtualization } from "@/composables/useVirtualization";

export default {
    setup() {
        const containerRef = ref(null);
        const { visibleItems, calculateVisibleItems } = useVirtualization({
            containerRef,
            itemHeight: 80,
            itemWidth: 120,
            buffer: 5,
        });

        const handleScroll = () => {
            calculateVisibleItems();
        };

        return {
            containerRef,
            visibleItems,
            handleScroll,
        };
    },
};
</script>
```

### 2. 碰撞检测优化

#### 空间分区 (Spatial Partitioning)

使用网格或四叉树来优化碰撞检测。

```javascript
// 网格分区系统
export class SpatialGrid {
    constructor(cellSize = 100) {
        this.cellSize = cellSize;
        this.grid = new Map();
    }

    // 获取元素所在的网格坐标
    getGridKey(x, y) {
        const gridX = Math.floor(x / this.cellSize);
        const gridY = Math.floor(y / this.cellSize);
        return `${gridX},${gridY}`;
    }

    // 添加元素到网格
    addElement(element) {
        const key = this.getGridKey(element.x, element.y);
        if (!this.grid.has(key)) {
            this.grid.set(key, []);
        }
        this.grid.get(key).push(element);
    }

    // 获取可能碰撞的元素
    getNearbyElements(element) {
        const nearby = new Set();
        const centerX = element.x + element.width / 2;
        const centerY = element.y + element.height / 2;

        // 检查周围9个网格
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                const key = this.getGridKey(
                    centerX + dx * this.cellSize,
                    centerY + dy * this.cellSize,
                );
                const elements = this.grid.get(key) || [];
                elements.forEach((el) => {
                    if (el.id !== element.id) {
                        nearby.add(el);
                    }
                });
            }
        }

        return Array.from(nearby);
    }

    // 更新网格
    updateGrid(elements) {
        this.grid.clear();
        elements.forEach((element) => this.addElement(element));
    }
}
```

#### 使用示例

```javascript
// 在useDraggable中使用空间分区
const spatialGrid = new SpatialGrid(100);

const calculateSnap = (currentElement, newX, newY, elements, snapDistance) => {
    // 更新网格
    spatialGrid.updateGrid(elements);

    // 只检查附近的元素
    const nearbyElements = spatialGrid.getNearbyElements(currentElement);
    const snapLines = [];
    let finalX = newX;
    let finalY = newY;

    nearbyElements.forEach((element) => {
        // 碰撞检测逻辑...
    });

    return { x: finalX, y: finalY, snapLines };
};
```

### 3. 组件懒加载和缓存

#### 组件懒加载

```javascript
// 懒加载组件
const LazyChartComponent = defineAsyncComponent(() =>
    import('./components/ChartComponent.vue')
)

// 条件渲染
<template>
    <div class="element-content">
        <template v-if="isVisible">
            <component
                :is="getComponentType(element.type)"
                :data="element.data"
                v-if="shouldRenderComponent(element)"
            />
        </template>
        <div v-else class="placeholder">
            {{ element.content }}
        </div>
    </div>
</template>

<script>
export default {
    setup() {
        const isVisible = computed(() => {
            // 检查元素是否在可视区域内
            return isElementInViewport(element.value)
        })

        const shouldRenderComponent = (element) => {
            // 只渲染复杂组件，简单文本直接显示
            return element.type !== 'text' && isVisible.value
        }

        return {
            isVisible,
            shouldRenderComponent
        }
    }
}
</script>
```

### 4. 防抖和节流优化

#### 拖拽事件优化

```javascript
// 节流函数
function throttle(func, delay) {
    let timeoutId;
    let lastExecTime = 0;
    return function (...args) {
        const currentTime = Date.now();

        if (currentTime - lastExecTime > delay) {
            func.apply(this, args);
            lastExecTime = currentTime;
        } else {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                func.apply(this, args);
                lastExecTime = Date.now();
            }, delay - (currentTime - lastExecTime));
        }
    };
}

// 在useDraggable中使用
const throttledHandleDrag = throttle(handleDrag, 16); // 60fps
```

### 5. Web Workers 处理复杂计算

#### 使用 Web Worker 进行碰撞检测

```javascript
// worker.js
self.onmessage = function (e) {
    const { elements, currentElement, newX, newY, snapDistance } = e.data;

    // 在Worker中进行碰撞检测计算
    const result = calculateSnapInWorker(
        elements,
        currentElement,
        newX,
        newY,
        snapDistance,
    );

    self.postMessage(result);
};

function calculateSnapInWorker(
    elements,
    currentElement,
    newX,
    newY,
    snapDistance,
) {
    // 复杂的碰撞检测逻辑...
    return { x: finalX, y: finalY, snapLines };
}
```

#### 在主线程中使用

```javascript
// 在useDraggable中使用Worker
const worker = new Worker("/worker.js");

const handleDragWithWorker = (event, workspaceRef) => {
    if (!draggingId.value) return;

    const element = elements.value.find((el) => el.id === draggingId.value);
    if (!element) return;

    const rect = workspaceRef.getBoundingClientRect();
    let newX = event.clientX - rect.left - element.startX;
    let newY = event.clientY - rect.top - element.startY;

    // 发送数据到Worker
    worker.postMessage({
        elements: elements.value,
        currentElement: element,
        newX,
        newY,
        snapDistance: 10,
    });
};

worker.onmessage = function (e) {
    const { x, y, snapLines } = e.data;
    // 更新元素位置和吸附线
    element.x = x;
    element.y = y;
    snapLines.value = snapLines;
};
```

### 6. 内存管理优化

#### 组件实例池

```javascript
// 组件实例池
class ComponentPool {
    constructor(componentType, maxSize = 100) {
        this.componentType = componentType;
        this.maxSize = maxSize;
        this.pool = [];
    }

    get() {
        return this.pool.pop() || createComponent(this.componentType);
    }

    release(component) {
        if (this.pool.length < this.maxSize) {
            this.resetComponent(component);
            this.pool.push(component);
        }
    }

    resetComponent(component) {
        // 重置组件状态
        component.data = null;
        component.props = {};
    }
}
```

#### 事件监听器优化

```javascript
// 事件委托
const useEventDelegation = (containerRef) => {
    const handleContainerClick = (event) => {
        const target = event.target;
        const elementId =
            target.closest(".draggable-element")?.dataset.elementId;

        if (elementId) {
            // 处理元素点击
            handleElementClick(elementId, event);
        }
    };

    onMounted(() => {
        containerRef.value?.addEventListener("click", handleContainerClick);
    });

    onUnmounted(() => {
        containerRef.value?.removeEventListener("click", handleContainerClick);
    });
};
```

### 7. 渲染优化

#### 使用 CSS Transform

```vue
<template>
    <div
        class="draggable-element"
        :style="{
            transform: `translate(${element.x}px, ${element.y}px)`,
            width: `${element.width}px`,
            height: `${element.height}px`,
        }"
    >
        <!-- 内容 -->
    </div>
</template>

<style>
.draggable-element {
    position: absolute;
    top: 0;
    left: 0;
    will-change: transform; /* 提示浏览器优化 */
}
</style>
```

#### 使用 requestAnimationFrame

```javascript
// 使用requestAnimationFrame优化动画
const animateElement = (element, targetX, targetY) => {
    const startX = element.x;
    const startY = element.y;
    const startTime = performance.now();
    const duration = 300;

    const animate = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // 缓动函数
        const easeOut = 1 - Math.pow(1 - progress, 3);

        element.x = startX + (targetX - startX) * easeOut;
        element.y = startY + (targetY - startY) * easeOut;

        if (progress < 1) {
            requestAnimationFrame(animate);
        }
    };

    requestAnimationFrame(animate);
};
```

## 📊 性能监控

### 性能指标监控

```javascript
// 性能监控工具
class PerformanceMonitor {
    constructor() {
        this.metrics = {
            fps: 0,
            renderTime: 0,
            dragTime: 0,
            memoryUsage: 0,
        };
    }

    startFrame() {
        this.frameStart = performance.now();
    }

    endFrame() {
        const frameTime = performance.now() - this.frameStart;
        this.metrics.fps = 1000 / frameTime;
        this.metrics.renderTime = frameTime;
    }

    measureDrag(callback) {
        const start = performance.now();
        const result = callback();
        this.metrics.dragTime = performance.now() - start;
        return result;
    }

    getMetrics() {
        return { ...this.metrics };
    }
}
```

### 使用示例

```javascript
const performanceMonitor = new PerformanceMonitor();

// 在渲染循环中使用
const renderLoop = () => {
    performanceMonitor.startFrame();

    // 渲染逻辑

    performanceMonitor.endFrame();
    requestAnimationFrame(renderLoop);
};

// 监控拖拽性能
const handleDrag = (event) => {
    performanceMonitor.measureDrag(() => {
        // 拖拽处理逻辑
    });
};
```

## 🎯 最佳实践

### 1. 分层渲染

-   背景层：网格、吸附线等静态内容
-   元素层：可拖拽元素
-   交互层：拖拽时的临时元素

### 2. 按需渲染

-   只渲染可视区域内的元素
-   复杂组件延迟加载
-   使用占位符代替不可见元素

### 3. 缓存策略

-   缓存计算结果
-   复用组件实例
-   预计算常用数据

### 4. 代码分割

-   按功能模块分割代码
-   使用动态导入
-   懒加载非关键组件

## 📈 性能测试

### 测试场景

1. **1000 个简单元素**：测试基础渲染性能
2. **100 个复杂图表**：测试复杂组件性能
3. **实时拖拽**：测试交互性能
4. **内存泄漏**：测试长时间运行稳定性

### 测试工具

-   Chrome DevTools Performance 面板
-   Vue DevTools
-   自定义性能监控

## 🔧 配置选项

### 性能配置

```javascript
// 性能配置选项
const performanceConfig = {
    // 虚拟化配置
    virtualization: {
        enabled: true,
        itemHeight: 80,
        itemWidth: 120,
        buffer: 5,
    },

    // 碰撞检测配置
    collisionDetection: {
        enabled: true,
        spatialGrid: true,
        gridSize: 100,
    },

    // 渲染配置
    rendering: {
        useTransform: true,
        useRequestAnimationFrame: true,
        lazyLoading: true,
    },

    // 内存配置
    memory: {
        componentPool: true,
        maxPoolSize: 100,
        cleanupInterval: 30000,
    },
};
```

## 📝 总结

性能优化是一个持续的过程，需要根据具体的使用场景和性能要求来选择合适的优化策略。关键点包括：

1. **虚拟化渲染**：处理大量元素
2. **空间分区**：优化碰撞检测
3. **懒加载**：减少初始渲染时间
4. **Web Workers**：处理复杂计算
5. **内存管理**：防止内存泄漏
6. **渲染优化**：使用现代 CSS 和 API
7. **性能监控**：持续监控和优化

通过综合运用这些优化策略，可以显著提升自由布局系统在处理大量元素和复杂组件时的性能表现。
