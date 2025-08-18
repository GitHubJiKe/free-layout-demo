<template>
    <div
        ref="workspaceRef"
        class="free-layout-workspace"
        @mousedown="handleWorkspaceMouseDown"
        @mousemove="handleMouseMove"
        @mouseup="handleWorkspaceMouseUp"
        @mouseleave="handleMouseLeave"
        @click="handleWorkspaceClick"
        @contextmenu="showWorkspaceContextMenu"
        tabindex="0"
    >
        <!-- 网格背景 -->
        <div v-if="showGrid" class="grid"></div>

        <!-- 可拖拽元素 -->
        <DraggableElement
            v-for="element in elements"
            :key="element.id"
            :element="element"
            :is-dragging="draggingId === element.id"
            :is-resizing="resizingId === element.id"
            :is-selected="isElementSelected(element.id)"
            :is-in-group="isElementInGroup(element.id)"
            :enable-resize="enableResize"
            :resize-handles="resizeHandles"
            @mousedown="handleElementMouseDown"
            @click="handleElementClick"
            @resize-start="handleResizeStart"
            @contextmenu="handleElementContextMenu"
        />

        <!-- 组合边框 -->
        <GroupBorder
            v-for="[groupId, groupElements] in elementGroups"
            :key="`group-${groupId}`"
            :visible="true"
            :bounds="getGroupBoundsForDisplay(groupId)"
            :element-count="groupElements.length"
            :group-id="groupId"
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
        <div class="snap-lines">
            <div
                v-for="line in snapLines"
                :key="line.id"
                class="snap-line"
                :class="line.type"
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
        
        <!-- 工作空间右键菜单 -->
        <ContextMenu
            v-if="workspaceContextMenu.visible"
            :visible="workspaceContextMenu.visible"
            :x="workspaceContextMenu.x"
            :y="workspaceContextMenu.y"
            :target-elements="workspaceContextMenu.targetElements"
            :can-group="canGroupSelectedElements"
            :can-ungroup="false"
            @group="handleGroupElements"
            @delete="handleDeleteElements"
            @close="hideWorkspaceContextMenu"
        />
    </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, reactive } from "vue";
