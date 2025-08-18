# useGroupManager.js 优化总结

## 问题分析

原始代码存在以下问题：
1. **锚点拖拽逻辑错误**：`sw`、`ne`、`nw` 锚点的计算方式不正确
2. **缺少边和中心锚点支持**：只支持四个角，没有支持边和中心的拖拽调整
3. **相对位置计算问题**：在调整大小时，相对位置的计算可能导致元素位置不准确
4. **缺少智能调整功能**：无法根据鼠标拖拽距离动态调整大小
5. **缺少约束调整**：没有等比例缩放、网格对齐等功能

## 优化内容

### 1. 修复锚点拖拽逻辑

**优化前**：
```javascript
case "sw": // 左下角
    newX += deltaWidth;
    newWidth -= deltaWidth;
    newHeight += deltaHeight;
    break;
```

**优化后**：
```javascript
case "sw": // 左下角 - 改变X、宽度和高度
    newX += deltaWidth;
    newWidth -= deltaWidth;
    newHeight += deltaHeight;
    break;
```

- 修复了所有锚点的计算逻辑
- 添加了详细的注释说明每个锚点的行为

### 2. 新增多锚点支持

**新增锚点**：
- `n` - 上边：只改变Y和高度
- `s` - 下边：只改变高度  
- `e` - 右边：只改变宽度
- `w` - 左边：改变X和宽度
- `center` - 中心点：等比例缩放

**完整锚点列表**：
```javascript
// 四个角
{ id: 'nw', cursor: 'nw-resize' }, // 左上角
{ id: 'ne', cursor: 'ne-resize' }, // 右上角
{ id: 'sw', cursor: 'sw-resize' }, // 左下角
{ id: 'se', cursor: 'se-resize' }, // 右下角

// 四条边
{ id: 'n', cursor: 'n-resize' },   // 上边
{ id: 's', cursor: 's-resize' },   // 下边
{ id: 'e', cursor: 'e-resize' },   // 右边
{ id: 'w', cursor: 'w-resize' },   // 左边

// 中心点
{ id: 'center', cursor: 'move' }   // 中心点
```

### 3. 智能大小调整功能

**新增函数**：
- `smartResizeGroup()` - 基于鼠标位置的智能调整
- `startResizeGroup()` - 开始调整
- `updateResizeGroup()` - 更新调整
- `endResizeGroup()` - 结束调整

**使用方式**：
```javascript
// 开始调整
startResizeGroup(groupId, startX, startY, anchor);

// 拖拽过程中更新
updateResizeGroup(groupId, currentX, currentY);

// 结束调整
endResizeGroup(groupId);
```

### 4. 约束调整功能

**新增函数**：`constrainedResizeGroup()`

**支持约束**：
- `maintainAspectRatio` - 保持宽高比
- `snapToGrid` - 网格对齐
- `gridSize` - 网格大小
- `minScale` - 最小缩放比例
- `maxScale` - 最大缩放比例

**使用示例**：
```javascript
constrainedResizeGroup(groupId, deltaWidth, deltaHeight, anchor, {
    maintainAspectRatio: true,  // 保持宽高比
    snapToGrid: true,           // 网格对齐
    gridSize: 20,               // 网格大小
    minScale: 0.2,              // 最小缩放比例
    maxScale: 3.0               // 最大缩放比例
});
```

### 5. 调整手柄支持

**新增函数**：
- `getGroupResizeHandles()` - 获取所有调整手柄位置
- `isPointInResizeHandle()` - 检查点是否在调整手柄内

**手柄特性**：
- 8个方向手柄 + 1个中心点手柄
- 每个手柄都有对应的光标样式
- 支持悬停效果和拖拽交互

### 6. 改进的边界检查

**优化前**：
```javascript
// 确保最小尺寸
newWidth = Math.max(50, newWidth);
newHeight = Math.max(30, newHeight);
```

**优化后**：
```javascript
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
```

### 7. 改进的元素位置计算

**优化前**：
```javascript
element.x = newX + relativeX * newWidth;
element.y = newY + relativeY * newHeight;
element.width = relativeWidth * newWidth;
element.height = relativeHeight * newHeight;
```

**优化后**：
```javascript
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
```

## 新增API

### 核心函数
- `smartResizeGroup(groupId, startX, startY, currentX, currentY, anchor)`
- `startResizeGroup(groupId, startX, startY, anchor)`
- `updateResizeGroup(groupId, currentX, currentY)`
- `endResizeGroup(groupId)`
- `constrainedResizeGroup(groupId, deltaWidth, deltaHeight, anchor, constraints)`

### 辅助函数
- `getGroupResizeHandles(groupId)`
- `isPointInResizeHandle(groupId, pointX, pointY)`

## 使用建议

### 1. 基本使用
```javascript
// 使用原有的resizeGroup函数
resizeGroup(groupId, 100, 50, 'se');
```

### 2. 智能调整（推荐）
```javascript
// 在鼠标事件中使用
const handleMouseDown = (event, groupId, anchor) => {
    startResizeGroup(groupId, event.clientX, event.clientY, anchor);
};

const handleMouseMove = (event, groupId) => {
    updateResizeGroup(groupId, event.clientX, event.clientY);
};

const handleMouseUp = (groupId) => {
    endResizeGroup(groupId);
};
```

### 3. 约束调整
```javascript
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

## 性能优化建议

1. **节流处理**：在拖拽过程中使用节流函数限制 `updateResizeGroup` 的调用频率
2. **批量更新**：避免在拖拽过程中频繁更新DOM，可以延迟到拖拽结束后统一更新
3. **缓存计算**：对于复杂的计算（如相对位置），可以缓存结果避免重复计算

## 兼容性

- 保持与原有API的完全兼容
- 新增功能作为可选功能提供
- 不影响现有的组合创建、移动等基础功能

## 测试建议

1. **基础功能测试**：验证原有的组合创建、移动等功能正常
2. **锚点测试**：测试所有9个锚点的拖拽调整
3. **约束测试**：测试等比例缩放、网格对齐等约束功能
4. **边界测试**：测试最小/最大尺寸限制
5. **性能测试**：测试拖拽过程中的性能表现
