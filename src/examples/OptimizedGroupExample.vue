<template>
    <div class="optimized-group-example">
        <div class="toolbar">
            <h2>优化版组合功能示例</h2>
            <div class="toolbar-controls">
                <button @click="addElement" class="btn">添加元素</button>
                <button @click="clearElements" class="btn">清空元素</button>
                <button @click="exportLayout" class="btn">导出布局</button>
                <button @click="importLayout" class="btn">导入布局</button>
                <button @click="generateTestElements(50)" class="btn test-btn">生成测试元素</button>
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
                    <li>支持虚拟化渲染和性能优化</li>
                </ul>
            </div>
        </div>
        
        <div class="workspace-container">
            <OptimizedFreeLayoutApp
                title="优化版组合功能演示"
                :initial-elements="initialElements"
                :show-grid="true"
                :enable-resize="true"
                :resize-handles="['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw']"
                :snap-distance="10"
                :enable-snap="true"
                :enable-virtualization="true"
                :enable-spatial-grid="true"
                :enable-throttling="true"
                :enable-monitoring="true"
                :show-performance-panel="true"
                :performance-panel-position="'top-right'"
                :performance-panel-theme="'light'"
                :performance-panel-compact="false"
                @group-elements="handleGroupElements"
                @ungroup-elements="handleUngroupElements"
                @delete-elements="handleDeleteElements"
                @layout-exported="handleLayoutExported"
                @layout-imported="handleLayoutImported"
            >
                <template #element-content="{ element }">
                    <div class="custom-element-content">
                        <div class="element-title">{{ element.content }}</div>
                        <div class="element-info">
                            {{ element.width }} × {{ element.height }}
                        </div>
                        <div class="element-position">
                            ({{ element.x }}, {{ element.y }})
                        </div>
                    </div>
                </template>
            </OptimizedFreeLayoutApp>
        </div>
    </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import OptimizedFreeLayoutApp from '../components/OptimizedFreeLayoutApp.vue';

export default {
    name: 'OptimizedGroupExample',
    components: {
        OptimizedFreeLayoutApp
    },
    setup() {
        const initialElements = ref([]);
        let nextId = 1;

        // 生成示例元素
        const generateSampleElements = () => {
            const sampleElements = [];
            for (let i = 0; i < 8; i++) {
                sampleElements.push({
                    id: nextId++,
                    x: 100 + (i % 4) * 200,
                    y: 100 + Math.floor(i / 4) * 150,
                    width: 150 + Math.random() * 50,
                    height: 100 + Math.random() * 30,
                    content: `元素 ${i + 1}`
                });
            }
            return sampleElements;
        };

        // 添加元素
        const addElement = () => {
            const newElement = {
                id: nextId++,
                x: Math.random() * 600 + 100,
                y: Math.random() * 400 + 100,
                width: 120 + Math.random() * 80,
                height: 80 + Math.random() * 60,
                content: `新元素 ${nextId - 1}`
            };
            initialElements.value.push(newElement);
        };

        // 清空元素
        const clearElements = () => {
            initialElements.value = [];
            nextId = 1;
        };

        // 生成测试元素
        const generateTestElements = (count) => {
            clearElements();
            for (let i = 0; i < count; i++) {
                const element = {
                    id: nextId++,
                    x: Math.random() * 2000,
                    y: Math.random() * 1500,
                    width: 100 + Math.random() * 100,
                    height: 60 + Math.random() * 80,
                    content: `测试元素 ${i + 1}`
                };
                initialElements.value.push(element);
            }
        };

        // 导出布局
        const exportLayout = () => {
            const layoutData = {
                elements: initialElements.value,
                timestamp: new Date().toISOString()
            };
            const dataStr = JSON.stringify(layoutData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = 'optimized-layout-export.json';
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
                                initialElements.value = layoutData.elements;
                                nextId = Math.max(...initialElements.value.map(el => el.id)) + 1;
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

        // 组合事件处理
        const handleGroupElements = (groupId, elements) => {
            console.log('组合成功:', groupId, elements);
        };

        const handleUngroupElements = (groupId) => {
            console.log('解组成功:', groupId);
        };

        const handleDeleteElements = (elementIds) => {
            console.log('删除元素:', elementIds);
            // 从初始元素中删除
            initialElements.value = initialElements.value.filter(
                el => !elementIds.includes(el.id)
            );
        };

        // 布局事件处理
        const handleLayoutExported = (layoutData) => {
            console.log('布局导出成功:', layoutData);
        };

        const handleLayoutImported = (layoutData) => {
            console.log('布局导入成功:', layoutData);
        };

        // 初始化
        onMounted(() => {
            initialElements.value = generateSampleElements();
        });

        return {
            initialElements,
            addElement,
            clearElements,
            generateTestElements,
            exportLayout,
            importLayout,
            handleGroupElements,
            handleUngroupElements,
            handleDeleteElements,
            handleLayoutExported,
            handleLayoutImported
        };
    }
};
</script>

<style lang="less" scoped>
.optimized-group-example {
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
            
            &.test-btn {
                background: #ff6b6b;
                
                &:hover {
                    background: #ee5a52;
                }
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
    }
}

.workspace-container {
    flex: 1;
    position: relative;
    overflow: hidden;
}

.custom-element-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    padding: 10px;
    
    .element-title {
        font-weight: 600;
        font-size: 14px;
        margin-bottom: 5px;
        text-align: center;
    }
    
    .element-info {
        font-size: 12px;
        color: rgba(255, 255, 255, 0.8);
        margin-bottom: 3px;
    }
    
    .element-position {
        font-size: 10px;
        color: rgba(255, 255, 255, 0.6);
        font-family: 'Courier New', monospace;
    }
}
</style>
