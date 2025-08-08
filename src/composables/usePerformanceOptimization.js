import { ref, computed, onMounted, onUnmounted } from "vue";

// 虚拟化渲染hook
export function useVirtualization(options = {}) {
    const {
        containerRef,
        elements = ref([]),
        itemHeight = 80,
        itemWidth = 120,
        buffer = 5,
    } = options;

    const visibleItems = ref([]);
    const scrollTop = ref(0);
    const scrollLeft = ref(0);

    const calculateVisibleItems = () => {
        const container = containerRef.value;
        if (!container || !elements.value || elements.value.length === 0) {
            visibleItems.value = [];
            return;
        }

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

    const handleScroll = (event) => {
        if (event && event.target) {
            scrollTop.value = event.target.scrollTop || 0;
            scrollLeft.value = event.target.scrollLeft || 0;
            calculateVisibleItems();
        }
    };

    return {
        visibleItems,
        calculateVisibleItems,
        handleScroll,
    };
}

// 空间分区系统
export class SpatialGrid {
    constructor(cellSize = 100) {
        this.cellSize = cellSize;
        this.grid = new Map();
    }

    getGridKey(x, y) {
        const gridX = Math.floor(x / this.cellSize);
        const gridY = Math.floor(y / this.cellSize);
        return `${gridX},${gridY}`;
    }

    addElement(element) {
        if (
            !element ||
            typeof element.x !== "number" ||
            typeof element.y !== "number"
        ) {
            return;
        }
        const key = this.getGridKey(element.x, element.y);
        if (!this.grid.has(key)) {
            this.grid.set(key, []);
        }
        this.grid.get(key).push(element);
    }

    getNearbyElements(element) {
        if (
            !element ||
            typeof element.x !== "number" ||
            typeof element.y !== "number"
        ) {
            return [];
        }

        const nearby = new Set();
        const centerX = element.x + (element.width || 0) / 2;
        const centerY = element.y + (element.height || 0) / 2;

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

    updateGrid(elements) {
        this.grid.clear();
        if (Array.isArray(elements)) {
            elements.forEach((element) => this.addElement(element));
        }
    }
}

// 节流函数
export function throttle(func, delay) {
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

// 防抖函数
export function debounce(func, delay) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            func.apply(this, args);
        }, delay);
    };
}

// 性能监控
export class PerformanceMonitor {
    constructor() {
        this.metrics = {
            fps: 0,
            renderTime: 0,
            dragTime: 0,
            memoryUsage: 0,
        };
        this.frameCount = 0;
        this.lastTime = performance.now();
        this.frameStart = 0;
        this.frameTimes = [];
    }

    startFrame() {
        this.frameStart = performance.now();
    }

