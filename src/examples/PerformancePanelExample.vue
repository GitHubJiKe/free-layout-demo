<template>
    <div class="performance-panel-example">
        <h2>性能面板组件示例</h2>
        
        <div class="controls">
            <button @click="togglePanel">切换面板</button>
            <button @click="changePosition">切换位置</button>
            <button @click="changeTheme">切换主题</button>
            <button @click="toggleCompact">切换紧凑模式</button>
        </div>

        <div class="demo-container">
            <!-- 基础用法 -->
            <PerformancePanel
                :visible="showPanel"
                :metrics="performanceMetrics"
                :element-count="elementCount"
                :total-elements="totalElements"
                :position="panelPosition"
                :theme="panelTheme"
                :compact="panelCompact"
                :show-close-button="true"
                @close="handleClose"
            />

            <!-- 自定义指标 -->
            <PerformancePanel
                v-if="showCustomPanel"
                :visible="showCustomPanel"
                :metrics="customMetrics"
                :position="'bottom-left'"
                :theme="'light'"
                title="自定义监控"
                :show-fps="false"
                :show-render-time="false"
                :show-drag-time="false"
                :show-memory-usage="false"
                :show-element-count="false"
                :show-total-elements="false"
                @close="handleCustomClose"
            >
                <template #custom-metrics>
                    <div class="metric-item">
                        <span class="metric-label">自定义指标1:</span>
                        <span class="metric-value">{{ customMetrics.custom1 }}</span>
                    </div>
                    <div class="metric-item">
                        <span class="metric-label">自定义指标2:</span>
                        <span class="metric-value">{{ customMetrics.custom2 }}</span>
                    </div>
                </template>
            </PerformancePanel>
        </div>
    </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from "vue";
import PerformancePanel from "../components/PerformancePanel.vue";

export default {
    name: "PerformancePanelExample",
    components: {
        PerformancePanel,
    },
    setup() {
        const showPanel = ref(true);
        const showCustomPanel = ref(false);
        const panelPosition = ref("top-right");
        const panelTheme = ref("dark");
        const panelCompact = ref(false);

        const performanceMetrics = ref({
            fps: 60,
            renderTime: 16.7,
            dragTime: 0,
            memoryUsage: 45,
        });

        const customMetrics = ref({
            custom1: "值1",
            custom2: "值2",
        });

        const elementCount = ref(10);
        const totalElements = ref(100);

        // 模拟性能数据更新
        let animationId;
        const updateMetrics = () => {
            performanceMetrics.value = {
                fps: Math.floor(Math.random() * 30) + 30,
                renderTime: Math.random() * 20 + 10,
                dragTime: Math.random() * 5,
                memoryUsage: Math.floor(Math.random() * 50) + 20,
            };

            elementCount.value = Math.floor(Math.random() * 50) + 5;
            totalElements.value = Math.floor(Math.random() * 200) + 50;

            customMetrics.value = {
                custom1: `值${Math.floor(Math.random() * 100)}`,
                custom2: `值${Math.floor(Math.random() * 100)}`,
            };

            animationId = requestAnimationFrame(updateMetrics);
        };

        const togglePanel = () => {
            showPanel.value = !showPanel.value;
        };

        const changePosition = () => {
            const positions = ["top-right", "top-left", "bottom-right", "bottom-left"];
            const currentIndex = positions.indexOf(panelPosition.value);
            const nextIndex = (currentIndex + 1) % positions.length;
            panelPosition.value = positions[nextIndex];
        };

        const changeTheme = () => {
            panelTheme.value = panelTheme.value === "dark" ? "light" : "dark";
        };

        const toggleCompact = () => {
            panelCompact.value = !panelCompact.value;
        };

        const handleClose = () => {
            showPanel.value = false;
        };

        const handleCustomClose = () => {
            showCustomPanel.value = false;
        };

        onMounted(() => {
            updateMetrics();
        });

        onUnmounted(() => {
            if (animationId) {
                cancelAnimationFrame(animationId);
            }
        });

        return {
            showPanel,
            showCustomPanel,
            panelPosition,
            panelTheme,
            panelCompact,
            performanceMetrics,
            customMetrics,
            elementCount,
            totalElements,
            togglePanel,
            changePosition,
            changeTheme,
            toggleCompact,
            handleClose,
            handleCustomClose,
        };
    },
};
</script>

<style lang="less" scoped>
.performance-panel-example {
    padding: 20px;

    .controls {
        margin-bottom: 20px;
        display: flex;
        gap: 10px;
        flex-wrap: wrap;

        button {
            padding: 8px 16px;
            border: 1px solid #ddd;
            border-radius: 4px;
            background: #fff;
            cursor: pointer;
            transition: all 0.2s;

            &:hover {
                background: #f5f5f5;
            }
        }
    }

    .demo-container {
        position: relative;
        height: 400px;
        border: 1px solid #ddd;
        border-radius: 8px;
        background: #f9f9f9;
    }
}
</style>
