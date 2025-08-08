<template>
    <div class="optimized-free-layout-app">
        <div class="header">
            <h1>{{ title }}</h1>
            <div class="controls">
                <button @click="addElement">添加元素</button>
                <button @click="toggleGrid">切换网格</button>
                <button @click="clearElements">清空</button>
                <button @click="exportLayoutData">导出布局</button>
                <button @click="importLayoutData">导入布局</button>
                <button @click="generateTestElements(100)" class="test-btn">
                    生成测试元素
                </button>
                <button @click="toggleConfigPanel" class="config-btn">
                    性能配置
                </button>
            </div>
        </div>

        <div class="workspace-container">
            <OptimizedFreeLayoutWorkspace
                :elements="elements"
                :show-grid="showGrid"
                :enable-resize="enableResize"
                :resize-handles="resizeHandles"
                :snap-distance="snapDistance"
                :enable-snap="enableSnap"
                :enable-virtualization="enableVirtualization"
                :enable-spatial-grid="enableSpatialGrid"
                :enable-throttling="enableThrottling"
                :enable-monitoring="enableMonitoring"
                :show-performance-panel="showPerformancePanel"
                :performance-panel-position="performancePanelPosition"
                :performance-panel-theme="performancePanelTheme"
                :performance-panel-compact="performancePanelCompact"
                :show-fps="showFps"
                :show-render-time="showRenderTime"
                :show-drag-time="showDragTime"
                :show-memory-usage="showMemoryUsage"
                :show-element-count="showElementCount"
                :show-total-elements="showTotalElements"
                :show-performance-panel-close-button="
                    showPerformancePanelCloseButton
                "
                :item-height="itemHeight"
                :item-width="itemWidth"
                :buffer="buffer"
                @drag-start="handleDragStart"
                @drag-move="handleDragMove"
                @drag-end="handleDragEnd"
                @resize-start="handleResizeStart"
                @resize-move="handleResizeMove"
                @resize-end="handleResizeEnd"
                @performance-panel-close="handlePerformancePanelClose"
            >
                <template #element-content="{ element }">
                    <slot name="element-content" :element="element">
                        <div class="custom-element-content">
                            <div class="element-title">
                                {{ element.content }}
                            </div>
                            <div class="element-info">
                                {{ element.width }} × {{ element.height }}
                            </div>
                        </div>
                    </slot>
                </template>

                <template #custom-performance-metrics>
                    <slot name="custom-performance-metrics"></slot>
                </template>
            </OptimizedFreeLayoutWorkspace>
        </div>

        <div class="status">
            <span>元素数量: {{ elementCount }}</span>
            <span v-if="isDragging">拖拽中...</span>
            <span v-if="isResizing">调整大小中...</span>
            <span v-if="snapLinesCount > 0">吸附线: {{ snapLinesCount }}</span>
        </div>

        <!-- 性能配置面板 -->
        <div v-if="showConfigPanel" class="config-panel">
            <h3>性能配置</h3>
            <div class="config-items">
                <label>
                    <input type="checkbox" v-model="enableVirtualization" />
                    虚拟化渲染
                </label>
                <label>
                    <input type="checkbox" v-model="enableSpatialGrid" />
                    空间分区
                </label>
                <label>
                    <input type="checkbox" v-model="enableThrottling" />
                    节流优化
                </label>
                <label>
                    <input type="checkbox" v-model="enableMonitoring" />
                    性能监控
                </label>
                <label>
                    <input type="checkbox" v-model="showPerformancePanel" />
                    显示性能面板
                </label>
            </div>

            <!-- 性能面板配置 -->
            <div v-if="showPerformancePanel" class="config-items">
                <h4>性能面板配置</h4>
                <label>
                    位置:
                    <select v-model="performancePanelPosition">
                        <option value="top-right">右上角</option>
                        <option value="top-left">左上角</option>
                        <option value="bottom-right">右下角</option>
                        <option value="bottom-left">左下角</option>
                    </select>
                </label>
                <label>
                    主题:
                    <select v-model="performancePanelTheme">
                        <option value="dark">深色</option>
                        <option value="light">浅色</option>
                    </select>
                </label>
                <label>
                    <input type="checkbox" v-model="performancePanelCompact" />
                    紧凑模式
                </label>
                <label>
                    <input type="checkbox" v-model="showFps" />
                    显示FPS
                </label>
                <label>
                    <input type="checkbox" v-model="showRenderTime" />
                    显示渲染时间
                </label>
                <label>
                    <input type="checkbox" v-model="showDragTime" />
                    显示拖拽时间
                </label>
                <label>
                    <input type="checkbox" v-model="showMemoryUsage" />
                    显示内存使用
                </label>
                <label>
                    <input type="checkbox" v-model="showElementCount" />
                    显示可见元素数
                </label>
                <label>
                    <input type="checkbox" v-model="showTotalElements" />
                    显示总元素数
                </label>
                <label>
                    <input
                        type="checkbox"
                        v-model="showPerformancePanelCloseButton"
                    />
                    显示关闭按钮
                </label>
            </div>

            <div class="config-items">
                <label>
                    虚拟化项目高度:
                    <input
                        type="number"
                        v-model="itemHeight"
                        min="20"
                        max="200"
                        step="10"
                    />
                </label>
                <label>
                    虚拟化项目宽度:
                    <input
                        type="number"
                        v-model="itemWidth"
                        min="50"
                        max="300"
                        step="10"
                    />
                </label>
                <label>
                    缓冲区大小:
                    <input
                        type="number"
                        v-model="buffer"
                        min="1"
                        max="20"
                        step="1"
                    />
                </label>
            </div>
        </div>

        <!-- 导入布局的隐藏文件输入 -->
        <input
            ref="fileInput"
            type="file"
            accept=".json"
            style="display: none"
            @change="handleFileImport"
        />
    </div>
