<template>
    <div class="selection-group-demo">
        <div class="toolbar">
            <h2>框选和分组功能演示</h2>
            <div class="toolbar-controls">
                <button @click="addElement" class="btn">添加元素</button>
                <button @click="clearElements" class="btn">清空元素</button>
                <button @click="resetLayout" class="btn">重置布局</button>
            </div>
            <div class="instructions">
                <p><strong>使用说明：</strong></p>
                <ul>
                    <li><strong>框选功能：</strong>在空白区域按住鼠标左键拖拽，会显示选择框</li>
                    <li><strong>完全覆盖选择：</strong>只有完全被选择框覆盖的元素才会被选中</li>
                    <li><strong>右键菜单：</strong>框选完成后，在画布上右键点击显示操作菜单</li>
                    <li><strong>成组操作：</strong>选择"成组"将多个元素组合为一个整体</li>
                    <li><strong>分组操作：</strong>分组后的元素可以整体拖拽和调整大小</li>
                    <li><strong>解组操作：</strong>选择"解组"可以解除组合</li>
                </ul>
            </div>
        </div>
        
        <div class="workspace-container">
            <FreeLayoutWorkspace
                :elements="elements"
                :show-grid="true"
                :enable-resize="true"
                :resize-handles="['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw']"
                :snap-distance="10"
                :enable-snap="true"
                @drag-start="handleDragStart"
                @drag-move="handleDragMove"
                @drag-end="handleDragEnd"
                @resize-start="handleResizeStart"
                @resize-move="handleResizeMove"
                @resize-end="handleResizeEnd"
            />
        </div>
        
        <div class="status-panel">
            <div class="status-item">
                <span class="label">元素数量:</span>
                <span class="value">{{ elements.length }}</span>
            </div>
            <div class="status-item">
                <span class="label">组合数量:</span>
                <span class="value">{{ groupCount }}</span>
            </div>
            <div class="status-item">
                <span class="label">选中元素:</span>
                <span class="value">{{ selectedCount }}</span>
            </div>
            <div class="status-item">
                <span class="label">当前操作:</span>
                <span class="value">{{ currentOperation }}</span>
            </div>
        </div>
    </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import FreeLayoutWorkspace from '../components/FreeLayoutWorkspace.vue';

export default {
    name: 'SelectionAndGroupDemo',
    components: {
        FreeLayoutWorkspace
    },
    setup() {
        const elements = ref([]);
        let nextId = 1;
        const currentOperation = ref('等待操作');

        // 生成示例元素 - 创建不同大小和位置的元素以便测试框选
        const generateSampleElements = () => {
            const sampleElements = [
                {
                    id: nextId++,
                    x: 50,
                    y: 50,
                    width: 120,
                    height: 80,
                    content: '小元素1'
                },
                {
                    id: nextId++,
                    x: 200,
                    y: 50,
                    width: 150,
                    height: 100,
                    content: '中等元素2'
                },
                {
                    id: nextId++,
                    x: 400,
                    y: 50,
                    width: 180,
                    height: 120,
                    content: '大元素3'
                },
                {
                    id: nextId++,
                    x: 50,
                    y: 200,
                    width: 100,
                    height: 60,
                    content: '小元素4'
                },
                {
                    id: nextId++,
                    x: 200,
                    y: 200,
                    width: 130,
                    height: 90,
                    content: '中等元素5'
                },
                {
                    id: nextId++,
                    x: 400,
                    y: 200,
                    width: 160,
                    height: 110,
                    content: '大元素6'
                }
            ];
            return sampleElements;
        };

        // 添加元素
        const addElement = () => {
            const newElement = {
                id: nextId++,
                x: Math.random() * 400 + 100,
                y: Math.random() * 300 + 100,
                width: 120 + Math.random() * 80,
                height: 80 + Math.random() * 60,
                content: `新元素 ${nextId - 1}`
            };
            elements.value.push(newElement);
            currentOperation.value = `添加了元素 ${newElement.content}`;
        };

        // 清空元素
        const clearElements = () => {
            elements.value = [];
            nextId = 1;
            currentOperation.value = '清空了所有元素';
        };

        // 重置布局
        const resetLayout = () => {
            elements.value = generateSampleElements();
            nextId = elements.value.length + 1;
            currentOperation.value = '重置了布局';
        };

        // 拖拽事件处理
        const handleDragStart = (element) => {
            currentOperation.value = `开始拖拽元素: ${element.content}`;
        };

        const handleDragMove = (element) => {
            currentOperation.value = `拖拽元素: ${element.content}`;
        };

        const handleDragEnd = (element) => {
            currentOperation.value = `完成拖拽元素: ${element.content}`;
        };

        // 调整大小事件处理
        const handleResizeStart = (element) => {
            currentOperation.value = `开始调整元素大小: ${element.content}`;
        };

        const handleResizeMove = (element) => {
            currentOperation.value = `调整元素大小: ${element.content}`;
        };

        const handleResizeEnd = (element) => {
            currentOperation.value = `完成调整元素大小: ${element.content}`;
        };

        // 计算属性
        const groupCount = computed(() => {
            // 这里需要根据实际的组合逻辑来计算
            return 0;
        });

        const selectedCount = computed(() => {
            // 这里需要根据实际的选中逻辑来计算
            return 0;
        });

        // 初始化
        onMounted(() => {
            elements.value = generateSampleElements();
            nextId = elements.value.length + 1;
            currentOperation.value = '页面已加载，可以开始操作';
        });

        return {
            elements,
            currentOperation,
            groupCount,
            selectedCount,
            addElement,
            clearElements,
            resetLayout,
            handleDragStart,
            handleDragMove,
            handleDragEnd,
            handleResizeStart,
            handleResizeMove,
            handleResizeEnd
        };
    }
};
</script>

<style lang="less" scoped>
.selection-group-demo {
    display: flex;
    flex-direction: column;
    height: 100vh;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.toolbar {
    padding: 20px;
    background: #f8f9fa;
    border-bottom: 1px solid #e9ecef;
    
    h2 {
        margin: 0 0 15px 0;
        color: #333;
    }
    
    .toolbar-controls {
        display: flex;
        gap: 10px;
        margin-bottom: 15px;
        
        .btn {
            padding: 8px 16px;
            background: #007bff;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            
            &:hover {
                background: #0056b3;
            }
        }
    }
    
    .instructions {
        background: white;
        padding: 15px;
        border-radius: 6px;
        border: 1px solid #e9ecef;
        
        p {
            margin: 0 0 10px 0;
            color: #495057;
        }
        
        ul {
            margin: 0;
            padding-left: 20px;
            color: #6c757d;
            
            li {
                margin-bottom: 5px;
                
                strong {
                    color: #495057;
                }
            }
        }
    }
}

.workspace-container {
    flex: 1;
    position: relative;
    overflow: hidden;
}

.status-panel {
    padding: 15px 20px;
    background: #f8f9fa;
    border-top: 1px solid #e9ecef;
    display: flex;
    gap: 30px;
    
    .status-item {
        display: flex;
        align-items: center;
        gap: 8px;
        
        .label {
            font-weight: 500;
            color: #495057;
        }
        
        .value {
            color: #007bff;
            font-weight: 600;
        }
    }
}
</style>
