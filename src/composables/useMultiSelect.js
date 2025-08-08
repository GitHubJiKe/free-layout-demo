import { ref, reactive } from "vue";

export function useMultiSelect(options = {}) {
    const {
        elements = ref([]),
        onSelectionChange,
        onMultiDragStart,
        onMultiDragMove,
        onMultiDragEnd,
    } = options;

    // 选中的元素ID集合
    const selectedElements = ref(new Set());

    // 多选拖拽状态
    const isMultiDragging = ref(false);
    const multiDragOffset = reactive({ x: 0, y: 0 });
    const multiDragStartPositions = ref(new Map()); // 存储多选元素的初始位置
    const multiDragGroupOffset = reactive({ x: 0, y: 0 }); // 整个组的偏移量

    // 检查是否按下了 Command 键
    const isCommandPressed = (event) => {
        return event.metaKey || event.ctrlKey; // macOS 用 metaKey，Windows 用 ctrlKey
    };

    // 选择元素 - 只在按住 Command 键时才选中
    const selectElement = (elementId, event) => {
        if (isCommandPressed(event)) {
            // Command + 点击：切换选择状态
            if (selectedElements.value.has(elementId)) {
                selectedElements.value.delete(elementId);
            } else {
                selectedElements.value.add(elementId);
            }
        } else {
            // 普通点击：清除其他选择，只选择当前元素
            selectedElements.value.clear();
            selectedElements.value.add(elementId);
        }

        onSelectionChange?.(Array.from(selectedElements.value));
    };

    // 清除选择
    const clearSelection = () => {
        selectedElements.value.clear();
        onSelectionChange?.([]);
    };

    // 获取选中的元素
    const getSelectedElements = () => {
        return elements.value.filter((element) =>
            selectedElements.value.has(element.id),
        );
    };

    // 开始多选拖拽
    const startMultiDrag = (event, primaryElement, workspaceRef) => {
        if (selectedElements.value.size === 0) return;

        isMultiDragging.value = true;
        const rect = workspaceRef.getBoundingClientRect();

        // 计算主元素的偏移量
        multiDragOffset.x = event.clientX - rect.left - primaryElement.x;
        multiDragOffset.y = event.clientY - rect.top - primaryElement.y;

        // 记录所有选中元素的初始位置
        multiDragStartPositions.value.clear();
        const selectedElementsList = getSelectedElements();

        // 计算组的中心点
        let groupCenterX = 0;
        let groupCenterY = 0;

        selectedElementsList.forEach((element) => {
            const centerX = element.x + element.width / 2;
            const centerY = element.y + element.height / 2;
            groupCenterX += centerX;
            groupCenterY += centerY;

            multiDragStartPositions.value.set(element.id, {
                x: element.x,
                y: element.y,
                centerX: centerX,
                centerY: centerY,
            });
        });

        // 计算组的平均中心点
        groupCenterX /= selectedElementsList.length;
        groupCenterY /= selectedElementsList.length;

        // 记录组的初始中心点
        multiDragGroupOffset.x = groupCenterX;
        multiDragGroupOffset.y = groupCenterY;

        onMultiDragStart?.(selectedElementsList, event);
    };

    // 处理多选拖拽 - 保持相对位置不变
    const handleMultiDrag = (event, workspaceRef) => {
        if (!isMultiDragging.value || selectedElements.value.size === 0) return;

        const rect = workspaceRef.getBoundingClientRect();
        const selectedElementsList = getSelectedElements();

        // 计算新的组中心点
        const newGroupCenterX = event.clientX - rect.left - multiDragOffset.x;
        const newGroupCenterY = event.clientY - rect.top - multiDragOffset.y;

        // 计算组的偏移量
        const deltaX = newGroupCenterX - multiDragGroupOffset.x;
        const deltaY = newGroupCenterY - multiDragGroupOffset.y;

        // 更新所有选中元素的位置，保持相对位置不变
        selectedElementsList.forEach((element) => {
            const startPos = multiDragStartPositions.value.get(element.id);
            if (startPos) {
                // 计算新位置，保持相对位置不变
                let newX = startPos.x + deltaX;
                let newY = startPos.y + deltaY;

                // 边界限制 - 确保整个组都在可视区域内
                const minX = 0;
                const maxX = rect.width - element.width;
                const minY = 0;
                const maxY = rect.height - element.height;

                // 如果超出边界，调整位置
                if (newX < minX) {
                    newX = minX;
                } else if (newX > maxX) {
                    newX = maxX;
                }

                if (newY < minY) {
                    newY = minY;
                } else if (newY > maxY) {
                    newY = maxY;
                }

                element.x = newX;
                element.y = newY;
            }
        });

        onMultiDragMove?.(selectedElementsList, event);
    };

    // 停止多选拖拽
    const stopMultiDrag = () => {
        if (isMultiDragging.value) {
            isMultiDragging.value = false;
            multiDragStartPositions.value.clear();
            onMultiDragEnd?.(getSelectedElements());
        }
    };

    // 检查元素是否被选中
    const isElementSelected = (elementId) => {
        return selectedElements.value.has(elementId);
    };

    // 获取选中元素数量
    const getSelectedCount = () => {
        return selectedElements.value.size;
    };

    return {
        // 状态
        selectedElements,
        isMultiDragging,

        // 方法
        selectElement,
        clearSelection,
        getSelectedElements,
        startMultiDrag,
        handleMultiDrag,
        stopMultiDrag,
        isElementSelected,
        getSelectedCount,
        isCommandPressed,
    };
}
