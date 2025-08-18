<template>
    <div
        class="optimized-free-layout-workspace"
        @scroll="handleScroll"
        ref="containerRef"
        @mousedown="handleWorkspaceMouseDown"
        @mousemove="handleMouseMove"
        @mouseup="handleWorkspaceMouseUp"
        @mouseleave="handleMouseLeave"
        @click="handleWorkspaceClick"
    >
        <!-- 网格背景 -->
        <div class="grid" v-if="showGrid"></div>

        <!-- 虚拟化渲染的可拖拽元素 -->
        <div class="virtualized-container" :style="containerStyle">
            <DraggableElement
                v-for="element in displayElements"
                :key="element.id"
                :element="element"
                :is-dragging="element.id === draggingId"
                :is-resizing="element.id === resizingId"
                :is-selected="isElementSelected(element.id)"
                :is-in-group="isElementInGroup(element.id)"
                :enable-resize="enableResize"
                :resize-handles="resizeHandles"
                @mousedown="handleElementMouseDown"
                @click="handleElementClick"
                @resize-start="handleResizeStart"
                @contextmenu="handleElementContextMenu"
            >
                <template #default="{ element }">
                    <slot name="element-content" :element="element">
                        {{ element.content }}
                    </slot>
                </template>
            </DraggableElement>
        </div>

        <!-- 组合边框 -->
        <GroupBorder
            v-for="[groupId, groupElements] in elementGroups"
            :key="`group-${groupId}`"
            :visible="true"
            :bounds="getGroupBoundsForDisplay(groupId)"
            :element-count="groupElements.length"
            @mousedown="handleGroupMouseDown"
            @resize-start="handleGroupResizeStart"
        />

        <!-- 选择框 -->
        <SelectionBox
            :visible="selectionBox.visible"
            :start-x="selectionBox.startX"
            :start-y="selectionBox.startY"
            :end-x="selectionBox.endX"
            :end-y="selectionBox.endY"
        />

        <!-- 吸附线 -->
        <div class="snap-lines" v-if="snapLines.length">
            <div
                v-for="line in snapLines"
                :key="line.id"
                :class="['snap-line', line.type]"
                :style="getSnapLineStyle(line)"
            ></div>
        </div>

        <!-- 右键菜单 -->
        <ContextMenu
            :visible="contextMenu.visible"
            :x="contextMenu.x"
            :y="contextMenu.y"
            :target-elements="contextMenu.targetElements"
            :can-group="canGroupSelectedElements"
            :can-ungroup="canUngroupSelectedElements"
            @group="handleGroupElements"
            @ungroup="handleUngroupElements"
            @delete="handleDeleteElements"
            @close="hideContextMenu"
        />

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
import GroupBorder from "./GroupBorder.vue";
import SelectionBox from "./SelectionBox.vue";
import ContextMenu from "./ContextMenu.vue";
import { useDraggable } from "../composables/useDraggable";
import { useMultiSelect } from "../composables/useMultiSelect";
import { usePerformanceOptimization } from "../composables/usePerformanceOptimization";
import { useGroupManager } from "../composables/useGroupManager";