import DraggableElement from "./DraggableElement.vue";
import GroupBorder from "./GroupBorder.vue";
import ContextMenu from "./ContextMenu.vue";
import SelectionBox from "./SelectionBox.vue";
import { useDraggable } from "../composables/useDraggable";
import { useGroupManager } from "../composables/useGroupManager";
export default {
    name: "FreeLayoutWorkspace",
    components: {
        DraggableElement,
        GroupBorder,
        ContextMenu,
        SelectionBox,
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
        onDragStart: Function,
        onDragMove: Function,
        onDragEnd: Function,
        onResizeStart: Function,
        onResizeMove: Function,
        onResizeEnd: Function,
    },
    emits: [
        "update:elements",
        "drag-start",
        "drag-move",
        "drag-end",
        "resize-start",
        "resize-move",
        "resize-end",
    ],
    setup(props, { emit }) {
        const workspaceRef = ref(null);
        const elementsRef = computed(() => props.elements);

        // 使用组合管理器
        const {
            selectedElementIds,
            groups,
            elementGroups,
            selectionBox,
            contextMenu,
            shouldShowGroupOptions,
            selectElement,
            clearSelection,
            startSelectionBox,
            updateSelectionBox,
            endSelectionBox,
            groupSelectedElements,
            ungroupElements,
            ungroupSelectedGroups,
            getGroupBounds,
            moveGroup,
            resizeGroup,
            isElementInGroup,
            getElementGroup,
            showContextMenu,
            hideContextMenu
        } = useGroupManager(elementsRef);
        
        // 工作空间右键菜单状态
        const workspaceContextMenu = reactive({
            visible: false,
            x: 0,
            y: 0,
            targetElements: []
        });

        // 组合拖拽状态
        const groupDragState = ref(null);
        const groupResizeState = ref(null);
        
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
            workspaceRef: computed(() => workspaceRef.value),
            snapDistance: props.snapDistance,
            enableSnap: props.enableSnap,
            enableResize: props.enableResize,
            onDragStart: (element, event) => {
                emit("drag-start", element, event);
                props.onDragStart?.(element, event);
            },
            onDragMove: (element, event) => {
                emit("drag-move", element, event);
                props.onDragMove?.(element, event);
            },
            onDragEnd: (element) => {
                emit("drag-end", element);
                props.onDragEnd?.(element);
            },
            onResizeStart: (element, event, direction) => {
                emit("resize-start", element, event, direction);
                props.onResizeStart?.(element, event, direction);
            },
            onResizeMove: (element, event) => {
                emit("resize-move", element, event);
                props.onResizeMove?.(element, event);
            },
            onResizeEnd: (element) => {
                emit("resize-end", element);
                props.onResizeEnd?.(element);
            },
        });

        // 工作空间鼠标事件处理
        const handleWorkspaceMouseDown = (event) => {
            // 检查是否点击在空白区域
            if (event.target === workspaceRef.value || event.target.classList.contains('grid')) {
                // 开始框选
                const rect = workspaceRef.value.getBoundingClientRect();
                const x = event.clientX - rect.left;
                const y = event.clientY - rect.top;
                startSelectionBox(x, y);
                
                // 清空当前选择
                clearSelection();
                
                // 设置全局框选更新函数
                window.selectionBoxUpdate = (x, y) => {
                    updateSelectionBox(x, y);
                };
            }
        };

        const handleWorkspaceMouseUp = (event) => {
            // 结束框选
            if (selectionBox.visible) {
                endSelectionBox();
                
                // 清理全局框选更新函数
                if (window.selectionBoxUpdate) {
                    delete window.selectionBoxUpdate;
                }
            }
        };

        // 工作空间点击事件
        const handleWorkspaceClick = (event) => {
            // 只有点击工作空间本身或网格时才清空选择
            if (event.target === workspaceRef.value || event.target.classList.contains('grid')) {
                // 点击空白区域时清空选择，但保留框选后的选择
                if (!draggingId.value && !resizingId.value && selectedElementIds.value.size === 0) {
                    clearSelection();
                }
            }
        };

        // 元素点击事件
        const handleElementClick = (event, element) => {
            console.log('元素点击事件:', element.id, element.content);
            // 如果当前元素未被选中，先选中它
            if (!selectedElementIds.value.has(element.id)) {
                selectElement(element.id, false);
                console.log('选中元素:', element.id);
            }
        };

        // 元素鼠标按下事件
        const handleElementMouseDown = (event, element) => {
            console.log('元素鼠标按下事件:', element.id, element.content);
            
            // 检查是否在组合中
            const groupId = isElementInGroup(element.id);
            if (groupId) {
                console.log('元素在组合中:', groupId);
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
                    console.log('选中元素:', element.id);
                }
            }
            
            console.log('开始拖拽元素:', element.id);
            startDrag(event, element, workspaceRef.value);
        };

        // 元素右键菜单事件
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

        // 组合鼠标按下事件
        const handleGroupMouseDown = (event) => {
            // 处理组合拖拽
            const groupId = getGroupIdFromEvent(event);
            if (groupId) {
                // 开始拖拽组合
                startGroupDrag(event, groupId);
            }
        };

        // 组合调整大小事件
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
                const groupId = groupBorder.dataset.groupId;
                if (groupId) {
                    return parseInt(groupId);
                }
                
                // 如果没有dataset，尝试从其他属性获取
                const groupIdAttr = groupBorder.getAttribute('data-group-id');
                if (groupIdAttr) {
                    return parseInt(groupIdAttr);
                }
            }
            return null;
        };

        // 开始组合拖拽
        const startGroupDrag = (event, groupId) => {
            // 获取组合中的所有元素
            const groupData = groups.value.get(groupId);
            if (!groupData || !groupData.elementIds) return;
            
            // 选择整个组合
            groupData.elementIds.forEach(elementId => {
                selectElement(elementId, true);
            });
            
            // 记录组合拖拽状态
            const groupBounds = getGroupBounds(groupId);
            if (groupBounds) {
                // 记录拖拽开始时的组合中心点
                const groupCenterX = groupBounds.x + groupBounds.width / 2;
                const groupCenterY = groupBounds.y + groupBounds.height / 2;
                
                // 计算鼠标相对于组合中心的偏移
                const rect = workspaceRef.value.getBoundingClientRect();
                const mouseX = event.clientX - rect.left;
                const mouseY = event.clientY - rect.top;
                
                // 存储拖拽状态
                groupDragState.value = {
                    groupId,
                    startCenterX: groupCenterX,
                    startCenterY: groupCenterY,
                    mouseOffsetX: mouseX - groupCenterX,
                    mouseOffsetY: mouseY - groupCenterY,
                    startBounds: { ...groupBounds }
                };
                
                console.log('开始组合拖拽:', {
                    groupId,
                    groupBounds,
                    groupCenter: { x: groupCenterX, y: groupCenterY },
                    mouseOffset: { x: mouseX - groupCenterX, y: mouseY - groupCenterY }
                });
                
                // 添加全局鼠标事件监听器
                document.addEventListener('mousemove', handleGroupDragMove);
                document.addEventListener('mouseup', handleGroupDragEnd);
            }
        };

        // 开始组合调整大小
        const startGroupResize = (event, groupId, handle) => {
            // 获取组合中的所有元素
            const groupData = groups.value.get(groupId);
            if (!groupData || !groupData.elementIds) return;
            
            // 选择整个组合
            groupData.elementIds.forEach(elementId => {
                selectElement(elementId, true);
            });
            
            // 记录组合调整大小状态
            const groupBounds = getGroupBounds(groupId);
            if (groupBounds) {
                // 记录调整大小开始时的状态
                groupResizeState.value = {
                    groupId,
                    handle,
                    startBounds: { ...groupBounds },
                    startMouseX: event.clientX,
                    startMouseY: event.clientY
                };
                
                console.log('开始组合调整大小:', {
                    groupId,
                    handle,
                    startBounds: groupBounds
                });
                
                // 添加全局鼠标事件监听器
                document.addEventListener('mousemove', handleGroupResizeMove);
                document.addEventListener('mouseup', handleGroupResizeEnd);
            }
        };
        
        // 处理组合拖拽移动
        const handleGroupDragMove = (event) => {
            if (!groupDragState.value) return;
            
            const rect = workspaceRef.value.getBoundingClientRect();
            const mouseX = event.clientX - rect.left;
            const mouseY = event.clientY - rect.top;
            
            // 计算新的组合中心点
            const newCenterX = mouseX - groupDragState.value.mouseOffsetX;
            const newCenterY = mouseY - groupDragState.value.mouseOffsetY;
            
            // 计算偏移量
            const deltaX = newCenterX - groupDragState.value.startCenterX;
            const deltaY = newCenterY - groupDragState.value.startCenterY;
            
            // 移动组合
            moveGroup(groupDragState.value.groupId, deltaX, deltaY);
            
            // 更新状态
            groupDragState.value.startCenterX = newCenterX;
            groupDragState.value.startCenterY = newCenterY;
        };
        
        // 处理组合拖拽结束
        const handleGroupDragEnd = () => {
            if (groupDragState.value) {
                console.log('组合拖拽结束:', groupDragState.value);
                groupDragState.value = null;
                
                // 移除事件监听器
                document.removeEventListener('mousemove', handleGroupDragMove);
                document.removeEventListener('mouseup', handleGroupDragEnd);
            }
        };
        
        // 处理组合调整大小移动
        const handleGroupResizeMove = (event) => {
            if (!groupResizeState.value) return;
            
            const deltaX = event.clientX - groupResizeState.value.startMouseX;
            const deltaY = event.clientY - groupResizeState.value.startMouseY;
            
            // 根据手柄类型计算宽度和高度的变化
            let deltaWidth = 0, deltaHeight = 0;
            const handle = groupResizeState.value.handle;
            
            switch (handle) {
                case 'se': // 右下角
                    deltaWidth = deltaX;
                    deltaHeight = deltaY;
                    break;
                case 'sw': // 左下角
                    deltaWidth = -deltaX;
                    deltaHeight = deltaY;
                    break;
                case 'ne': // 右上角
                    deltaWidth = deltaX;
                    deltaHeight = -deltaY;
                    break;
                case 'nw': // 左上角
                    deltaWidth = -deltaX;
                    deltaHeight = -deltaY;
                    break;
                case 'n': // 上边中间
                    deltaHeight = -deltaY;
                    break;
                case 's': // 下边中间
                    deltaHeight = deltaY;
                    break;
                case 'e': // 右边中间
                    deltaWidth = deltaX;
                    break;
                case 'w': // 左边中间
                    deltaWidth = -deltaX;
                    break;
            }
            
            // 调整组合大小
            resizeGroup(groupResizeState.value.groupId, deltaWidth, deltaHeight, handle);
        };
        
        // 处理组合调整大小结束
        const handleGroupResizeEnd = () => {
            if (groupResizeState.value) {
                console.log('组合调整大小结束:', groupResizeState.value);
                groupResizeState.value = null;
                
                // 移除事件监听器
                document.removeEventListener('mousemove', handleGroupResizeMove);
                document.removeEventListener('mouseup', handleGroupResizeEnd);
            }
        };

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

        // 处理组合元素
        const handleGroupElements = () => {
            const groupId = groupSelectedElements();
            if (groupId) {
                console.log('组合成功，组合ID:', groupId);
            }
        };

        // 处理解组元素
        const handleUngroupElements = () => {
            ungroupSelectedGroups();
            console.log('解组成功');
        };

        // 处理删除元素
        const handleDeleteElements = () => {
            // 获取选中的元素ID列表
            const selectedIds = Array.from(selectedElementIds.value);
            
            // 从元素数组中移除选中的元素
            elementsRef.value = elementsRef.value.filter(element => 
                !selectedIds.includes(element.id)
            );
            
            // 清空选择
            clearSelection();
            
            // 发出更新事件
            emit("update:elements", elementsRef.value);
            
            console.log('删除选中的元素:', selectedIds);
        };
        
        // 显示工作空间右键菜单
        const showWorkspaceContextMenu = (event) => {
            event.preventDefault();
            const targetElements = Array.from(selectedElementIds.value).map(id =>
                elementsRef.value.find(el => el.id === id)
            ).filter(Boolean);
            
            workspaceContextMenu.targetElements = targetElements;
            workspaceContextMenu.x = event.clientX;
            workspaceContextMenu.y = event.clientY;
            workspaceContextMenu.visible = true;
        };
        
        // 隐藏工作空间右键菜单
        const hideWorkspaceContextMenu = () => {
            workspaceContextMenu.visible = false;
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

        // 处理元素调整大小开始事件
        const handleResizeStart = (event, element, handle) => {
            try {
                // 阻止事件冒泡
                event.stopPropagation();
                
                // 验证参数
                if (!element || !handle) {
                    console.warn('handleResizeStart: 缺少必要参数', { element, handle });
                    return;
                }
                
                // 检查元素是否有效
                if (!element.id || typeof element.x !== 'number' || typeof element.y !== 'number') {
                    console.warn('handleResizeStart: 元素数据无效', element);
                    return;
                }
                
                // 如果元素未被选中，先选中它
                if (!selectedElementIds.value.has(element.id)) {
                    selectElement(element.id, false);
                }
                
                // 检查是否在组合中
                const groupId = isElementInGroup(element.id);
                if (groupId) {
                    // 如果调整的是组合中的元素，选择整个组合
                    const group = getElementGroup(element.id);
                    if (group) {
                        group.elements.forEach(el => {
                            selectElement(el.id, true);
                        });
                        
                        // 对于组合调整大小，需要特殊处理
                        // 记录组合调整大小状态
                        element._isGroupResize = true;
                        element._groupResizeData = {
                            groupId,
                            originalBounds: getGroupBounds(groupId),
                            elementIds: group.elements.map(el => el.id)
                        };
                        
                        console.log('开始组合调整大小:', {
                            groupId,
                            elementId: element.id,
                            handle,
                            originalBounds: element._groupResizeData.originalBounds
                        });
                    }
                }
                
                // 记录调整大小开始时间（用于性能监控）
                element._resizeStartTime = performance.now();
                
                // 开始调整大小
                startResize(event, element, handle);
                
                // 发出调整大小开始事件
                emit("resize-start", element, event, handle);
                props.onResizeStart?.(element, event, handle);
                
                console.log('开始调整元素大小:', {
                    elementId: element.id,
                    handle,
                    position: { x: element.x, y: element.y },
                    size: { width: element.width, height: element.height }
                });
                
            } catch (error) {
                console.error('handleResizeStart 执行出错:', error);
                // 可以在这里添加错误处理逻辑，比如显示错误提示
            }
        };
        
        return {
            workspaceRef,
            draggingId,
            resizingId,
            snapLines,
            mousePos,
            selectedElementIds,
            groups,
            elementGroups,
            selectionBox,
            contextMenu,
            workspaceContextMenu,
            groupDragState,
            groupResizeState,
            handleWorkspaceMouseDown,
            handleWorkspaceMouseUp,
            handleElementMouseDown,
            handleResizeStart,  
            handleMouseMove: (event) =>
                handleMouseMove(event, workspaceRef.value),
            handleMouseLeave,
            handleWorkspaceClick,
            handleElementClick,
            handleElementContextMenu,
            handleGroupMouseDown,
            handleGroupResizeStart,
            handleGroupDragMove,
            handleGroupDragEnd,
            handleGroupResizeMove,
            handleGroupResizeEnd,
            getSnapLineStyle,
            isElementSelected,
            isElementInGroup,
            getGroupBoundsForDisplay,
            canGroupSelectedElements,
            canUngroupSelectedElements,
            handleGroupElements,
            handleUngroupElements,
            handleDeleteElements,
            hideContextMenu,
            showWorkspaceContextMenu,
            hideWorkspaceContextMenu,
        };
    },
};
</script>

<style lang="less" scoped>
.free-layout-workspace {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: #fff;
    outline: none; // 移除键盘焦点边框
    cursor: default; // 默认光标
    pointer-events: auto; // 确保可以接收鼠标事件

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
}
</style>
