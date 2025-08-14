<template>
    <div
        class="optimized-free-layout-workspace"
        @scroll="handleScroll"
        ref="containerRef"
        @mousemove="handleMouseMove"
        @mouseleave="handleMouseLeave"
        @click="handleWorkspaceClick"
    >
        <!-- 网格背景 -->
        <div class="grid" v-if="showGrid"></div>

        <!-- 吸附线 -->
        <div class="snap-lines" v-if="snapLines.length">
            <div
                v-for="line in snapLines"
                :key="line.id"
                :class="['snap-line', line.type]"
                :style="getSnapLineStyle(line)"
            ></div>
        </div>

        <!-- 虚拟化渲染的可拖拽元素 -->
        <div class="virtualized-container" :style="containerStyle">
            <DraggableElement
                v-for="element in displayElements"
                :key="element.id"
                :element="element"
                :is-dragging="element.id === draggingId"
                :is-resizing="element.id === resizingId"
                :is-selected="isElementSelected(element.id)"
                :enable-resize="enableResize"
                :resize-handles="resizeHandles"
                @mousedown="handleElementMouseDown"
                @click="handleElementClick"
                @resize-start="handleResizeStart"
            >
                <template #default="{ element }">
                    <slot name="element-content" :element="element">
                        {{ element.content }}
                    </slot>
                </template>
            </DraggableElement>
        </div>

        <!-- 性能监控面板 -->
        <PerformancePanel
            v-if="showPerformancePanel"
            :visible="showPerformancePanel"
            :metrics="performanceMetrics"
            :element-count="displayElements.length"
            :total-elements="elements.length"
            :position="performancePanelPosition"
            :theme="performancePanelTheme"
            :compact="performancePanelCompact"
            :show-fps="showFps"
            :show-render-time="showRenderTime"
            :show-drag-time="showDragTime"
            :show-memory-usage="showMemoryUsage"
            :show-element-count="showElementCount"
            :show-total-elements="showTotalElements"
            :show-close-button="showPerformancePanelCloseButton"
            @close="handlePerformancePanelClose"
        >
            <template #custom-metrics>
                <slot name="custom-performance-metrics"></slot>
            </template>
        </PerformancePanel>
    </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import DraggableElement from "./DraggableElement.vue";
import PerformancePanel from "./PerformancePanel.vue";
import { useDraggable } from "../composables/useDraggable";
import { useMultiSelect } from "../composables/useMultiSelect";
import { usePerformanceOptimization } from "../composables/usePerformanceOptimization";

