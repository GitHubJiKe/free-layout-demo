import { ref, reactive, onMounted, onUnmounted } from "vue";

export function useDraggable(options = {}) {
    const {
        onDragStart,
        onDragMove,
        onDragEnd,
        onResizeStart,
        onResizeMove,
        onResizeEnd,
        snapDistance = 10,
        enableSnap = true,
        enableResize = true,
        elements = ref([]),
        workspaceRef = ref(null),
        measureDrag = null,
        multiSelect = null,
    } = options;

    const draggingId = ref(null);
    const resizingId = ref(null);
    const snapLines = ref([]);
    const mousePos = reactive({ x: 0, y: 0 });

    // 开始拖拽
    const startDrag = (event, element, workspaceRef) => {
        if (event.target.classList.contains("resize-handle")) return;

        // 检查是否是多选拖拽
        if (
            multiSelect &&
            multiSelect.isElementSelected(element.id) &&
            multiSelect.getSelectedCount() > 1
        ) {
            // 多选拖拽
            multiSelect.startMultiDrag(event, element, workspaceRef);
            return;
        }

        // 单元素拖拽
        draggingId.value = element.id;
        const rect = workspaceRef.getBoundingClientRect();
        element.startX = event.clientX - rect.left - element.x;
        element.startY = event.clientY - rect.top - element.y;

        // 将拖拽元素移到最上层
        bringElementToFront(element.id, elements);

        const handleDragMove = (e) => handleDrag(e, workspaceRef);
        const handleDragEnd = () => stopDrag();

        document.addEventListener("mousemove", handleDragMove);
        document.addEventListener("mouseup", handleDragEnd);

        // 存储事件监听器引用以便清理
        element._dragMoveHandler = handleDragMove;
        element._dragEndHandler = handleDragEnd;

        onDragStart?.(element, event);
    };

    // 将元素移到最上层
    const bringElementToFront = (elementId, elements) => {
        const draggingElement = elements.value.find(
            (el) => el.id === elementId,
        );
        if (!draggingElement) return;

        const index = elements.value.findIndex((el) => el.id === elementId);
        if (index > -1) {
            elements.value.splice(index, 1);
            elements.value.push(draggingElement);
        }
    };

    // 开始调整大小
    const startResize = (event, element, direction = "se") => {
        resizingId.value = element.id;
        event.stopPropagation();

        // 保存resize开始时的状态
        const rect = workspaceRef.value.getBoundingClientRect();
        element._resizeStartState = {
            x: element.x,
            y: element.y,
            width: element.width,
            height: element.height,
            startX: event.clientX,
            startY: event.clientY,
            direction: direction
        };

        const handleResizeMove = (e) => handleResize(e);
        const handleResizeEnd = () => stopResize();

        document.addEventListener("mousemove", handleResizeMove);
        document.addEventListener("mouseup", handleResizeEnd);

        // 存储事件监听器引用以便清理
        element._resizeMoveHandler = handleResizeMove;
        element._resizeEndHandler = handleResizeEnd;

        onResizeStart?.(element, event, direction);
    };

    // 处理拖拽 - 集成性能监控和多选
    const handleDrag = (event, workspaceRef) => {
        // 检查是否是多选拖拽
        if (multiSelect && multiSelect.isMultiDragging.value) {
            multiSelect.handleMultiDrag(event, workspaceRef);
            return;
        }

        // 单元素拖拽
        if (!draggingId.value) return;

        const element = elements.value.find((el) => el.id === draggingId.value);
        if (!element) return;

        // 使用measureDrag包装拖拽逻辑
        const performDrag = () => {
            const rect = workspaceRef.getBoundingClientRect();
            let newX = event.clientX - rect.left - element.startX;
            let newY = event.clientY - rect.top - element.startY;

            // 边界限制
            newX = Math.max(0, Math.min(newX, rect.width - element.width));
            newY = Math.max(0, Math.min(newY, rect.height - element.height));

            // 计算吸附
            if (enableSnap) {
                const snapResult = calculateSnap(
                    element,
                    newX,
                    newY,
                    elements.value,
                    snapDistance,
                );
                newX = snapResult.x;
                newY = snapResult.y;
                snapLines.value = snapResult.snapLines;
            } else {
                snapLines.value = [];
            }

            // 更新元素位置
            element.x = newX;
            element.y = newY;

            onDragMove?.(element, event);
        };

        // 如果有measureDrag方法，使用它包装拖拽逻辑
        if (measureDrag) {
            measureDrag(performDrag);
        } else {
            performDrag();
        }
    };

    // 停止拖拽
    const stopDrag = () => {
        // 检查是否是多选拖拽
        if (multiSelect && multiSelect.isMultiDragging.value) {
            multiSelect.stopMultiDrag();
            return;
        }

        // 单元素拖拽停止
        const element = elements.value.find((el) => el.id === draggingId.value);
        if (element) {
            onDragEnd?.(element);

            // 清理事件监听器
            if (element._dragMoveHandler) {
                document.removeEventListener(
                    "mousemove",
                    element._dragMoveHandler,
                );
                delete element._dragMoveHandler;
            }
            if (element._dragEndHandler) {
                document.removeEventListener(
                    "mouseup",
                    element._dragEndHandler,
                );
                delete element._dragEndHandler;
            }
        }

        draggingId.value = null;
        snapLines.value = [];
    };

    // 处理调整大小
    const handleResize = (event) => {
        if (!resizingId.value) return;

        const element = elements.value.find((el) => el.id === resizingId.value);
        if (!element) return;

        // 获取resize开始时的状态
        const startState = element._resizeStartState;
        if (!startState) return;

        const rect = workspaceRef.value.getBoundingClientRect();
        const deltaX = event.clientX - startState.startX;
        const deltaY = event.clientY - startState.startY;

        let newX = startState.x;
        let newY = startState.y;
        let newWidth = startState.width;
        let newHeight = startState.height;

        // 根据不同的resize方向计算新的尺寸和位置
        switch (startState.direction) {
            case "se": // 右下角
                newWidth = Math.max(50, startState.width + deltaX);
                newHeight = Math.max(30, startState.height + deltaY);
                break;
            case "sw": // 左下角
                newX = startState.x + deltaX;
                newWidth = Math.max(50, startState.width - deltaX);
                newHeight = Math.max(30, startState.height + deltaY);
                break;
            case "ne": // 右上角
                newY = startState.y + deltaY;
                newWidth = Math.max(50, startState.width + deltaX);
                newHeight = Math.max(30, startState.height - deltaY);
                break;
            case "nw": // 左上角
                newX = startState.x + deltaX;
                newY = startState.y + deltaY;
                newWidth = Math.max(50, startState.width - deltaX);
                newHeight = Math.max(30, startState.height - deltaY);
                break;
            case "n": // 上边中间
                newY = startState.y + deltaY;
                newHeight = Math.max(30, startState.height - deltaY);
                break;
            case "s": // 下边中间
                newHeight = Math.max(30, startState.height + deltaY);
                break;
            case "e": // 右边中间
                newWidth = Math.max(50, startState.width + deltaX);
                break;
            case "w": // 左边中间
                newX = startState.x + deltaX;
                newWidth = Math.max(50, startState.width - deltaX);
                break;
        }

        // 边界限制
        if (newX < 0) {
            newWidth += newX;
            newX = 0;
        }
        if (newY < 0) {
            newHeight += newY;
            newY = 0;
        }
        if (newWidth < 50) newWidth = 50;
        if (newHeight < 30) newHeight = 30;

        // 计算resize过程中的对齐线
        const resizeSnapLines = calculateResizeSnap(
            element,
            newX,
            newY,
            newWidth,
            newHeight,
            elements.value,
            snapDistance
        );

        // 更新吸附线
        snapLines.value = resizeSnapLines;

        // 更新元素位置和尺寸
        element.x = newX;
        element.y = newY;
        element.width = newWidth;
        element.height = newHeight;

        onResizeMove?.(element, event);
    };

    // 停止调整大小
    const stopResize = () => {
        const element = elements.value.find((el) => el.id === resizingId.value);
        if (element) {
            onResizeEnd?.(element);

            // 清理resize状态
            if (element._resizeStartState) {
                delete element._resizeStartState;
            }

            // 清理事件监听器
            if (element._resizeMoveHandler) {
                document.removeEventListener(
                    "mousemove",
                    element._resizeMoveHandler,
                );
                delete element._resizeMoveHandler;
            }
            if (element._resizeEndHandler) {
                document.removeEventListener(
                    "mouseup",
                    element._resizeEndHandler,
                );
                delete element._resizeEndHandler;
            }
        }

        // 清理吸附线
        snapLines.value = [];
        resizingId.value = null;
    };

    // 计算吸附
    const calculateSnap = (
        currentElement,
        newX,
        newY,
        elements,
        snapDistance,
    ) => {
        const snapLines = [];
        let finalX = newX;
        let finalY = newY;

        elements.forEach((element) => {
            if (element.id === currentElement.id) return;

            // 中心对齐
            const currentCenterX = newX + currentElement.width / 2;
            const currentCenterY = newY + currentElement.height / 2;
            const elementCenterX = element.x + element.width / 2;
            const elementCenterY = element.y + element.height / 2;

            if (Math.abs(currentCenterX - elementCenterX) < snapDistance) {
                finalX = elementCenterX - currentElement.width / 2;
                snapLines.push({
                    id: `center-x-${element.id}`,
                    type: "vertical",
                    x: elementCenterX,
                    y1: Math.min(newY, element.y),
                    y2: Math.max(
                        newY + currentElement.height,
                        element.y + element.height,
                    ),
                });
            }

            if (Math.abs(currentCenterY - elementCenterY) < snapDistance) {
                finalY = elementCenterY - currentElement.height / 2;
                snapLines.push({
                    id: `center-y-${element.id}`,
                    type: "horizontal",
                    y: elementCenterY,
                    x1: Math.min(newX, element.x),
                    x2: Math.max(
                        newX + currentElement.width,
                        element.x + element.width,
                    ),
                });
            }

            // 边缘对齐
            if (Math.abs(newX - element.x) < snapDistance) {
                finalX = element.x;
                snapLines.push({
                    id: `left-${element.id}`,
                    type: "vertical",
                    x: element.x,
                    y1: Math.min(newY, element.y),
                    y2: Math.max(
                        newY + currentElement.height,
                        element.y + element.height,
                    ),
                });
            }

            if (
                Math.abs(
                    newX + currentElement.width - element.x - element.width,
                ) < snapDistance
            ) {
                finalX = element.x + element.width - currentElement.width;
                snapLines.push({
                    id: `right-${element.id}`,
                    type: "vertical",
                    x: element.x + element.width,
                    y1: Math.min(newY, element.y),
                    y2: Math.max(
                        newY + currentElement.height,
                        element.y + element.height,
                    ),
                });
            }

            if (Math.abs(newY - element.y) < snapDistance) {
                finalY = element.y;
                snapLines.push({
                    id: `top-${element.id}`,
                    type: "horizontal",
                    y: element.y,
                    x1: Math.min(newX, element.x),
                    x2: Math.max(
                        newX + currentElement.width,
                        element.x + element.width,
                    ),
                });
            }

            if (
                Math.abs(
                    newY + currentElement.height - element.y - element.height,
                ) < snapDistance
            ) {
                finalY = element.y + element.height - currentElement.height;
                snapLines.push({
                    id: `bottom-${element.id}`,
                    type: "horizontal",
                    y: element.y + element.height,
                    x1: Math.min(newX, element.x),
                    x2: Math.max(
                        newX + currentElement.width,
                        element.x + element.width,
                    ),
                });
            }
        });

        return { x: finalX, y: finalY, snapLines };
    };

    // 计算resize过程中的对齐线
    const calculateResizeSnap = (
        currentElement,
        newX,
        newY,
        newWidth,
        newHeight,
        elements,
        snapDistance
    ) => {
        const snapLines = [];

        elements.forEach((element) => {
            if (element.id === currentElement.id) return;

            // 中心对齐
            const currentCenterX = newX + newWidth / 2;
            const currentCenterY = newY + newHeight / 2;
            const elementCenterX = element.x + element.width / 2;
            const elementCenterY = element.y + element.height / 2;

            if (Math.abs(currentCenterX - elementCenterX) < snapDistance) {
                snapLines.push({
                    id: `center-x-${element.id}`,
                    type: "vertical",
                    x: elementCenterX,
                    y1: Math.min(newY, element.y),
                    y2: Math.max(newY + newHeight, element.y + element.height),
                    style: "center"
                });
            }

            if (Math.abs(currentCenterY - elementCenterY) < snapDistance) {
                snapLines.push({
                    id: `center-y-${element.id}`,
                    type: "horizontal",
                    y: elementCenterY,
                    x1: Math.min(newX, element.x),
                    x2: Math.max(newX + newWidth, element.x + element.width),
                    style: "center"
                });
            }

            // 边缘对齐
            if (Math.abs(newX - element.x) < snapDistance) {
                snapLines.push({
                    id: `left-${element.id}`,
                    type: "vertical",
                    x: element.x,
                    y1: Math.min(newY, element.y),
                    y2: Math.max(newY + newHeight, element.y + element.height),
                    style: "edge"
                });
            }

            if (Math.abs(newX + newWidth - element.x - element.width) < snapDistance) {
                snapLines.push({
                    id: `right-${element.id}`,
                    type: "vertical",
                    x: element.x + element.width,
                    y1: Math.min(newY, element.y),
                    y2: Math.max(newY + newHeight, element.y + element.height),
                    style: "edge"
                });
            }

            if (Math.abs(newY - element.y) < snapDistance) {
                snapLines.push({
                    id: `top-${element.id}`,
                    type: "horizontal",
                    y: element.y,
                    x1: Math.min(newX, element.x),
                    x2: Math.max(newX + newWidth, element.x + element.width),
                    style: "edge"
                });
            }

            if (Math.abs(newY + newHeight - element.y - element.height) < snapDistance) {
                snapLines.push({
                    id: `bottom-${element.id}`,
                    type: "horizontal",
                    y: element.y + element.height,
                    x1: Math.min(newX, element.x),
                    x2: Math.max(newX + newWidth, element.x + element.width),
                    style: "edge"
                });
            }

            // 尺寸匹配对齐 - 宽度匹配
            if (Math.abs(newWidth - element.width) < snapDistance) {
                snapLines.push({
                    id: `width-match-${element.id}`,
                    type: "width-match",
                    x: newX + newWidth,
                    y: newY + newHeight,
                    width: element.width,
                    style: "size-match"
                });
            }

            // 尺寸匹配对齐 - 高度匹配
            if (Math.abs(newHeight - element.height) < snapDistance) {
                snapLines.push({
                    id: `height-match-${element.id}`,
                    type: "height-match",
                    x: newX + newWidth,
                    y: newY + newHeight,
                    height: element.height,
                    style: "size-match"
                });
            }
        });

        return snapLines;
    };

    // 处理鼠标移动
    const handleMouseMove = (event, workspaceRef) => {
        if (workspaceRef) {
            const rect = workspaceRef.getBoundingClientRect();
            mousePos.x = event.clientX - rect.left;
            mousePos.y = event.clientY - rect.top;
        }
    };

    // 处理鼠标离开
    const handleMouseLeave = () => {
        // 可以在这里添加鼠标离开时的逻辑
    };

    // 清理事件监听器
    onUnmounted(() => {
        // 清理所有可能的事件监听器
        elements.value.forEach((element) => {
            if (element._dragMoveHandler) {
                document.removeEventListener(
                    "mousemove",
                    element._dragMoveHandler,
                );
                delete element._dragMoveHandler;
            }
            if (element._dragEndHandler) {
                document.removeEventListener(
                    "mouseup",
                    element._dragEndHandler,
                );
                delete element._dragEndHandler;
            }
            if (element._resizeMoveHandler) {
                document.removeEventListener(
                    "mousemove",
                    element._resizeMoveHandler,
                );
                delete element._resizeMoveHandler;
            }
            if (element._resizeEndHandler) {
                document.removeEventListener(
                    "mouseup",
                    element._resizeEndHandler,
                );
                delete element._resizeEndHandler;
            }
        });
    });

    return {
        draggingId,
        resizingId,
        snapLines,
        mousePos,
        startDrag,
        startResize,
        handleMouseMove,
        handleMouseLeave,
    };
}
