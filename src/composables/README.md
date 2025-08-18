# useGroupManager 组合管理器

## 概述

`useGroupManager` 是一个强大的组合管理工具，提供组合创建、选择、移动和大小调整功能。最新版本增加了智能大小调整、多锚点支持和约束调整等高级功能。

## 主要功能

### 1. 组合管理
- 创建组合：`groupSelectedElements()`
- 解组：`ungroupElements(groupId)` / `ungroupSelectedGroups()`
- 组合信息：`getGroupBounds(groupId)`, `isElementInGroup(elementId)`

### 2. 选择管理
- 选择组件：`selectElement(elementId, addToSelection)`
- 框选：`startSelectionBox()`, `updateSelectionBox()`, `endSelectionBox()`
- 清空选择：`clearSelection()`

### 3. 移动和调整
- 移动组合：`moveGroup(groupId, deltaX, deltaY)`
- 基本大小调整：`resizeGroup(groupId, deltaWidth, deltaHeight, anchor)`

## 新增高级功能

### 1. 智能大小调整

基于鼠标拖拽距离的动态调整，提供更直观的用户体验：

```javascript
// 开始调整
startResizeGroup(groupId, startX, startY, anchor);

// 拖拽过程中更新
updateResizeGroup(groupId, currentX, currentY);

// 结束调整
endResizeGroup(groupId);
```

### 2. 多锚点支持

支持8个方向锚点 + 中心点：

- **角点**：`nw`, `ne`, `sw`, `se` - 同时调整宽度和高度
- **边点**：`n`, `s`, `e`, `w` - 只调整对应方向
- **中心点**：`center` - 等比例缩放

### 3. 约束调整

支持等比例缩放、网格对齐和缩放限制：

```javascript
constrainedResizeGroup(groupId, deltaWidth, deltaHeight, anchor, {
    maintainAspectRatio: true,  // 保持宽高比
    snapToGrid: true,           // 网格对齐
    gridSize: 20,               // 网格大小
    minScale: 0.2,              // 最小缩放比例
    maxScale: 3.0               // 最大缩放比例
});
```

### 4. 调整手柄

提供可视化的拖拽点：

```javascript
// 获取所有调整手柄位置
const handles = getGroupResizeHandles(groupId);

// 检查点是否在调整手柄内
const handleId = isPointInResizeHandle(groupId, pointX, pointY);
```

## 使用示例

### 基本组合操作

```javascript
const {
    groupSelectedElements,
    moveGroup,
    resizeGroup
} = useGroupManager(elements);

// 创建组合
const groupId = groupSelectedElements();

// 移动组合
moveGroup(groupId, 100, 50);

// 调整组合大小
resizeGroup(groupId, 50, 30, 'se');
```

### 智能大小调整

```javascript
const {
    startResizeGroup,
    updateResizeGroup,
    endResizeGroup
} = useGroupManager(elements);

// 鼠标按下时
const handleMouseDown = (event, groupId, anchor) => {
    startResizeGroup(groupId, event.clientX, event.clientY, anchor);
};

// 鼠标移动时
const handleMouseMove = (event, groupId) => {
    updateResizeGroup(groupId, event.clientX, event.clientY);
};

// 鼠标松开时
const handleMouseUp = (groupId) => {
    endResizeGroup(groupId);
};
```

### 约束调整

```javascript
const { constrainedResizeGroup } = useGroupManager(elements);

// 等比例缩放
constrainedResizeGroup(groupId, 100, 0, 'e', {
    maintainAspectRatio: true
});

// 网格对齐
constrainedResizeGroup(groupId, 50, 30, 'se', {
    snapToGrid: true,
    gridSize: 10
});
```

## 锚点说明

| 锚点 | 描述 | 调整行为 |
|------|------|----------|
| `nw` | 左上角 | 改变X、Y、宽度、高度 |
| `n`  | 上边   | 改变Y、高度 |
| `ne` | 右上角 | 改变Y、宽度、高度 |
| `e`  | 右边   | 改变宽度 |
| `se` | 右下角 | 改变宽度、高度 |
| `s`  | 下边   | 改变高度 |
| `sw` | 左下角 | 改变X、宽度、高度 |
| `w`  | 左边   | 改变X、宽度 |
| `center` | 中心点 | 等比例缩放 |

## 注意事项

1. **性能优化**：智能调整函数在拖拽过程中会频繁调用，建议使用节流或防抖
2. **边界检查**：所有调整函数都包含边界检查，防止过度缩放
3. **相对位置**：组合调整会保持元素的相对位置和比例关系
4. **错误处理**：函数包含完善的错误处理和日志记录

## 更新日志

### v2.0.0
- 新增智能大小调整功能
- 支持8个方向锚点 + 中心点
- 新增约束调整功能
- 新增调整手柄支持
- 优化锚点拖拽逻辑
- 改进相对位置计算
- 添加缩放限制和网格对齐
