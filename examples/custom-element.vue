<template>
    <div class="example-container">
        <h2>自定义元素内容示例</h2>
        <FreeLayoutApp
            title="自定义元素布局编辑器"
            :show-grid="true"
            :enable-resize="true"
            :snap-distance="10"
            :enable-snap="true"
            @drag-start="handleDragStart"
            @drag-end="handleDragEnd"
        >
            <template #element-content="{ element }">
                <div class="custom-element-content">
                    <div class="element-header">
                        <h3>{{ element.content }}</h3>
                        <div class="element-type">
                            {{ getElementType(element) }}
                        </div>
                    </div>
                    <div class="element-body">
                        <div class="element-info">
                            <span
                                >尺寸: {{ element.width }} ×
                                {{ element.height }}</span
                            >
                            <span
                                >位置: ({{ Math.round(element.x) }},
                                {{ Math.round(element.y) }})</span
                            >
                        </div>
                        <div class="element-actions">
                            <button
                                @click="editElement(element)"
                                class="action-btn"
                            >
                                编辑
                            </button>
                            <button
                                @click="deleteElement(element)"
                                class="action-btn delete"
                            >
                                删除
                            </button>
                        </div>
                    </div>
                </div>
            </template>
        </FreeLayoutApp>
    </div>
</template>

<script>
import FreeLayoutApp from "../src/components/FreeLayoutApp.vue";

export default {
    name: "CustomElementExample",
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
        getElementType(element) {
            // 根据元素内容判断类型
            if (element.content.includes("图片")) return "图片";
            if (element.content.includes("文本")) return "文本";
            if (element.content.includes("按钮")) return "按钮";
            return "元素";
        },
        editElement(element) {
            console.log("编辑元素:", element);
            // 这里可以实现编辑功能
        },
        deleteElement(element) {
            console.log("删除元素:", element);
            // 这里可以实现删除功能
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

.custom-element-content {
    display: flex;
    flex-direction: column;
    height: 100%;
    color: #fff;
    padding: 8px;
}

.element-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
}

.element-header h3 {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
}

.element-type {
    font-size: 10px;
    opacity: 0.8;
    background: rgba(255, 255, 255, 0.2);
    padding: 2px 6px;
    border-radius: 3px;
}

.element-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
}

.element-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 11px;
    opacity: 0.9;
}

.element-actions {
    display: flex;
    gap: 4px;
    margin-top: 8px;
}

.action-btn {
    padding: 2px 6px;
    font-size: 10px;
    border: none;
    border-radius: 3px;
    background: rgba(255, 255, 255, 0.2);
    color: #fff;
    cursor: pointer;
    transition: background 0.2s;
}

.action-btn:hover {
    background: rgba(255, 255, 255, 0.3);
}

.action-btn.delete {
    background: rgba(255, 107, 107, 0.8);
}

.action-btn.delete:hover {
    background: rgba(255, 107, 107, 1);
}
</style>