</template>

<script>
import { ref, computed, onMounted, watch } from "vue";
import OptimizedFreeLayoutWorkspace from "./OptimizedFreeLayoutWorkspace.vue";
import { useElementManager } from "../composables/useElementManager";

export default {
    name: "OptimizedFreeLayoutApp",
    components: {
        OptimizedFreeLayoutWorkspace,
    },
    props: {
        title: {
            type: String,
            default: "优化版自由布局Demo",
        },
        initialElements: {
            type: Array,
            default: () => [],
        },
        showGrid: {
            type: Boolean,
            default: true,
        },
        enableResize: {
            type: Boolean,
            default: true,
        },
        resizeHandles: {
            type: Array,
            default: () => ["se"],
        },
        snapDistance: {
            type: Number,
            default: 10,
        },
        enableSnap: {
            type: Boolean,
            default: true,
        },
        enableVirtualization: {
            type: Boolean,
            default: true,
        },
        enableSpatialGrid: {
            type: Boolean,
            default: true,
        },
        enableThrottling: {
            type: Boolean,
            default: true,
        },
        enableMonitoring: {
            type: Boolean,
            default: false,
        },
        showPerformancePanel: {
            type: Boolean,
            default: false,
        },
        performancePanelPosition: {
            type: String,
            default: "top-right",
        },
        performancePanelTheme: {
            type: String,
            default: "dark",
        },
        performancePanelCompact: {
            type: Boolean,
            default: false,
        },
        showFps: {
            type: Boolean,
            default: true,
        },
        showRenderTime: {
            type: Boolean,
            default: true,
        },
        showDragTime: {
            type: Boolean,
            default: true,
        },
        showMemoryUsage: {
            type: Boolean,
            default: true,
        },
        showElementCount: {
            type: Boolean,
            default: true,
        },
        showTotalElements: {
            type: Boolean,
            default: false,
        },
        showPerformancePanelCloseButton: {
            type: Boolean,
            default: false,
        },
        itemHeight: {
            type: Number,
            default: 80,
        },
        itemWidth: {
            type: Number,
            default: 120,
        },
        buffer: {
            type: Number,
            default: 5,
        },
        showConfigPanel: {
            type: Boolean,
            default: false,
        },
    },
    emits: [
        "element-added",
        "element-removed",
        "element-updated",
        "layout-exported",
        "layout-imported",
        "drag-start",
        "drag-move",
        "drag-end",
        "resize-start",
        "resize-move",
        "resize-end",
        "grid-toggled",
        "performance-panel-close",
    ],
    setup(props, { emit }) {
        const fileInput = ref(null);
        const isDragging = ref(false);
        const isResizing = ref(false);
        const snapLinesCount = ref(0);
        const performanceMetrics = ref({
            fps: 0,
            renderTime: 0,
            dragTime: 0,
            memoryUsage: 0,
        });

        // 元素管理
        const {
            elements,
            addElement,
            removeElement,
            updateElement,
            clearElements,
            generateTestElements,
        } = useElementManager({
            initialElements: props.initialElements,
            onElementAdded: (element) => {
                emit("element-added", element);
            },
            onElementRemoved: (element) => {
                emit("element-removed", element);
            },
            onElementUpdated: (element) => {
                emit("element-updated", element);
            },
        });

        // 性能优化配置
        const enableVirtualization = ref(true);
        const enableSpatialGrid = ref(true);
        const enableThrottling = ref(true);
        const enableMonitoring = ref(true);
        const enableComponentPool = ref(true);
        const componentPoolMaxSize = ref(100);
        const showComponentPoolStats = ref(false);

        // 性能面板配置
        const showPerformancePanel = ref(true);
        const performancePanelPosition = ref("top-right");
        const performancePanelTheme = ref("dark");
        const performancePanelCompact = ref(false);
        const showFps = ref(true);
        const showRenderTime = ref(true);
        const showDragTime = ref(true);
        const showMemoryUsage = ref(true);
        const showElementCount = ref(true);
        const showTotalElements = ref(false);
        const showPerformancePanelCloseButton = ref(false);

        // 虚拟化配置
        const itemHeight = ref(80);
        const itemWidth = ref(120);
        const buffer = ref(5);

        // 其他配置
        const showGrid = ref(true);
        const enableResize = ref(true);
        const resizeHandles = ref(["se"]);
        const snapDistance = ref(10);
        const enableSnap = ref(true);
        const enableMultiSelect = ref(true);
        const showConfigPanel = ref(false);

        // 计算属性
        const elementCount = computed(() => elements.value.length);

        // 方法
        const toggleGrid = () => {
            showGrid.value = !showGrid.value;
            emit("grid-toggled", showGrid.value);
        };

        const exportLayoutData = () => {
            const layoutData = {
                elements: elements.value,
                timestamp: Date.now(),
            };
            const dataStr = JSON.stringify(layoutData, null, 2);
            const dataBlob = new Blob([dataStr], { type: "application/json" });
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `layout-${Date.now()}.json`;
            link.click();
            URL.revokeObjectURL(url);
            emit("layout-exported", layoutData);
        };

        const importLayoutData = () => {
            fileInput.value?.click();
        };

        const handleFileImport = (event) => {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const layoutData = JSON.parse(e.target.result);
                        if (
                            layoutData.elements &&
                            Array.isArray(layoutData.elements)
                        ) {
                            clearElements();
                            layoutData.elements.forEach((element) => {
                                addElement(element);
                            });
                            emit("layout-imported", layoutData);
                        }
                    } catch (error) {
                        console.error("导入布局数据失败:", error);
                    }
                };
                reader.readAsText(file);
            }
            // 清空文件输入，允许重复选择同一文件
            event.target.value = "";
        };

        // 处理拖拽开始
        const handleDragStart = (element, event) => {
            isDragging.value = true;
            emit("drag-start", element, event);
        };

        // 处理拖拽移动
        const handleDragMove = (element, event) => {
            emit("drag-move", element, event);
        };

        // 处理拖拽结束
        const handleDragEnd = (element) => {
            isDragging.value = false;
            emit("drag-end", element);
        };

        // 处理调整大小开始
        const handleResizeStart = (element, event, direction) => {
            isResizing.value = true;
            emit("resize-start", element, event, direction);
        };

        // 处理调整大小移动
        const handleResizeMove = (element, event) => {
            emit("resize-move", element, event);
        };

        // 处理调整大小结束
        const handleResizeEnd = (element) => {
            isResizing.value = false;
            emit("resize-end", element);
        };

        // 处理性能面板关闭
        const handlePerformancePanelClose = () => {
            showPerformancePanel.value = false;
            emit("performance-panel-close");
        };

        // 切换配置面板
        const toggleConfigPanel = () => {
            showConfigPanel.value = !showConfigPanel.value;
        };

        // 监听性能指标变化
        watch(
            performanceMetrics,
            (newMetrics) => {
                // 可以在这里添加性能监控逻辑
                if (newMetrics.fps < 30) {
                    console.warn("性能警告: FPS低于30");
                }
            },
            { deep: true },
        );

        // 监听性能配置变化
        watch(
            [
                enableVirtualization,
                enableSpatialGrid,
                enableThrottling,
                enableMonitoring,
                showPerformancePanel,
                performancePanelPosition,
                performancePanelTheme,
                performancePanelCompact,
                showFps,
                showRenderTime,
                showDragTime,
                showMemoryUsage,
                showElementCount,
                showTotalElements,
                showPerformancePanelCloseButton,
            ],
            () => {
                // 当性能配置发生变化时，可以在这里添加相应的逻辑
                console.log("性能配置已更新");
            },
        );

        // 初始化
        onMounted(() => {
            // 如果没有初始元素，添加一些默认元素
            if (elements.value.length === 0) {
                addElement();
                addElement();
                addElement();
            }
        });

        return {
            // 元素管理
            elements,
            addElement,
            removeElement,
            updateElement,
            clearElements,
            generateTestElements, // 确保这个方法被返回
            elementCount,

            // 性能优化配置
            enableVirtualization,
            enableSpatialGrid,
            enableThrottling,
            enableMonitoring,
            enableComponentPool,
            componentPoolMaxSize,
            showComponentPoolStats,

            // 性能面板配置
            showPerformancePanel,
            performancePanelPosition,
            performancePanelTheme,
            performancePanelCompact,
            showFps,
            showRenderTime,
            showDragTime,
            showMemoryUsage,
            showElementCount,
            showTotalElements,
            showPerformancePanelCloseButton,

            // 虚拟化配置
            itemHeight,
            itemWidth,
            buffer,

            // 其他配置
            showGrid,
            enableResize,
            resizeHandles,
            snapDistance,
            enableSnap,
            enableMultiSelect,
            showConfigPanel,

            // 状态
            isDragging,
            isResizing,
            snapLinesCount,
            performanceMetrics,

            // 方法
            toggleGrid,
            exportLayoutData,
            importLayoutData,
            handleFileImport,
            handleDragStart,
            handleDragMove,
            handleDragEnd,
            handleResizeStart,
            handleResizeMove,
            handleResizeEnd,
            handlePerformancePanelClose,
            toggleConfigPanel,

            // 模板引用
            fileInput,
        };
    },
};
</script>

