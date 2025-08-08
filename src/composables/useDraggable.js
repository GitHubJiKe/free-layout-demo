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

        const rect = workspaceRef.value.getBoundingClientRect();
        const newWidth = Math.max(50, event.clientX - rect.left - element.x);
        const newHeight = Math.max(30, event.clientY - rect.top - element.y);

        element.width = newWidth;
        element.height = newHeight;

        onResizeMove?.(element, event);
    };

    // 停止调整大小
    const stopResize = () => {
        const element = elements.value.find((el) => el.id === resizingId.value);
        if (element) {
            onResizeEnd?.(element);

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