export default {
    name: "OptimizedFreeLayoutWorkspace",
    components: {
        DraggableElement,
        PerformancePanel,
    },
    props: {
        elements: {
            type: Array,
            required: true,
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
            default: () => ["n", "ne", "e", "se", "s", "sw", "w", "nw"],
        },
        snapDistance: {
            type: Number,
            default: 10,
        },
        enableSnap: {
            type: Boolean,
            default: true,
        },
        // 性能优化选项
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
            default: true,
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
        enableMultiSelect: {
            type: Boolean,
            default: true,
        },
    },
    emits: [
        "update:elements",
        "drag-start",
        "drag-move",
        "drag-end",
        "resize-start",
        "resize-move",
        "resize-end",
        "selection-change",
        "multi-drag-start",
        "multi-drag-move",
        "multi-drag-end",
    ],
    setup(props, { emit }) {
        const containerRef = ref(null);
        const elementsRef = ref(props.elements);
        const performancePanelPosition = ref(props.performancePanelPosition);
        const performancePanelTheme = ref(props.performancePanelTheme);
        const performancePanelCompact = ref(props.performancePanelCompact);
        const showFps = ref(props.showFps);
        const showRenderTime = ref(props.showRenderTime);
        const showDragTime = ref(props.showDragTime);
        const showMemoryUsage = ref(props.showMemoryUsage);
        const showElementCount = ref(props.showElementCount);
        const showTotalElements = ref(props.showTotalElements);
        const showPerformancePanelCloseButton = ref(
            props.showPerformancePanelCloseButton,
        );
        const handlePerformancePanelClose = () => {
            emit("performance-panel-close");
        };

        // 使用多选功能
        const multiSelect = useMultiSelect({
            elements: elementsRef,
            onSelectionChange: (selectedIds) => {
                emit("selection-change", selectedIds);
            },
            onMultiDragStart: (elements, event) => {
                emit("multi-drag-start", elements, event);
            },
            onMultiDragMove: (elements, event) => {
                emit("multi-drag-move", elements, event);
            },
            onMultiDragEnd: (elements) => {
                emit("multi-drag-end", elements);
            },
        });

        // 使用性能优化hook
        const {
            visibleItems,
            calculateVisibleItems,
            handleScroll: handleVirtualScroll,
            startFrame,
            endFrame,
            getPerformanceMetrics,
            updateSpatialGrid,
            getNearbyElements,
            throttledHandleDrag,
            measureDrag,
        } = usePerformanceOptimization({
            enableVirtualization: props.enableVirtualization,
            enableSpatialGrid: props.enableSpatialGrid,
            enableThrottling: props.enableThrottling,
            enableMonitoring: props.enableMonitoring,
            showPerformancePanel: props.showPerformancePanel, // 新增：传递性能面板显示选项
            elements: elementsRef,
            itemHeight: props.itemHeight,
            itemWidth: props.itemWidth,
            buffer: props.buffer,
        });

        // 使用拖拽hook - 传递多选功能
        const {
            draggingId,
            resizingId,
            snapLines,
            mousePos,
            startDrag,
            startResize,
            handleMouseMove,
            handleMouseLeave,
        } = useDraggable({
            elements: elementsRef,
            workspaceRef: containerRef,
            snapDistance: props.snapDistance,
            enableSnap: props.enableSnap,
            measureDrag: measureDrag,
            multiSelect: props.enableMultiSelect ? multiSelect : null,
            onDragStart: (element, event) => {
                emit("drag-start", element, event);
            },
            onDragMove: (element, event) => {
                emit("drag-move", element, event);
            },
            onDragEnd: (element) => {
                emit("drag-end", element);
            },
            onResizeStart: (element, event, direction) => {
                emit("resize-start", element, event, direction);
            },
            onResizeMove: (element, event) => {
                emit("resize-move", element, event);
            },
            onResizeEnd: (element) => {
                emit("resize-end", element);
            },
        });

        // 性能监控
        const performanceMetrics = ref({
            fps: 0,
            renderTime: 0,
            dragTime: 0,
            memoryUsage: 0,
        });

        // 更新性能指标
        const updatePerformanceMetrics = () => {
            if (props.showPerformancePanel || props.enableMonitoring) {
                const metrics = getPerformanceMetrics();
                performanceMetrics.value = {
                    fps: metrics.fps || 0,
                    renderTime: metrics.renderTime || 0,
                    dragTime: metrics.dragTime || 0,
                    memoryUsage: metrics.memoryUsage || 0,
                };
            }
        };

        // 处理滚动
        const handleScroll = (event) => {
            if (props.enableVirtualization) {
                handleVirtualScroll(event);
            }
        };

        // 处理元素鼠标按下
        const handleElementMouseDown = (event, element) => {
            startDrag(event, element, containerRef.value);
        };

        // 处理调整大小开始
        const handleResizeStart = (event, element, position) => {
            startResize(event, element, position);
        };

        // 获取吸附线样式
        const getSnapLineStyle = (line) => {
            const baseStyle = {
                position: "absolute",
                pointerEvents: "none",
                zIndex: 1000,
            };

            if (line.type === "horizontal") {
                return {
                    ...baseStyle,
                    top: `${line.y}px`,
                    left: `${line.x1}px`,
                    width: `${line.x2 - line.x1}px`,
                    height: line.style === "center" ? "2px" : "1px",
                    background: line.style === "center" ? "#4ecdc4" : "#ff6b6b",
                    opacity: line.style === "center" ? "0.9" : "0.8",
                };
            } else if (line.type === "vertical") {
                return {
                    ...baseStyle,
                    left: `${line.x}px`,
                    top: `${line.y1}px`,
                    width: line.style === "center" ? "2px" : "1px",
                    height: `${line.y2 - line.y1}px`,
                    background: line.style === "center" ? "#4ecdc4" : "#ff6b6b",
                    opacity: line.style === "center" ? "0.9" : "0.8",
                };
            } else if (line.type === "width-match" || line.type === "height-match") {
                return {
                    ...baseStyle,
                    left: `${line.x}px`,
                    top: `${line.y}px`,
                    width: "20px",
                    height: "20px",
                    background: "#ffd93d",
                    borderRadius: "50%",
                    opacity: "0.9",
                    transform: "translate(-50%, -50%)",
                };
            }

            return baseStyle;
        };

        // 容器样式
        const containerStyle = computed(() => {
            if (props.enableVirtualization && props.elements.length > 0) {
                const totalHeight = Math.max(
                    ...props.elements.map(
                        (el) => (el.y || 0) + (el.height || 0),
                    ),
                    1000,
                );

                // 限制最大宽度为窗口宽度
                const windowWidth = window.innerWidth || 1200;
                const maxElementX = Math.max(
                    ...props.elements.map(
                        (el) => (el.x || 0) + (el.width || 0),
                    ),
                    0,
                );
                const totalWidth = Math.min(
                    Math.max(maxElementX, windowWidth),
                    windowWidth,
                );

                return {
                    height: `${totalHeight}px`,
                    width: `${totalWidth}px`,
                    position: "relative",
                };
            }
            return {};
        });

        // 计算要显示的元素
        const displayElements = computed(() => {
            if (!props.enableVirtualization) {
                return props.elements;
            }
            // 如果虚拟化启用但visibleItems为空，回退到显示所有元素
            if (!visibleItems.value || visibleItems.value.length === 0) {
                return props.elements;
            }
            return visibleItems.value;
        });

        // 监听元素变化
        watch(
            () => props.elements,
            (newElements) => {
                elementsRef.value = newElements;
                if (props.enableSpatialGrid) {
                    updateSpatialGrid(newElements);
                }
                if (props.enableVirtualization) {
                    calculateVisibleItems();
                }
            },
            { deep: true, immediate: true },
        );

        // 渲染循环
        let animationFrameId;
        const renderLoop = () => {
            startFrame();

            // 渲染逻辑
            if (props.enableVirtualization) {
                calculateVisibleItems();
            }

            endFrame();
            updatePerformanceMetrics();

            animationFrameId = requestAnimationFrame(renderLoop);
        };

        onMounted(() => {
            if (props.enableVirtualization) {
                calculateVisibleItems();
            }
            if (props.enableSpatialGrid) {
                updateSpatialGrid(props.elements);
            }
            // 如果显示性能面板或启用监控，启动渲染循环
            if (props.showPerformancePanel || props.enableMonitoring) {
                renderLoop();
            }
        });

        onUnmounted(() => {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
        });

        // 处理元素点击 - 只在按住 Command 键时才选中
        const handleElementClick = (event, element) => {
            if (props.enableMultiSelect) {
                // 只有在按住 Command 键时才进行多选操作
                if (multiSelect.isCommandPressed(event)) {
                    multiSelect.selectElement(element.id, event);
                } else {
                    // 普通点击只选择当前元素，清除其他选择
                    multiSelect.clearSelection();
                    multiSelect.selectElement(element.id, event);
                }
            }
        };

        // 处理工作空间点击（清除选择）
        const handleWorkspaceClick = (event) => {
            if (
                props.enableMultiSelect &&
                event.target === event.currentTarget
            ) {
                multiSelect.clearSelection();
            }
        };

        // 检查元素是否被选中
        const isElementSelected = (elementId) => {
            return props.enableMultiSelect
                ? multiSelect.isElementSelected(elementId)
                : false;
        };

        return {
            containerRef,
            draggingId,
            resizingId,
            snapLines,
            mousePos,
            visibleItems,
            displayElements,
            performanceMetrics,
            performancePanelPosition,
            performancePanelTheme,
            performancePanelCompact,
            handleScroll,
            handleElementMouseDown,
            handleResizeStart,
            handleMouseMove: (event) =>
                handleMouseMove(event, containerRef.value),
            handleMouseLeave,
            getSnapLineStyle,
            containerStyle,
            showFps,
            showRenderTime,
            showDragTime,
            showMemoryUsage,
            showElementCount,
            showTotalElements,
            showPerformancePanelCloseButton,
            handlePerformancePanelClose,
            isElementSelected,
            getSelectedCount: multiSelect.getSelectedCount,
            handleElementClick,
        };
    },
};
</script>