<style lang="less" scoped>
.optimized-free-layout-app {
    height: 100vh;
    display: flex;
    flex-direction: column;
    background: #f5f5f5;

    .header {
        padding: 20px;
        background: #fff;
        border-bottom: 1px solid #e0e0e0;
        display: flex;
        justify-content: space-between;
        align-items: center;

        h1 {
            margin: 0;
            color: #333;
        }

        .controls {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;

            button {
                padding: 8px 16px;
                border: 1px solid #ddd;
                background: #fff;
                border-radius: 4px;
                cursor: pointer;
                transition: all 0.2s;
                font-size: 14px;

                &:hover {
                    background: #f0f0f0;
                    border-color: #ccc;
                }

                &.test-btn {
                    background: #4ecdc4;
                    color: #fff;
                    border-color: #4ecdc4;

                    &:hover {
                        background: #45b7aa;
                        border-color: #45b7aa;
                    }
                }

                &.config-btn {
                    background: #ff6b6b;
                    color: #fff;
                    border-color: #ff6b6b;

                    &:hover {
                        background: #ff5252;
                        border-color: #ff5252;
                    }
                }
            }
        }
    }

    .workspace-container {
        flex: 1;
        position: relative;
    }

    .status {
        padding: 10px 20px;
        background: #fff;
        border-top: 1px solid #e0e0e0;
        display: flex;
        gap: 20px;
        font-size: 14px;
        color: #666;
        flex-wrap: wrap;
    }

    .config-panel {
        position: absolute;
        top: 20px;
        left: 20px;
        background: rgba(255, 255, 255, 0.95);
        border: 1px solid #ddd;
        border-radius: 8px;
        padding: 20px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        z-index: 1000;
        max-width: 300px;

        h3 {
            margin: 0 0 15px 0;
            color: #333;
            font-size: 16px;
        }

        .config-items {
            display: flex;
            flex-direction: column;
            gap: 10px;
            margin-bottom: 15px;

            label {
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 14px;
                color: #666;

                input[type="checkbox"] {
                    margin: 0;
                }

                input[type="number"] {
                    width: 60px;
                    padding: 4px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    margin-left: auto;
                }
            }
        }
    }

    .custom-element-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        color: #fff;

        .element-title {
            font-weight: 600;
            font-size: 14px;
            margin-bottom: 4px;
        }

        .element-info {
            font-size: 12px;
            opacity: 0.8;
        }
    }
}
</style>
