<template>
    <div class="group-example">
        <div class="toolbar">
            <h2>组合功能示例</h2>
            <div class="toolbar-controls">
                <button @click="addElement" class="btn">添加元素</button>
                <button @click="clearElements" class="btn">清空元素</button>
                <button @click="exportLayout" class="btn">导出布局</button>
                <button @click="importLayout" class="btn">导入布局</button>
            </div>
            <div class="instructions">
                <p><strong>使用说明：</strong></p>
                <ul>
                    <li>在空白区域拖拽鼠标进行框选，选择多个组件</li>
                    <li>点击单个组件进行单选</li>
                    <li>右键点击选中的元素显示操作菜单</li>
                    <li>选择"成组"将多个元素组合为一个整体</li>
                    <li>组合后的元素可以整体拖拽和调整大小</li>
                    <li>选择"解组"可以解除组合</li>
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
        </div>
    </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import FreeLayoutWorkspace from '../components/FreeLayoutWorkspace.vue';

export default {
    name: 'GroupExample',
    components: {
        FreeLayoutWorkspace
    },
    setup() {
        const elements = ref([]);
        let nextId = 1;

        // 生成示例元素
        const generateSampleElements = () => {
            const sampleElements = [];
            for (let i = 0; i < 6; i++) {
                sampleElements.push({
                    id: nextId++,
                    x: 100 + (i % 3) * 200,
                    y: 100 + Math.floor(i / 3) * 150,
                    width: 150,
                    height: 100,
                    content: `元素 ${i + 1}`
                });
            }
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
        };

        // 清空元素
        const clearElements = () => {
            elements.value = [];
            nextId = 1;
        };

        // 导出布局
        const exportLayout = () => {
            const layoutData = {
                elements: elements.value,
                timestamp: new Date().toISOString()
            };
            const dataStr = JSON.stringify(layoutData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = 'layout-export.json';
            link.click();
        };

        // 导入布局
        const importLayout = () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            input.onchange = (event) => {
                const file = event.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        try {
                            const layoutData = JSON.parse(e.target.result);
                            if (layoutData.elements && Array.isArray(layoutData.elements)) {
                                elements.value = layoutData.elements;
                                nextId = Math.max(...elements.value.map(el => el.id)) + 1;
                                console.log('布局导入成功');
                            }
                        } catch (error) {
                            console.error('导入失败:', error);
                            alert('导入失败，请检查文件格式');
                        }
                    };
                    reader.readAsText(file);
                }
            };
            input.click();
        };

        // 拖拽事件处理
        const handleDragStart = (element, event) => {
            console.log('开始拖拽:', element.content);
        };

        const handleDragMove = (element, event) => {
            // 拖拽过程中的处理
        };

        const handleDragEnd = (element) => {
            console.log('拖拽结束:', element.content);
        };

        // 调整大小事件处理
        const handleResizeStart = (element, event, direction) => {
            console.log('开始调整大小:', element.content, direction);
        };

        const handleResizeMove = (element, event) => {
            // 调整大小过程中的处理
        };

        const handleResizeEnd = (element) => {
            console.log('调整大小结束:', element.content);
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
        });

        return {
            elements,
            addElement,
            clearElements,
            exportLayout,
            importLayout,
            handleDragStart,
            handleDragMove,
            handleDragEnd,
            handleResizeStart,
            handleResizeMove,
            handleResizeEnd,
            groupCount,
            selectedCount
        };
    }
};
</script>

<style lang="less" scoped>
.group-example {
    display: flex;
    flex-direction: column;
    height: 100vh;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.toolbar {
    padding: 20px;
    background: #f8f9fa;
    border-bottom: 1px solid #dee2e6;
    
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
            background: #4ecdc4;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            transition: background-color 0.2s;
            
            &:hover {
                background: #45b7aa;
            }
        }
    }
    
    .instructions {
        background: white;
        padding: 15px;
        border-radius: 6px;
        border: 1px solid #dee2e6;
        
        p {
            margin: 0 0 10px 0;
            font-weight: 500;
        }
        
        ul {
            margin: 0;
            padding-left: 20px;
            
            li {
                margin-bottom: 5px;
                color: #666;
            }
        }
        
        kbd {
            background: #f1f3f4;
            border: 1px solid #dadce0;
            border-radius: 3px;
            padding: 2px 6px;
            font-size: 12px;
            font-family: monospace;
        }
    }
}

.workspace-container {
    flex: 1;
    position: relative;
    overflow: hidden;
}

.status-panel {
    display: flex;
    gap: 20px;
    padding: 15px 20px;
    background: #f8f9fa;
    border-top: 1px solid #dee2e6;
    
    .status-item {
        display: flex;
        align-items: center;
        gap: 8px;
        
        .label {
            font-weight: 500;
            color: #666;
        }
        
        .value {
            background: #4ecdc4;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-weight: 500;
            min-width: 30px;
            text-align: center;
        }
    }
}
</style>
