<template>
    <div class="free-layout-app">
        <div class="header">
            <h1>{{ title }}</h1>
            <div class="controls">
                <button @click="addElement">添加元素</button>
                <button @click="toggleGrid">切换网格</button>
                <button @click="clearElements">清空</button>
                <button @click="exportLayoutData">导出布局</button>
                <button @click="importLayoutData">导入布局</button>
            </div>
        </div>

        <div class="workspace-container">
            <FreeLayoutWorkspace
                :elements="elements"
                :show-grid="showGrid"
                :enable-resize="enableResize"
                :resize-handles="resizeHandles"
                :snap-distance="snapDistance"
                :enable-snap="enableSnap"
                @drag-start="handleDragStart"
                @drag-move="handleDragMove"
                @drag-end="handleDragEnd"
                @resize-start="handleResizeStart"
                @resize-move="handleResizeMove"
                @resize-end="handleResizeEnd"
            >
                <template #element-content="{ element }">
                    <slot name="element-content" :element="element">
                        {{ element.content }}
                    </slot>
                </template>
            </FreeLayoutWorkspace>
        </div>

        <div class="status">
            <span>元素数量: {{ elementCount }}</span>
            <span v-if="isDragging">拖拽中...</span>
            <span v-if="isResizing">调整大小中...</span>
            <span v-if="snapLinesCount > 0">吸附线: {{ snapLinesCount }}</span>
        </div>

        <!-- 导入布局的隐藏文件输入 -->
        <input
            ref="fileInput"
            type="file"
            accept=".json"
            style="display: none"
            @change="handleFileImport"
        />
    </div>
</template>

<script>
import { ref, computed, onMounted } from "vue";
import FreeLayoutWorkspace from "./FreeLayoutWorkspace.vue";
import { useElementManager } from "../composables/useElementManager";

export default {
    name: "FreeLayoutApp",
    components: {
        FreeLayoutWorkspace,
    },
    props: {
        title: {
            type: String,
            default: "自由布局Demo",
        },
        initialElements: {
            type: Array,
            default: () => [],
        },
        showGrid: {
            type: Boolean,
            default: true,
        },
        enableResize: {
            type: Boolean,
            default: true,
        },
        resizeHandles: {
            type: Array,
            default: () => ["se"],
        },
        snapDistance: {
            type: Number,
            default: 10,
        },
        enableSnap: {
            type: Boolean,
            default: true,
        },
    },
    emits: [
        "element-added",
        "element-removed",
        "element-updated",
        "layout-exported",
        "layout-imported",
        "drag-start",
        "drag-move",
        "drag-end",
        "resize-start",
        "resize-move",
        "resize-end",
    ],
    setup(props, { emit }) {
        const fileInput = ref(null);
        const isDragging = ref(false);
        const isResizing = ref(false);
        const snapLinesCount = ref(0);

        // 使用元素管理器
        const {
            elements,
            addElement,
            removeElement,
            updateElement,
            clearElements,
            getElementCount,
            exportLayout,
            importLayout,
        } = useElementManager({
            initialElements: props.initialElements,
        });

        // 计算属性
        const elementCount = computed(() => getElementCount());

        // 切换网格
        const toggleGrid = () => {
            // 这里可以通过emit通知父组件更新showGrid
            emit("grid-toggled");
        };

        // 处理拖拽开始
        const handleDragStart = (element, event) => {
            isDragging.value = true;
            emit("drag-start", element, event);
        };

        // 处理拖拽移动
        const handleDragMove = (element, event) => {
            emit("drag-move", element, event);
        };

        // 处理拖拽结束
        const handleDragEnd = (element) => {
            isDragging.value = false;
            emit("drag-end", element);
        };

        // 处理调整大小开始
        const handleResizeStart = (element, event, direction) => {
            isResizing.value = true;
            emit("resize-start", element, event, direction);
        };

        // 处理调整大小移动
        const handleResizeMove = (element, event) => {
            emit("resize-move", element, event);
        };

        // 处理调整大小结束
        const handleResizeEnd = (element) => {
            isResizing.value = false;
            emit("resize-end", element);
        };

        // 导出布局
        const exportLayoutData = () => {
            const layoutData = exportLayout();
            const dataStr = JSON.stringify(layoutData, null, 2);
            const dataBlob = new Blob([dataStr], { type: "application/json" });

            const link = document.createElement("a");
            link.href = URL.createObjectURL(dataBlob);
            link.download = `layout-${Date.now()}.json`;
            link.click();

            emit("layout-exported", layoutData);
        };

        // 导入布局
        const importLayoutData = () => {
            fileInput.value?.click();
        };

        // 处理文件导入
        const handleFileImport = (event) => {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const layoutData = JSON.parse(e.target.result);
                        importLayout(layoutData);
                        emit("layout-imported", layoutData);
                    } catch (error) {
                        console.error("导入布局失败:", error);
                        alert("导入布局失败，请检查文件格式");
                    }
                };
                reader.readAsText(file);
            }
        };

        // 初始化
        onMounted(() => {
            // 如果没有初始元素，添加一些默认元素
            if (elements.value.length === 0) {
                addElement();
                addElement();
                addElement();
            }
        });

        return {
            elements,
            addElement,
            removeElement,
            updateElement,
            clearElements,
            elementCount,
            isDragging,
            isResizing,
            snapLinesCount,
            fileInput,
            toggleGrid,
            handleDragStart,
            handleDragMove,
            handleDragEnd,
            handleResizeStart,
            handleResizeMove,
            handleResizeEnd,
            exportLayoutData,
            importLayoutData,
            handleFileImport,
        };
    },
};
</script>

<style lang="less" scoped>
.free-layout-app {
    height: 100vh;
    display: flex;
    flex-direction: column;
    background: #f5f5f5;

    .header {
        padding: 20px;
        background: #fff;
        border-bottom: 1px solid #e0e0e0;
        display: flex;
        justify-content: space-between;
        align-items: center;

        h1 {
            margin: 0;
            color: #333;
        }

        .controls {
            display: flex;
            gap: 10px;

            button {
                padding: 8px 16px;
                border: 1px solid #ddd;
                background: #fff;
                border-radius: 4px;
                cursor: pointer;
                transition: all 0.2s;

                &:hover {
                    background: #f0f0f0;
                    border-color: #ccc;
                }
            }
        }
    }

    .workspace-container {
        flex: 1;
        position: relative;
    }

    .status {
        padding: 10px 20px;
        background: #fff;
        border-top: 1px solid #e0e0e0;
        display: flex;
        gap: 20px;
        font-size: 14px;
        color: #666;
    }
}
</style>
