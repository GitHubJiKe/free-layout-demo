<template>
    <OptimizedFreeLayoutApp
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
</template>

<script>
import { ref } from "vue";
import OptimizedFreeLayoutApp from "./components/OptimizedFreeLayoutApp.vue";

export default {
    name: "App",
    components: {
        OptimizedFreeLayoutApp,
    },
    setup() {
        const showGrid = ref(true);

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

<style lang="less">
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