<style lang="less" scoped>
.optimized-free-layout-workspace {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: auto;
    background: #fff;

    .grid {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-image: linear-gradient(
                rgba(0, 0, 0, 0.1) 1px,
                transparent 1px
            ),
            linear-gradient(90deg, rgba(0, 0, 0, 0.1) 1px, transparent 1px);
        background-size: 20px 20px;
        pointer-events: none;
        z-index: 1;
    }

    .snap-lines {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        pointer-events: none;
        z-index: 10;

        .snap-line {
            position: absolute;
            background: #ff6b6b;
            opacity: 0.8;

            &.horizontal {
                height: 2px;
                margin-top: -1px;
            }

            &.vertical {
                width: 2px;
                margin-left: -1px;
            }
        }
    }

    .virtualized-container {
        position: relative;
        z-index: 2;
    }

    .performance-panel {
        position: absolute;
        top: 10px;
        right: 10px;
        background: rgba(0, 0, 0, 0.8);
        color: #fff;
        padding: 12px;
        border-radius: 6px;
        font-size: 12px;
        z-index: 1000;
        min-width: 150px;
        backdrop-filter: blur(4px);

        .performance-metrics {
            display: flex;
            flex-direction: column;
            gap: 6px;

            span {
                white-space: nowrap;
                font-family: "Courier New", monospace;
                font-weight: 500;

                &:first-child {
                    font-weight: bold;
                    color: #4ecdc4;
                }
            }
        }
    }
}
</style>
