<template>
  <div class="group-resize-example">
    <h2>组合大小调整示例</h2>
    
    <div class="controls">
      <button @click="createGroup" :disabled="selectedElements.length < 2">
        创建组合 ({{ selectedElements.length }})
      </button>
      <button @click="ungroupSelected" :disabled="!hasSelectedGroups">
        解组选中
      </button>
      <button @click="clearSelectionHandler">清空选择</button>
    </div>

    <div class="workspace" 
         @mousedown="handleWorkspaceMouseDown"
         @mousemove="handleWorkspaceMouseMove"
         @mouseup="handleWorkspaceMouseUp">
      
      <!-- 可拖拽元素 -->
      <div
        v-for="element in elements"
        :key="element.id"
        :class="['element', { selected: isElementSelected(element.id) }]"
        :style="{
          left: element.x + 'px',
          top: element.y + 'px',
          width: element.width + 'px',
          height: element.height + 'px'
        }"
        @mousedown="handleElementMouseDown($event, element)"
      >
        {{ element.id }}
      </div>

      <!-- 组合边界框 -->
      <div
        v-for="[groupId] in elementGroups"
        :key="groupId"
        class="group-border"
        :style="{
          left: getGroupBounds(groupId)?.x + 'px',
          top: getGroupBounds(groupId)?.y + 'px',
          width: getGroupBounds(groupId)?.width + 'px',
          height: getGroupBounds(groupId)?.height + 'px'
        }"
      >
        <!-- 调整手柄 -->
        <div
          v-for="handle in getGroupResizeHandles(groupId)"
          :key="handle.id"
          :class="['resize-handle', `handle-${handle.id}`]"
          :style="{
            left: handle.x - (getGroupBounds(groupId)?.x || 0) + 'px',
            top: handle.y - (getGroupBounds(groupId)?.y || 0) + 'px',
            cursor: handle.cursor
          }"
          @mousedown="handleResizeStart($event, groupId, handle.id)"
        ></div>
      </div>

      <!-- 选择框 -->
      <div
        v-if="selectionBox.visible"
        class="selection-box"
        :style="{
          left: Math.min(selectionBox.startX, selectionBox.endX) + 'px',
          top: Math.min(selectionBox.startY, selectionBox.endY) + 'px',
          width: Math.abs(selectionBox.endX - selectionBox.startX) + 'px',
          height: Math.abs(selectionBox.endY - selectionBox.startY) + 'px'
        }"
      ></div>
    </div>

    <div class="info">
      <h3>使用说明</h3>
      <ul>
        <li>点击元素进行选择，按住Ctrl可多选</li>
        <li>拖拽空白区域进行框选</li>
        <li>选择多个元素后点击"创建组合"</li>
        <li>拖拽组合边界框的调整手柄来调整大小</li>
        <li>支持8个方向的调整手柄 + 中心点等比例缩放</li>
      </ul>
      
      <h3>当前状态</h3>
      <p>选中元素: {{ selectedElements.length }}</p>
      <p>组合数量: {{ elementGroups.size }}</p>
      <p v-if="currentResizeGroup">正在调整: 组合 {{ currentResizeGroup }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useGroupManager } from '../src/composables/useGroupManager';

// 示例元素数据
const elements = ref([
  { id: 'A', x: 100, y: 100, width: 80, height: 60 },
  { id: 'B', x: 200, y: 150, width: 100, height: 80 },
  { id: 'C', x: 350, y: 120, width: 90, height: 70 },
  { id: 'D', x: 150, y: 250, width: 120, height: 90 },
  { id: 'E', x: 300, y: 280, width: 70, height: 50 }
]);

// 使用组合管理器
const {
  selectedElementIds,
  groups,
  elementGroups,
  selectionBox,
  selectElement,
  clearSelection,
  startSelectionBox,
  updateSelectionBox,
  endSelectionBox,
  groupSelectedElements,
  ungroupSelectedGroups,
  getGroupBounds,
  getGroupResizeHandles,
  startResizeGroup,
  updateResizeGroup,
  endResizeGroup
} = useGroupManager(elements);