    endFrame() {
        if (this.frameStart > 0) {
            const frameTime = performance.now() - this.frameStart;
            this.metrics.renderTime = frameTime;

            // 保存最近10帧的时间用于计算平均FPS
            this.frameTimes.push(frameTime);
            if (this.frameTimes.length > 10) {
                this.frameTimes.shift();
            }
        }

        this.frameCount++;
        const currentTime = performance.now();
        if (currentTime - this.lastTime >= 1000) {
            // 计算FPS
            this.metrics.fps = Math.round(this.frameCount);
            this.frameCount = 0;
            this.lastTime = currentTime;

            // 计算平均渲染时间
            if (this.frameTimes.length > 0) {
                const avgRenderTime =
                    this.frameTimes.reduce((sum, time) => sum + time, 0) /
                    this.frameTimes.length;
                this.metrics.renderTime = avgRenderTime;
            }

            // 获取内存使用情况
            if (performance.memory) {
                this.metrics.memoryUsage = Math.round(
                    performance.memory.usedJSHeapSize / 1024 / 1024,
                );
            }
        }
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

// 组件实例池
export class ComponentPool {
    constructor(componentType, maxSize = 100) {
        this.componentType = componentType;
        this.maxSize = maxSize;
        this.pool = [];
    }

    get() {
        return this.pool.pop() || this.createComponent();
    }

    release(component) {
        if (this.pool.length < this.maxSize) {
            this.resetComponent(component);
            this.pool.push(component);
        }
    }

    createComponent() {
        // 创建新组件实例
        return {
            type: this.componentType,
            data: null,
            props: {},
        };
    }

    resetComponent(component) {
        component.data = null;
        component.props = {};
    }
}

// 事件委托
export function useEventDelegation(containerRef, handlers) {
    const handleContainerClick = (event) => {
        const target = event.target;
        const element = target.closest(".draggable-element");

        if (element) {
            const elementId = element.dataset.elementId;
            if (elementId && handlers.onElementClick) {
                handlers.onElementClick(elementId, event);
            }
        }
    };

    const handleContainerMouseDown = (event) => {
        const target = event.target;
        const element = target.closest(".draggable-element");

        if (element) {
            const elementId = element.dataset.elementId;
            if (elementId && handlers.onElementMouseDown) {
                handlers.onElementMouseDown(elementId, event);
            }
        }
    };

    onMounted(() => {
        if (containerRef.value) {
            containerRef.value.addEventListener("click", handleContainerClick);
            containerRef.value.addEventListener(
                "mousedown",
                handleContainerMouseDown,
            );
        }
    });

    onUnmounted(() => {
        if (containerRef.value) {
            containerRef.value.removeEventListener(
                "click",
                handleContainerClick,
            );
            containerRef.value.removeEventListener(
                "mousedown",
                handleContainerMouseDown,
            );
        }
    });
}

// 主性能优化hook
export function usePerformanceOptimization(options = {}) {
    const {
        enableVirtualization = true,
        enableSpatialGrid = true,
        enableThrottling = true,
        enableMonitoring = true,
    } = options;

    const performanceMonitor = enableMonitoring
        ? new PerformanceMonitor()
        : null;
    const spatialGrid = enableSpatialGrid ? new SpatialGrid(100) : null;

    // 虚拟化相关
    const containerRef = ref(null);
    const { visibleItems, calculateVisibleItems, handleScroll } =
        useVirtualization({
            containerRef,
            elements: options.elements || ref([]),
            itemHeight: options.itemHeight || 80,
            itemWidth: options.itemWidth || 120,
            buffer: options.buffer || 5,
        });

    // 节流处理
    const throttledHandleDrag = enableThrottling
        ? throttle(options.handleDrag || (() => {}), 16)
        : options.handleDrag || (() => {});

    // 性能监控
    const startFrame = () => {
        if (performanceMonitor) {
            performanceMonitor.startFrame();
        }
    };

    const endFrame = () => {
        if (performanceMonitor) {
            performanceMonitor.endFrame();
        }
    };

    const getPerformanceMetrics = () => {
        return performanceMonitor
            ? performanceMonitor.getMetrics()
            : {
                  fps: 0,
                  renderTime: 0,
                  dragTime: 0,
                  memoryUsage: 0,
              };
    };

    // 测量拖拽性能
    const measureDrag = (callback) => {
        if (performanceMonitor) {
            return performanceMonitor.measureDrag(callback);
        }
        return callback();
    };

    // 空间分区优化
    const updateSpatialGrid = (elements) => {
        if (spatialGrid) {
            spatialGrid.updateGrid(elements);
        }
    };

    const getNearbyElements = (element) => {
        return spatialGrid ? spatialGrid.getNearbyElements(element) : [];
    };

    return {
        // 虚拟化
        containerRef,
        visibleItems,
        calculateVisibleItems,
        handleScroll,

        // 性能监控
        startFrame,
        endFrame,
        getPerformanceMetrics,
        measureDrag,

        // 空间分区
        updateSpatialGrid,
        getNearbyElements,

        // 节流
        throttledHandleDrag,
    };
}
