<template>
    <div class="app-container">
        <div class="app-header">
            <h1>自由布局演示</h1>
            <div class="app-nav">
                <button 
                    @click="currentDemo = 'optimized'" 
                    :class="{ active: currentDemo === 'optimized' }"
                    class="nav-btn"
                >
                    优化版布局
                </button>
                <button 
                    @click="currentDemo = 'selection-group'" 
                    :class="{ active: currentDemo === 'selection-group' }"
                    class="nav-btn"
                >
                    框选和分组
                </button>
            </div>
        </div>
        
        <div class="app-content">
            <!-- 优化版布局演示 -->
            <OptimizedFreeLayoutApp
                v-if="currentDemo === 'optimized'"
                title="优化版自由布局Demo"
                :show-grid="showGrid"
                :enable-resize="true"
                :resize-handles="['se']"
                :snap-distance="10"
                :enable-snap="true"
                :enable-virtualization="true"
                :enable-spatial-grid="true"
                :enable-throttling="true"
                :enable-monitoring="true"
                :show-performance-panel="true"
                :performance-panel-position="'top-right'"
                :performance-panel-theme="'dark'"
                :performance-panel-compact="false"
                :show-config-panel="false"
                :item-height="80"
                :item-width="120"
                :buffer="5"
                @grid-toggled="toggleGrid"
                @drag-start="handleDragStart"
                @drag-move="handleDragMove"
                @drag-end="handleDragEnd"
                @resize-start="handleResizeStart"
                @resize-move="handleResizeMove"
                @resize-end="handleResizeEnd"
                @layout-exported="handleLayoutExported"
                @layout-imported="handleLayoutImported"
            >
                <template #element-content="{ element }">
                    <div class="custom-element-content">
                        <div class="element-title">{{ element.content }}</div>
                        <div class="element-info">
                            {{ element.width }} × {{ element.height }}
                        </div>
                    </div>
                </template>
            </OptimizedFreeLayoutApp>
            
            <!-- 框选和分组演示 -->
            <SelectionAndGroupDemo
                v-if="currentDemo === 'selection-group'"
            />
        </div>
    </div>
</template>

<script>
import { ref } from "vue";
import OptimizedFreeLayoutApp from "./components/OptimizedFreeLayoutApp.vue";
import SelectionAndGroupDemo from "./examples/SelectionAndGroupDemo.vue";

export default {
    name: "App",
    components: {
        OptimizedFreeLayoutApp,
        SelectionAndGroupDemo,
    },
    setup() {
        const showGrid = ref(true);
        const currentDemo = ref('optimized');

        const toggleGrid = () => {
            showGrid.value = !showGrid.value;
            console.log("网格状态:", showGrid.value ? "显示" : "隐藏");
        };

        const handleDragStart = (element, event) => {
            console.log("开始拖拽:", element.content);
        };

        const handleDragMove = (element, event) => {
            // 可以在这里添加拖拽过程中的逻辑
        };

        const handleDragEnd = (element) => {
            console.log("结束拖拽:", element.content);
        };

        const handleResizeStart = (element, event, direction) => {
            console.log("开始调整大小:", element.content, direction);
        };

        const handleResizeMove = (element, event) => {
            // 可以在这里添加调整大小过程中的逻辑
        };

        const handleResizeEnd = (element) => {
            console.log("结束调整大小:", element.content);
        };

        const handleLayoutExported = (layoutData) => {
            console.log("布局已导出:", layoutData);
        };

        const handleLayoutImported = (layoutData) => {
            console.log("布局已导入:", layoutData);
        };

        return {
            currentDemo,
            showGrid,
            toggleGrid,
            handleDragStart,
            handleDragMove,
            handleDragEnd,
            handleResizeStart,
            handleResizeMove,
            handleResizeEnd,
            handleLayoutExported,
            handleLayoutImported,
        };
    },
};
</script>

<style lang="less" scoped>
.app-container {
    height: 100vh;
    display: flex;
    flex-direction: column;
}

.app-header {
    background: #2c3e50;
    color: white;
    padding: 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    h1 {
        margin: 0;
        font-size: 24px;
        font-weight: 600;
    }
    
    .app-nav {
        display: flex;
        gap: 10px;
        
        .nav-btn {
            padding: 10px 20px;
            background: transparent;
            color: white;
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            transition: all 0.3s ease;
            
            &:hover {
                background: rgba(255, 255, 255, 0.1);
                border-color: rgba(255, 255, 255, 0.5);
            }
            
            &.active {
                background: #3498db;
                border-color: #3498db;
            }
        }
    }
}

.app-content {
    flex: 1;
    overflow: hidden;
}

.custom-element-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: #fff;

    .element-title {
        font-weight: 600;
        font-size: 14px;
        margin-bottom: 4px;
    }

    .element-info {
        font-size: 12px;
        opacity: 0.8;
    }
}
</style>