export default {
    name: "OptimizedFreeLayoutWorkspace",
    components: {
        DraggableElement,
        PerformancePanel,
        GroupBorder,
        SelectionBox,
        ContextMenu,
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
        "group-elements",
        "ungroup-elements",
        "delete-elements",
    ],
    setup(props, { emit }) {
        const containerRef = ref(null);
        const elementsRef = ref(props.elements);
        // 性能监控面板配置
        const performancePanelPosition = ref(props.performancePanelPosition || 'top-right');
        const performancePanelTheme = ref(props.performancePanelTheme || 'light');
        const performancePanelCompact = ref(props.performancePanelCompact || false);
        const showFps = ref(props.showFps !== false);
        const showRenderTime = ref(props.showRenderTime !== false);
        const showDragTime = ref(props.showDragTime !== false);
        const showMemoryUsage = ref(props.showMemoryUsage !== false);
        const showElementCount = ref(props.showElementCount !== false);
        const showTotalElements = ref(props.showTotalElements !== false);
        const showPerformancePanelCloseButton = ref(props.showPerformancePanelCloseButton !== false);

        const handlePerformancePanelClose = () => {
            emit('performance-panel-close');
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

        // 使用组合管理器
        const {
            selectedElementIds,
            groups,
            elementGroups,
            selectionBox: groupSelectionBox,
            contextMenu: groupContextMenu,
            shouldShowGroupOptions,
            selectElement,
            clearSelection,
            startSelectionBox: startGroupSelectionBox,
            updateSelectionBox: updateGroupSelectionBox,
            endSelectionBox: endGroupSelectionBox,
            groupSelectedElements,
            ungroupElements,
            ungroupSelectedGroups,
            getGroupBounds,
            moveGroup,
            resizeGroup,
            isElementInGroup,
            getElementGroup,
            showContextMenu: showGroupContextMenu,
            hideContextMenu: hideGroupContextMenu
        } = useGroupManager(elementsRef);

        // 右键菜单状态
        const contextMenu = ref({
            visible: false,
            x: 0,
            y: 0,
            targetElements: [],
        });

        const showContextMenu = (event, elements) => {
            event.preventDefault();
            contextMenu.value.visible = true;
            contextMenu.value.x = event.clientX;
            contextMenu.value.y = event.clientY;
            contextMenu.value.targetElements = elements;
        };

        const hideContextMenu = () => {
            contextMenu.value.visible = false;
            contextMenu.value.targetElements = [];
        };

        const handleGroupElements = () => {
            const groupId = groupSelectedElements();
            if (groupId) {
                console.log('组合成功，组合ID:', groupId);
            }
            hideContextMenu();
        };

        const handleUngroupElements = () => {
            ungroupSelectedGroups();
            console.log('解组成功');
            hideContextMenu();
        };

        const handleDeleteElements = (elementIds) => {
            // 实现删除逻辑
            console.log('删除选中的元素:', elementIds);
            hideContextMenu();
        };

        // 选择框状态
        const selectionBox = ref({
            visible: false,
            startX: 0,
            startY: 0,
            endX: 0,
            endY: 0,
        });

        const startSelectionBox = (event) => {
            const rect = containerRef.value.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            
            selectionBox.value.visible = true;
            selectionBox.value.startX = x;
            selectionBox.value.startY = y;
            selectionBox.value.endX = x;
            selectionBox.value.endY = y;
            
            // 清空当前选择
            clearSelection();
        };

        const updateSelectionBox = (event) => {
            if (selectionBox.value.visible) {
                const rect = containerRef.value.getBoundingClientRect();
                const x = event.clientX - rect.left;
                const y = event.clientY - rect.top;
                
                selectionBox.value.endX = x;
                selectionBox.value.endY = y;
            }
        };

        const endSelectionBox = () => {
            if (selectionBox.value.visible) {
                // 计算选择框范围
                const left = Math.min(selectionBox.value.startX, selectionBox.value.endX);
                const right = Math.max(selectionBox.value.startX, selectionBox.value.endX);
                const top = Math.min(selectionBox.value.startY, selectionBox.value.endY);
                const bottom = Math.max(selectionBox.value.startY, selectionBox.value.endY);
                
                // 选择完全被选择框覆盖的组件
                elementsRef.value.forEach(element => {
                    const elementLeft = element.x;
                    const elementRight = element.x + element.width;
                    const elementTop = element.y;
                    const elementBottom = element.y + element.height;
                    
                    // 检查组件是否完全被选择框覆盖
                    // 只有当组件的所有边界都在选择框内部时，才认为被完全覆盖
                    if (elementLeft >= left && elementRight <= right && 
                        elementTop >= top && elementBottom <= bottom) {
                        selectElement(element.id, true);
                    }
                });
                
                selectionBox.value.visible = false;
            }
        };

        const handleWorkspaceMouseDown = (event) => {
            // 检查是否点击在空白区域
            if (event.target === containerRef.value || event.target.classList.contains('grid')) {
                startSelectionBox(event);
            }
        };

        const handleWorkspaceMouseUp = (event) => {
            endSelectionBox();
        };

        const handleElementMouseDown = (event, element) => {
            // 检查是否在组合中
            const groupId = isElementInGroup(element.id);
            if (groupId) {
                // 如果点击的是组合中的元素，选择整个组合
                const group = getElementGroup(element.id);
                if (group) {
                    group.elements.forEach(el => {
                        selectElement(el.id, true);
                    });
                }
            } else {
                // 如果元素未被选中，先选中它
                if (!selectedElementIds.value.has(element.id)) {
                    selectElement(element.id, false);
                }
            }
            
            startDrag(event, element, containerRef.value);
        };

        const handleElementContextMenu = (event, element) => {
            // 如果当前元素未被选中，先选中它
            if (!selectedElementIds.value.has(element.id)) {
                selectElement(element.id, false);
            }
            
            const targetElements = Array.from(selectedElementIds.value).map(id =>
                elementsRef.value.find(el => el.id === id)
            ).filter(Boolean);
            
            showContextMenu(event, targetElements);
        };

        const handleGroupMouseDown = (event) => {
            // 处理组合拖拽
            const groupId = getGroupIdFromEvent(event);
            if (groupId) {
                // 开始拖拽组合
                startGroupDrag(event, groupId);
            }
        };

        const handleGroupResizeStart = (event, handle) => {
            const groupId = getGroupIdFromEvent(event);
            if (groupId) {
                startGroupResize(event, groupId, handle);
            }
        };

        // 从事件中获取组合ID
        const getGroupIdFromEvent = (event) => {
            const groupBorder = event.target.closest('.group-border');
            if (groupBorder) {
                // 从DOM属性或数据中获取组合ID
                return parseInt(groupBorder.dataset.groupId);
            }
            return null;
        };

        // 开始组合拖拽
        const startGroupDrag = (event, groupId) => {
            // 实现组合拖拽逻辑
            console.log('开始拖拽组合:', groupId);
        };

        // 开始组合调整大小
        const startGroupResize = (event, groupId, handle) => {
            // 实现组合调整大小逻辑
            console.log('开始调整组合大小:', groupId, handle);
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

        // 检查元素是否被选中
        const isElementSelected = (elementId) => {
            return selectedElementIds.value.has(elementId);
        };

        // 获取组合边界
        const getGroupBoundsForDisplay = (groupId) => {
            return getGroupBounds(groupId);
        };

        // 检查是否可以组合选中的元素
        const canGroupSelectedElements = computed(() => {
            return selectedElementIds.value.size >= 2;
        });

        // 检查是否可以解组选中的元素
        const canUngroupSelectedElements = computed(() => {
            let hasGroupedElements = false;
            selectedElementIds.value.forEach(elementId => {
                if (isElementInGroup(elementId)) {
                    hasGroupedElements = true;
                }
            });
            return hasGroupedElements;
        });

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
            showPerformancePanel: props.showPerformancePanel,
            elements: elementsRef,
            itemHeight: props.itemHeight,
            itemWidth: props.itemWidth,
            buffer: props.buffer,
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

        // 使用拖拽hook
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

        // 处理元素点击
        const handleElementClick = (event, element) => {
            // 如果当前元素未被选中，先选中它
            if (!selectedElementIds.value.has(element.id)) {
                selectElement(element.id, false);
            }
        };

        // 处理工作空间点击（清除选择）
        const handleWorkspaceClick = (event) => {
            // 点击空白区域时清空选择
            if (!draggingId.value && !resizingId.value) {
                clearSelection();
            }
        };

        return {
            // 基础引用
            containerRef,
            
            // 拖拽状态
            draggingId,
            resizingId,
            snapLines,
            mousePos,
            
            // 组合功能
            selectedElementIds,
            groups,
            elementGroups,
            selectionBox,
            contextMenu,
            canGroupSelectedElements,
            canUngroupSelectedElements,
            
            // 性能优化
            visibleItems,
            displayElements,
            containerStyle,
            performanceMetrics,
            
            // 多选功能
            multiSelect: props.enableMultiSelect ? multiSelect : null,
            getSelectedCount: props.enableMultiSelect ? multiSelect.getSelectedCount : () => 0,
            
            // 事件处理
            handleElementClick,
            handleElementMouseDown,
            handleElementContextMenu,
            handleResizeStart,
            handleWorkspaceClick,
            handleWorkspaceMouseDown,
            handleWorkspaceMouseUp,
            handleGroupMouseDown,
            handleGroupResizeStart,
            handleScroll,
            handleMouseMove,
            handleMouseLeave,
            
            // 组合操作
            handleGroupElements,
            handleUngroupElements,
            handleDeleteElements,
            showContextMenu,
            hideContextMenu,
            
            // 选择框操作
            startSelectionBox,
            updateSelectionBox,
            endSelectionBox,
            
            // 工具函数
            getSnapLineStyle,
            isElementSelected,
            isElementInGroup,
            getGroupBoundsForDisplay,
            
            // 性能监控面板
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
            handlePerformancePanelClose,
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