// 计算属性
const selectedElements = computed(() => 
  elements.value.filter(el => selectedElementIds.value.has(el.id))
);

const hasSelectedGroups = computed(() => {
  for (const elementId of selectedElementIds.value) {
    for (const [groupId, groupData] of groups.value) {
      if (groupData.elementIds && groupData.elementIds.includes(elementId)) {
        return true;
      }
    }
  }
  return false;
});

const isElementSelected = (elementId) => 
  selectedElementIds.value.has(elementId);

// 当前正在调整的组合
const currentResizeGroup = ref(null);

// 事件处理
const handleElementMouseDown = (event, element) => {
  event.stopPropagation();
  
  if (event.ctrlKey || event.metaKey) {
    // Ctrl+点击：添加到选择
    selectElement(element.id, true);
  } else {
    // 普通点击：选择当前元素
    selectElement(element.id, false);
  }
};

const handleWorkspaceMouseDown = (event) => {
  if (event.target === event.currentTarget) {
    startSelectionBox(event.offsetX, event.offsetY);
  }
};

const handleWorkspaceMouseMove = (event) => {
  if (selectionBox.visible) {
    updateSelectionBox(event.offsetX, event.offsetY);
  }
  
  // 处理组合大小调整
  if (currentResizeGroup.value) {
    updateResizeGroup(currentResizeGroup.value, event.clientX, event.clientY);
  }
};

const handleWorkspaceMouseUp = () => {
  if (selectionBox.visible) {
    endSelectionBox();
  }
  
  // 结束组合大小调整
  if (currentResizeGroup.value) {
    endResizeGroup(currentResizeGroup.value);
    currentResizeGroup.value = null;
  }
};

const handleResizeStart = (event, groupId, anchor) => {
  event.stopPropagation();
  currentResizeGroup.value = groupId;
  startResizeGroup(groupId, event.clientX, event.clientY, anchor);
};

const createGroup = () => {
  const groupId = groupSelectedElements();
  if (groupId) {
    console.log('组合创建成功:', groupId);
  }
};

const ungroupSelected = () => {
  ungroupSelectedGroups();
};

const clearSelectionHandler = () => {
  clearSelection();
};
</script>

<style scoped>
.group-resize-example {
  padding: 20px;
  font-family: Arial, sans-serif;
}

.controls {
  margin-bottom: 20px;
}

.controls button {
  margin-right: 10px;
  padding: 8px 16px;
  border: 1px solid #ccc;
  border-radius: 4px;
  background: #f5f5f5;
  cursor: pointer;
}

.controls button:hover {
  background: #e5e5e5;
}

.controls button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.workspace {
  position: relative;
  width: 800px;
  height: 500px;
  border: 2px solid #ddd;
  background: #fafafa;
  margin-bottom: 20px;
}

.element {
  position: absolute;
  border: 2px solid #007bff;
  background: rgba(0, 123, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: #007bff;
  cursor: move;
  user-select: none;
}

.element.selected {
  border-color: #28a745;
  background: rgba(40, 167, 69, 0.2);
  color: #28a745;
}

.group-border {
  position: absolute;
  border: 2px dashed #ffc107;
  background: rgba(255, 193, 7, 0.05);
  pointer-events: none;
}

.resize-handle {
  position: absolute;
  width: 8px;
  height: 8px;
  background: #ffc107;
  border: 1px solid #fff;
  border-radius: 50%;
  pointer-events: all;
  cursor: pointer;
}

.resize-handle:hover {
  background: #ffb300;
  transform: scale(1.2);
}

.selection-box {
  position: absolute;
  border: 1px dashed #007bff;
  background: rgba(0, 123, 255, 0.1);
  pointer-events: none;
}

.info {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 4px;
}

.info h3 {
  margin-top: 0;
  color: #495057;
}

.info ul {
  margin: 10px 0;
  padding-left: 20px;
}

.info p {
  margin: 5px 0;
  color: #6c757d;
}
</style>
