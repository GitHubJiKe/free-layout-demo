<template>
    <div class="example-container">
        <h2>基础使用示例</h2>
        <FreeLayoutApp
            title="基础布局编辑器"
            :show-grid="true"
            :enable-resize="true"
            :snap-distance="10"
            :enable-snap="true"
            @drag-start="handleDragStart"
            @drag-end="handleDragEnd"
            @layout-exported="handleLayoutExported"
        />
    </div>
</template>

<script>
import FreeLayoutApp from "../src/components/FreeLayoutApp.vue";

export default {
    name: "BasicUsageExample",
    components: {
        FreeLayoutApp,
    },
    methods: {
        handleDragStart(element, event) {
            console.log("开始拖拽:", element.content);
        },
        handleDragEnd(element) {
            console.log("结束拖拽:", element.content);
        },
        handleLayoutExported(layoutData) {
            console.log("布局已导出:", layoutData);
        },
    },
};
</script>

<style scoped>
.example-container {
    height: 100vh;
    padding: 20px;
    background: #f5f5f5;
}

h2 {
    margin: 0 0 20px 0;
    color: #333;
}
</style>
