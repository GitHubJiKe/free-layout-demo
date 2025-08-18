import { ref, computed, reactive } from 'vue';

/**
 * 组合管理器 - 提供组合创建、选择、移动和大小调整功能
 * 
 * 新增功能：
 * - 智能大小调整：基于鼠标拖拽距离的动态调整
 * - 多锚点支持：支持8个方向锚点 + 中心点
 * - 约束调整：等比例缩放、网格对齐、缩放限制
 * - 调整手柄：提供可视化的拖拽点
 * 
 * 使用方法：
 * 1. 基本调整：resizeGroup(groupId, deltaWidth, deltaHeight, anchor)
 * 2. 智能调整：startResizeGroup -> updateResizeGroup -> endResizeGroup
 * 3. 约束调整：constrainedResizeGroup(groupId, deltaWidth, deltaHeight, anchor, constraints)
 * 4. 获取手柄：getGroupResizeHandles(groupId)
 */
export function useGroupManager(elements) {
    // 选中的组件ID列表
    const selectedElementIds = ref(new Set());
    
    // 组合信息：groupId -> elementIds[]
    const groups = ref(new Map());
    
    // 下一个组合ID
    const nextGroupId = ref(1);
    
    // 选择框状态
    const selectionBox = reactive({
        visible: false,
        startX: 0,
        startY: 0,
        endX: 0,
        endY: 0
    });
    
    // 右键菜单状态
    const contextMenu = reactive({
        visible: false,
        x: 0,
        y: 0,
        targetElements: []
    });

    // 获取选中的组件
    const selectedElements = computed(() => {
        return elements.value.filter(el => selectedElementIds.value.has(el.id));
    });

    // 获取组合信息
    const elementGroups = computed(() => {
        const result = new Map();
        groups.value.forEach((groupData, groupId) => {
            if (groupData.elementIds) {
                result.set(groupId, groupData.elementIds.map(id => 
                    elements.value.find(el => el.id === id)
                ).filter(Boolean));
            }
        });
        return result;
    });

    // 检查组件是否在组合中
    const isElementInGroup = (elementId) => {
        for (const [groupId, groupData] of groups.value) {
            if (groupData.elementIds && groupData.elementIds.includes(elementId)) {
                return groupId;
            }
        }
        return null;
    };

    // 获取组件的组合
    const getElementGroup = (elementId) => {
        const groupId = isElementInGroup(elementId);
        if (groupId) {
            const groupData = groups.value.get(groupId);
            return {
                id: groupId,
                elements: groupData.elementIds.map(id => 
                    elements.value.find(el => el.id === id)
                ).filter(Boolean)
            };
        }
        return null;
    };

    // 选择组件
    const selectElement = (elementId, addToSelection = false) => {
        if (addToSelection) {
            // 添加到选择
            selectedElementIds.value.add(elementId);
        } else {
            // 清空选择并选择当前组件
            selectedElementIds.value.clear();
            selectedElementIds.value.add(elementId);
        }
    };

    // 清空选择
    const clearSelection = () => {
        selectedElementIds.value.clear();
    };

    // 开始框选
    const startSelectionBox = (x, y) => {
        selectionBox.visible = true;
        selectionBox.startX = x;
        selectionBox.startY = y;
        selectionBox.endX = x;
        selectionBox.endY = y;
    };

    // 更新选择框
    const updateSelectionBox = (x, y) => {
        selectionBox.endX = x;
        selectionBox.endY = y;
    };

    // 结束框选并选择范围内的组件
    const endSelectionBox = () => {
        if (!selectionBox.visible) return;
        
        const left = Math.min(selectionBox.startX, selectionBox.endX);
        const right = Math.max(selectionBox.startX, selectionBox.endX);
        const top = Math.min(selectionBox.startY, selectionBox.endY);
        const bottom = Math.max(selectionBox.startY, selectionBox.endY);
        
        // 清空当前选择
        clearSelection();
        
        // 选择完全被选择框覆盖的组件
        elements.value.forEach(element => {
            const elementLeft = element.x;
            const elementRight = element.x + element.width;
            const elementTop = element.y;
            const elementBottom = element.y + element.height;
            
            // 检查组件是否完全被选择框覆盖
            // 只有当组件的所有边界都在选择框内部时，才认为被完全覆盖
            if (elementLeft >= left && elementRight <= right && 
                elementTop >= top && elementBottom <= bottom) {
                selectedElementIds.value.add(element.id);
            }
        });
        
        // 隐藏选择框
        selectionBox.visible = false;
    };

    // 组合选中的组件
    const groupSelectedElements = () => {
        try {
            if (selectedElementIds.value.size < 2) {
                console.log('组合失败：至少需要2个组件才能组合');
                return null; // 至少需要2个组件才能组合
            }

            const elementIds = Array.from(selectedElementIds.value);
            console.log('准备组合的元素ID:', elementIds);
            
            // 记录组合的初始状态
            const groupElements = elementIds.map(id => {
                const element = elements.value.find(el => el.id === id);
                if (!element) {
                    console.warn('未找到元素:', id);
                }
                return element;
            }).filter(Boolean);
            
            if (groupElements.length === 0) {
                console.error('组合失败：没有有效的元素');
                return null;
            }
            
            console.log('准备组合的元素:', groupElements.map(el => ({ id: el.id, x: el.x, y: el.y, width: el.width, height: el.height })));
            
            // 直接计算组合的初始边界（不依赖getGroupBounds）
            let minX = Infinity, minY = Infinity;
            let maxX = -Infinity, maxY = -Infinity;
            
            groupElements.forEach(element => {
                if (typeof element.x === 'number' && typeof element.y === 'number' && 
                    typeof element.width === 'number' && typeof element.height === 'number') {
                    minX = Math.min(minX, element.x);
                    minY = Math.min(minY, element.y);
                    maxX = Math.max(maxX, element.x + element.width);
                    maxY = Math.max(maxY, element.y + element.height);
                } else {
                    console.warn('元素数据无效:', element);
                }
            });
            
            // 验证边界计算结果
            if (!isFinite(minX) || !isFinite(minY) || !isFinite(maxX) || !isFinite(maxY)) {
                console.error('组合失败：边界计算错误', { minX, minY, maxX, maxY });
                return null;
            }
            
            const initialBounds = {
                x: minX,
                y: minY,
                width: maxX - minX,
                height: maxY - minY
            };
            
            console.log('计算的初始边界:', initialBounds);
            
            // 创建组合ID
            const groupId = nextGroupId.value++;
            
            // 计算相对位置
            const relativePositions = groupElements.map(element => {
                const relativeX = (element.x - initialBounds.x) / initialBounds.width;
                const relativeY = (element.y - initialBounds.y) / initialBounds.height;
                const relativeWidth = element.width / initialBounds.width;
                const relativeHeight = element.height / initialBounds.height;
                
                return {
                    elementId: element.id,
                    relativeX,
                    relativeY,
                    relativeWidth,
                    relativeHeight
                };
            });
            
            // 存储组合的初始状态信息
            groups.value.set(groupId, {
                elementIds,
                initialBounds,
                relativePositions
            });
            
            // 不清空选择，保持选中状态以便用户看到分组效果
            // clearSelection();
            
            console.log('组合创建成功:', {
                groupId,
                elementIds,
                initialBounds,
                relativePositions
            });
            
            return groupId;
            
        } catch (error) {
            console.error('组合过程中发生错误:', error);
            return null;
        }
    };

    // 解组
    const ungroupElements = (groupId) => {
        if (groups.value.has(groupId)) {
            const groupData = groups.value.get(groupId);
            if (groupData && groupData.initialBounds) {
                // 可以选择是否恢复到初始状态
                console.log('解组:', { groupId, initialBounds: groupData.initialBounds });
            }
            groups.value.delete(groupId);
        }
    };

    // 解组选中的组合
    const ungroupSelectedGroups = () => {
        const selectedGroups = new Set();
        
        // 找出所有选中组件所属的组合
        selectedElementIds.value.forEach(elementId => {
            const groupId = isElementInGroup(elementId);
            if (groupId) {
                selectedGroups.add(groupId);
            }
        });
        
        // 解组所有选中的组合
        selectedGroups.forEach(groupId => {
            ungroupElements(groupId);
        });
        
        clearSelection();
    };

    // 获取组合的边界框
    const getGroupBounds = (groupId) => {
        try {
            const groupData = groups.value.get(groupId);
            if (!groupData || !groupData.elementIds || groupData.elementIds.length === 0) {
                console.warn('getGroupBounds: 组合数据无效', { groupId, groupData });
                return null;
            }
            
            const groupElements = groupData.elementIds.map(id => {
                const element = elements.value.find(el => el.id === id);
                if (!element) {
                    console.warn('getGroupBounds: 未找到元素', { groupId, elementId: id });
                }
                return element;
            }).filter(Boolean);
            
            if (groupElements.length === 0) {
                console.warn('getGroupBounds: 组合中没有有效元素', { groupId });
                return null;
            }
            
            let minX = Infinity, minY = Infinity;
            let maxX = -Infinity, maxY = -Infinity;
            
            groupElements.forEach(element => {
                if (typeof element.x === 'number' && typeof element.y === 'number' && 
                    typeof element.width === 'number' && typeof element.height === 'number') {
                    minX = Math.min(minX, element.x);
                    minY = Math.min(minY, element.y);
                    maxX = Math.max(maxX, element.x + element.width);
                    maxY = Math.max(maxY, element.y + element.height);
                } else {
                    console.warn('getGroupBounds: 元素数据无效', { element });
                }
            });
            
            // 验证边界计算结果
            if (!isFinite(minX) || !isFinite(minY) || !isFinite(maxX) || !isFinite(maxY)) {
                console.error('getGroupBounds: 边界计算错误', { groupId, minX, minY, maxX, maxY });
                return null;
            }
            
            const bounds = {
                x: minX,
                y: minY,
                width: maxX - minX,
                height: maxY - minY,
                elements: groupElements
            };
            
            console.log('getGroupBounds 计算结果:', { groupId, bounds });
            return bounds;
            
        } catch (error) {
            console.error('getGroupBounds 执行出错:', error);
            return null;
        }
    };

    // 移动组合
    const moveGroup = (groupId, deltaX, deltaY) => {
        const groupData = groups.value.get(groupId);
        if (!groupData || !groupData.elementIds) return;
        
        groupData.elementIds.forEach(elementId => {
            const element = elements.value.find(el => el.id === elementId);
            if (element) {
                element.x += deltaX;
                element.y += deltaY;
            }
        });
        
        console.log('组合移动:', { groupId, deltaX, deltaY });
    };

    // 调整组合大小
    const resizeGroup = (groupId, deltaWidth, deltaHeight, anchor = 'se') => {
        const groupData = groups.value.get(groupId);
        if (!groupData || !groupData.initialBounds) return;
        
        const bounds = getGroupBounds(groupId);
        if (!bounds) return;
        
        // 使用存储的相对位置信息
        const relativePositions = groupData.relativePositions;
        if (!relativePositions || relativePositions.length === 0) return;
        
        // 根据锚点调整组合大小
        let newX = bounds.x, newY = bounds.y;
        let newWidth = bounds.width, newHeight = bounds.height;
        
        // 改进的锚点处理逻辑
        switch (anchor) {
            case "se": // 右下角 - 只改变宽度和高度
                newWidth += deltaWidth;
                newHeight += deltaHeight;
                break;
            case "sw": // 左下角 - 改变X、宽度和高度
                newX += deltaWidth;
                newWidth -= deltaWidth;
                newHeight += deltaHeight;
                break;
            case "ne": // 右上角 - 改变Y、宽度和高度
                newY += deltaHeight;
                newWidth += deltaWidth;
                newHeight -= deltaHeight;
                break;
            case "nw": // 左上角 - 改变X、Y、宽度和高度
                newX += deltaWidth;
                newY += deltaHeight;
                newWidth -= deltaWidth;
                newHeight -= deltaHeight;
                break;
            case "n": // 上边 - 只改变Y和高度
                newY += deltaHeight;
                newHeight -= deltaHeight;
                break;
            case "s": // 下边 - 只改变高度
                newHeight += deltaHeight;
                break;
            case "e": // 右边 - 只改变宽度
                newWidth += deltaWidth;
                break;
            case "w": // 左边 - 改变X和宽度
                newX += deltaWidth;
                newWidth -= deltaWidth;
                break;
            case "center": // 中心 - 等比例缩放
                const scaleX = 1 + deltaWidth / bounds.width;
                const scaleY = 1 + deltaHeight / bounds.height;
                const scale = Math.min(scaleX, scaleY); // 保持宽高比
                
                newWidth = bounds.width * scale;
                newHeight = bounds.height * scale;
                // 保持中心点不变
                newX = bounds.x + (bounds.width - newWidth) / 2;
                newY = bounds.y + (bounds.height - newHeight) / 2;
                break;
        }
        
        // 确保最小尺寸，防止过度缩小
        const minWidth = Math.max(50, bounds.width * 0.1); // 最小为原宽度的10%
        const minHeight = Math.max(30, bounds.height * 0.1); // 最小为原高度的10%
        
        newWidth = Math.max(minWidth, newWidth);
        newHeight = Math.max(minHeight, newHeight);
        
        // 防止过度放大，设置最大尺寸限制
        const maxWidth = bounds.width * 5; // 最大为原宽度的5倍
        const maxHeight = bounds.height * 5; // 最大为原高度的5倍
        
        newWidth = Math.min(maxWidth, newWidth);
        newHeight = Math.min(maxHeight, newHeight);
        
        // 更新每个组件的位置和大小，保持相对位置和比例
        relativePositions.forEach(({ elementId, relativeX, relativeY, relativeWidth, relativeHeight }) => {
            const element = elements.value.find(el => el.id === elementId);
            if (element) {
                // 计算新的绝对位置和尺寸
                const newElementX = newX + relativeX * newWidth;
                const newElementY = newY + relativeY * newHeight;
                const newElementWidth = relativeWidth * newWidth;
                const newElementHeight = relativeHeight * newHeight;
                
                // 确保元素不会超出合理范围
                const finalWidth = Math.max(20, Math.min(newElementWidth, newWidth * 0.8));
                const finalHeight = Math.max(15, Math.min(newElementHeight, newHeight * 0.8));
                
                // 调整位置以保持相对关系
                const adjustedX = newElementX + (newElementWidth - finalWidth) / 2;
                const adjustedY = newElementY + (newElementHeight - finalHeight) / 2;
                
                element.x = adjustedX;
                element.y = adjustedY;
                element.width = finalWidth;
                element.height = finalHeight;
            }
        });
        
        console.log('组合大小调整:', { 
            groupId, 
            anchor, 
            deltaWidth, 
            deltaHeight, 
            oldSize: { width: bounds.width, height: bounds.height },
            newSize: { width: newWidth, height: newHeight },
            newPosition: { x: newX, y: newY }
        });
    };

    // 智能调整组合大小 - 基于鼠标位置和拖拽距离
    const smartResizeGroup = (groupId, startX, startY, currentX, currentY, anchor = 'se') => {
        const groupData = groups.value.get(groupId);
        if (!groupData || !groupData.initialBounds) return;
        
        const bounds = getGroupBounds(groupId);
        if (!bounds) return;
        
        // 计算拖拽距离
        const deltaX = currentX - startX;
        const deltaY = currentY - startY;
        
        // 根据锚点类型计算调整量
        let deltaWidth = 0, deltaHeight = 0;
        
        switch (anchor) {
            case "se": // 右下角
                deltaWidth = deltaX;
                deltaHeight = deltaY;
                break;
            case "sw": // 左下角
                deltaWidth = -deltaX;
                deltaHeight = deltaY;
                break;
            case "ne": // 右上角
                deltaWidth = deltaX;
                deltaHeight = -deltaY;
                break;
            case "nw": // 左上角
                deltaWidth = -deltaX;
                deltaHeight = -deltaY;
                break;
            case "n": // 上边
                deltaWidth = 0;
                deltaHeight = -deltaY;
                break;
            case "s": // 下边
                deltaWidth = 0;
                deltaHeight = deltaY;
                break;
            case "e": // 右边
                deltaWidth = deltaX;
                deltaHeight = 0;
                break;
            case "w": // 左边
                deltaWidth = -deltaX;
                deltaHeight = 0;
                break;
            case "center": // 中心 - 等比例缩放
                const scale = Math.min(
                    1 + deltaX / bounds.width,
                    1 + deltaY / bounds.height
                );
                deltaWidth = bounds.width * (scale - 1);
                deltaHeight = bounds.height * (scale - 1);
                break;
        }
        
        // 调用原有的调整大小函数
        resizeGroup(groupId, deltaWidth, deltaHeight, anchor);
    };

    // 开始调整组合大小
    const startResizeGroup = (groupId, startX, startY, anchor) => {
        const groupData = groups.value.get(groupId);
        if (!groupData) return;
        
        // 存储调整开始的状态
        groupData.resizeStart = {
            x: startX,
            y: startY,
            anchor: anchor,
            originalBounds: { ...getGroupBounds(groupId) }
        };
        
        console.log('开始调整组合大小:', { groupId, anchor, startX, startY });
    };

    // 更新组合大小调整
    const updateResizeGroup = (groupId, currentX, currentY) => {
        const groupData = groups.value.get(groupId);
        if (!groupData || !groupData.resizeStart) return;
        
        const { x: startX, y: startY, anchor } = groupData.resizeStart;
        smartResizeGroup(groupId, startX, startY, currentX, currentY, anchor);
    };

    // 结束调整组合大小
    const endResizeGroup = (groupId) => {
        const groupData = groups.value.get(groupId);
        if (!groupData) return;
        
        // 清理调整状态
        delete groupData.resizeStart;
        
        console.log('结束调整组合大小:', { groupId });
    };

    // 获取组合的调整手柄位置
    const getGroupResizeHandles = (groupId) => {
        const bounds = getGroupBounds(groupId);
        if (!bounds) return [];
        
        const { x, y, width, height } = bounds;
        const handleSize = 8; // 手柄大小
        
        return [
            // 四个角
            { id: 'nw', x: x - handleSize/2, y: y - handleSize/2, cursor: 'nw-resize' },
            { id: 'ne', x: x + width - handleSize/2, y: y - handleSize/2, cursor: 'ne-resize' },
            { id: 'sw', x: x - handleSize/2, y: y + height - handleSize/2, cursor: 'sw-resize' },
            { id: 'se', x: x + width - handleSize/2, y: y + height - handleSize/2, cursor: 'se-resize' },
            
            // 四条边
            { id: 'n', x: x + width/2 - handleSize/2, y: y - handleSize/2, cursor: 'n-resize' },
            { id: 's', x: x + width/2 - handleSize/2, y: y + height - handleSize/2, cursor: 's-resize' },
            { id: 'e', x: x + width - handleSize/2, y: y + height/2 - handleSize/2, cursor: 'e-resize' },
            { id: 'w', x: x - handleSize/2, y: y + height/2 - handleSize/2, cursor: 'w-resize' },
            
            // 中心点（用于等比例缩放）
            { id: 'center', x: x + width/2 - handleSize/2, y: y + height/2 - handleSize/2, cursor: 'move' }
        ];
    };

    // 检查点是否在调整手柄内
    const isPointInResizeHandle = (groupId, pointX, pointY) => {
        const handles = getGroupResizeHandles(groupId);
        const handleSize = 8;
        
        for (const handle of handles) {
            if (pointX >= handle.x && pointX <= handle.x + handleSize &&
                pointY >= handle.y && pointY <= handle.y + handleSize) {
                return handle.id;
            }
        }
        return null;
    };

    // 约束调整组合大小（支持等比例缩放、网格对齐等）
    const constrainedResizeGroup = (groupId, deltaWidth, deltaHeight, anchor = 'se', constraints = {}) => {
        const { 
            maintainAspectRatio = false, 
            gridSize = 10, 
            snapToGrid = false,
            minScale = 0.1,
            maxScale = 5.0
        } = constraints;
        
        const groupData = groups.value.get(groupId);
        if (!groupData || !groupData.initialBounds) return;
        
        const bounds = getGroupBounds(groupId);
        if (!bounds) return;
        
        let newWidth = bounds.width + deltaWidth;
        let newHeight = bounds.height + deltaHeight;
        
        // 等比例缩放
        if (maintainAspectRatio) {
            const aspectRatio = bounds.width / bounds.height;
            if (Math.abs(deltaWidth) > Math.abs(deltaHeight)) {
                newHeight = newWidth / aspectRatio;
            } else {
                newWidth = newHeight * aspectRatio;
            }
        }
        
        // 网格对齐
        if (snapToGrid) {
            newWidth = Math.round(newWidth / gridSize) * gridSize;
            newHeight = Math.round(newHeight / gridSize) * gridSize;
        }
        
        // 应用缩放限制
        const scaleX = newWidth / groupData.initialBounds.width;
        const scaleY = newHeight / groupData.initialBounds.height;
        
        if (scaleX < minScale || scaleX > maxScale || scaleY < minScale || scaleY > maxScale) {
            // 如果超出限制，使用限制值
            const scale = Math.min(Math.max(Math.min(scaleX, scaleY), minScale), maxScale);
            newWidth = groupData.initialBounds.width * scale;
            newHeight = groupData.initialBounds.height * scale;
        }
        
        // 调用原有的调整大小函数
        const finalDeltaWidth = newWidth - bounds.width;
        const finalDeltaHeight = newHeight - bounds.height;
        
        resizeGroup(groupId, finalDeltaWidth, finalDeltaHeight, anchor);
        
        console.log('约束调整组合大小:', { 
            groupId, 
            anchor, 
            constraints,
            finalDelta: { width: finalDeltaWidth, height: finalDeltaHeight }
        });
    };

    // 显示右键菜单
    const showContextMenu = (event, targetElements) => {
        event.preventDefault();
        contextMenu.visible = true;
        contextMenu.x = event.clientX;
        contextMenu.y = event.clientY;
        contextMenu.targetElements = targetElements;
    };

    // 隐藏右键菜单
    const hideContextMenu = () => {
        contextMenu.visible = false;
    };

    // 检查是否应该显示组合选项
    const shouldShowGroupOptions = computed(() => {
        if (selectedElementIds.value.size === 0) return false;
        
        // 检查是否有选中的组件在组合中
        let hasGroupedElements = false;
        let hasUngroupedElements = false;
        
        selectedElementIds.value.forEach(elementId => {
            if (isElementInGroup(elementId)) {
                hasGroupedElements = true;
            } else {
                hasUngroupedElements = true;
            }
        });
        
        return hasGroupedElements || hasUngroupedElements;
    });

    return {
        // 状态
        selectedElementIds,
        groups,
        elementGroups,
        selectionBox,
        contextMenu,
        shouldShowGroupOptions,
        
        // 方法
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
        smartResizeGroup,
        startResizeGroup,
        updateResizeGroup,
        endResizeGroup,
        isElementInGroup,
        getElementGroup,
        showContextMenu,
        hideContextMenu,
        getGroupResizeHandles,
        isPointInResizeHandle,
        constrainedResizeGroup
    };
}
