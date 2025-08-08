<template>
    <div v-if="visible" class="performance-panel" :class="position">
        <div class="performance-header" @mousedown="startDrag">
            <span class="panel-title">{{ title }}</span>
            <button v-if="showCloseButton" @click="close" class="close-btn">
                ×
            </button>
        </div>
        <div class="performance-metrics">
            <div v-if="showFps" class="metric-item">
                <span class="metric-label">FPS:</span>
                <span class="metric-value" :class="getFpsClass(metrics.fps)">
                    {{ metrics.fps }}
                </span>
            </div>
            <div v-if="showRenderTime" class="metric-item">
                <span class="metric-label">渲染时间:</span>
                <span class="metric-value">
                    {{ metrics.renderTime.toFixed(1) }}ms
                </span>
            </div>
            <div v-if="showDragTime" class="metric-item">
                <span class="metric-label">拖拽时间:</span>
                <span class="metric-value">
                    {{ metrics.dragTime.toFixed(1) }}ms
                </span>
            </div>
            <div
                v-if="showMemoryUsage && metrics.memoryUsage > 0"
                class="metric-item"
            >
                <span class="metric-label">内存:</span>
                <span class="metric-value"> {{ metrics.memoryUsage }}MB </span>
            </div>
            <div v-if="showElementCount" class="metric-item">
                <span class="metric-label">可见元素:</span>
                <span class="metric-value">{{ elementCount }}</span>
            </div>
            <div v-if="showTotalElements" class="metric-item">
                <span class="metric-label">总元素:</span>
                <span class="metric-value">{{ totalElements }}</span>
            </div>
            <slot name="custom-metrics"></slot>
        </div>
    </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from "vue";

export default {
    name: "PerformancePanel",
    props: {
        // 显示控制
        visible: {
            type: Boolean,
            default: true,
        },
        title: {
            type: String,
            default: "性能监控",
        },
        showCloseButton: {
            type: Boolean,
            default: false,
        },

        // 位置控制
        position: {
            type: String,
            default: "top-right", // top-right, top-left, bottom-right, bottom-left
            validator: (value) =>
                [
                    "top-right",
                    "top-left",
                    "bottom-right",
                    "bottom-left",
                ].includes(value),
        },

        // 指标显示控制
        showFps: {
            type: Boolean,
            default: true,
        },
        showRenderTime: {
            type: Boolean,
            default: true,
        },
        showDragTime: {
            type: Boolean,
            default: true,
        },
        showMemoryUsage: {
            type: Boolean,
            default: true,
        },
        showElementCount: {
            type: Boolean,
            default: true,
        },
        showTotalElements: {
            type: Boolean,
            default: false,
        },

        // 数据
        metrics: {
            type: Object,
            default: () => ({
                fps: 0,
                renderTime: 0,
                dragTime: 0,
                memoryUsage: 0,
            }),
        },
        elementCount: {
            type: Number,
            default: 0,
        },
        totalElements: {
            type: Number,
            default: 0,
        },

        // 样式配置
        theme: {
            type: String,
            default: "dark", // dark, light
        },
        compact: {
            type: Boolean,
            default: false,
        },
    },
    emits: ["close", "drag-start", "drag-move", "drag-end"],
    setup(props, { emit }) {
        const isDragging = ref(false);
        const dragOffset = ref({ x: 0, y: 0 });
        const panelRef = ref(null);

        // FPS 状态类
        const getFpsClass = (fps) => {
            if (fps >= 55) return "fps-excellent";
            if (fps >= 45) return "fps-good";
            if (fps >= 30) return "fps-warning";
            return "fps-poor";
        };

        // 拖拽功能
        const startDrag = (event) => {
            if (!props.draggable) return;

            isDragging.value = true;
            const rect = panelRef.value.getBoundingClientRect();
            dragOffset.value = {
                x: event.clientX - rect.left,
                y: event.clientY - rect.top,
            };

            document.addEventListener("mousemove", handleDragMove);
            document.addEventListener("mouseup", handleDragEnd);

            emit("drag-start", event);
        };

        const handleDragMove = (event) => {
            if (!isDragging.value) return;

            const x = event.clientX - dragOffset.value.x;
            const y = event.clientY - dragOffset.value.y;

            if (panelRef.value) {
                panelRef.value.style.left = `${x}px`;
                panelRef.value.style.top = `${y}px`;
            }

            emit("drag-move", event);
        };

        const handleDragEnd = (event) => {
            isDragging.value = false;
            document.removeEventListener("mousemove", handleDragMove);
            document.removeEventListener("mouseup", handleDragEnd);

            emit("drag-end", event);
        };

        const close = () => {
            emit("close");
        };

        onUnmounted(() => {
            document.removeEventListener("mousemove", handleDragMove);
            document.removeEventListener("mouseup", handleDragEnd);
        });

        return {
            isDragging,
            panelRef,
            getFpsClass,
            startDrag,
            close,
        };
    },
};
</script>

<style lang="less" scoped>
.performance-panel {
    position: absolute;
    background: rgba(0, 0, 0, 0.85);
    color: #fff;
    border-radius: 8px;
    font-size: 12px;
    z-index: 1000;
    min-width: 180px;
    backdrop-filter: blur(8px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    user-select: none;
    transition: all 0.2s ease;

    &.top-right {
        top: 10px;
        right: 10px;
    }

    &.top-left {
        top: 10px;
        left: 10px;
    }

    &.bottom-right {
        bottom: 10px;
        right: 10px;
    }

    &.bottom-left {
        bottom: 10px;
        left: 10px;
    }

    &.light {
        background: rgba(255, 255, 255, 0.95);
        color: #333;
        border: 1px solid rgba(0, 0, 0, 0.1);
    }

    &.compact {
        .performance-header {
            padding: 6px 8px;
        }

        .performance-metrics {
            padding: 6px 8px;
            gap: 3px;
        }

        .metric-item {
            gap: 4px;
        }
    }

    .performance-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 12px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        cursor: move;

        .panel-title {
            font-weight: 600;
            font-size: 13px;
            color: #4ecdc4;
        }

        .close-btn {
            background: none;
            border: none;
            color: #fff;
            font-size: 16px;
            cursor: pointer;
            padding: 0;
            width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            transition: background-color 0.2s;

            &:hover {
                background: rgba(255, 255, 255, 0.1);
            }
        }
    }

    .performance-metrics {
        padding: 8px 12px;
        display: flex;
        flex-direction: column;
        gap: 4px;

        .metric-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 8px;

            .metric-label {
                font-weight: 500;
                opacity: 0.8;
                white-space: nowrap;
            }

            .metric-value {
                font-family: "Courier New", monospace;
                font-weight: 600;
                white-space: nowrap;

                &.fps-excellent {
                    color: #4ecdc4;
                }

                &.fps-good {
                    color: #45b7aa;
                }

                &.fps-warning {
                    color: #f39c12;
                }

                &.fps-poor {
                    color: #e74c3c;
                }
            }
        }
    }

    // 拖拽时的样式
    &:hover {
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
    }
}

// 响应式设计
@media (max-width: 768px) {
    .performance-panel {
        min-width: 160px;
        font-size: 11px;

        .performance-header {
            padding: 6px 8px;
        }

        .performance-metrics {
            padding: 6px 8px;
        }
    }
}
</style>
