<template>
    <div
        :class="[
            'draggable-element',
            { dragging: isDragging },
            { resizing: isResizing },
            { selected: isSelected },
        ]"
        :style="elementStyle"
        @mousedown="handleMouseDown"
        @click="handleClick"
        @mouseup="handleMouseUp"
    >
        <div class="element-content">
            <slot :element="element">
                {{ element.content }}
            </slot>
        </div>

        <!-- 尺寸提示 -->
        <div class="size-hint" v-if="isResizing && showSizeHint">
            <span class="size-text">{{ element.width }} × {{ element.height }}</span>
        </div>

        <div class="element-handles" v-if="enableResize">
            <div
                v-for="handle in resizeHandlesArray"
                :key="handle"
                :class="['resize-handle', handle]"
                @mousedown.stop="handleResizeStart($event, handle)"
            ></div>
        </div>
    </div>
</template>

<script>
import { computed } from "vue";

export default {
    name: "DraggableElement",
    props: {
        element: {
            type: Object,
            required: true,
        },
        isDragging: {
            type: Boolean,
            default: false,
        },
        isResizing: {
            type: Boolean,
            default: false,
        },
        isSelected: {
            type: Boolean,
            default: false,
        },
        enableResize: {
            type: Boolean,
            default: true,
        },
        resizeHandles: {
            type: Array,
            default: () => ["n", "ne", "e", "se", "s", "sw", "w", "nw"],
        },
    },
    emits: ["mousedown", "click", "resize-start"],
    setup(props, { emit }) {
        const elementStyle = computed(() => ({
            left: `${props.element.x}px`,
            top: `${props.element.y}px`,
            width: `${props.element.width}px`,
            height: `${props.element.height}px`,
        }));

        const resizeHandlesArray = computed(() => {
            return Array.isArray(props.resizeHandles)
                ? props.resizeHandles
                : ["n", "ne", "e", "se", "s", "sw", "w", "nw"];
        });

        // 控制尺寸提示的显示
        const showSizeHint = computed(() => {
            return props.isResizing;
        });

        const handleMouseDown = (event) => {
            emit("mousedown", event, props.element);
        };

        const handleClick = (event) => {
            // 阻止事件冒泡，避免触发工作空间的点击事件
            event.stopPropagation();
            emit("click", event, props.element);
        };

        const handleMouseUp = (event) => {
            // 可以在这里添加鼠标抬起事件处理
        };

        const handleResizeStart = (event, position) => {
            emit("resize-start", event, props.element, position);
        };

        return {
            elementStyle,
            resizeHandlesArray,
            showSizeHint,
            handleMouseDown,
            handleClick,
            handleMouseUp,
            handleResizeStart,
        };
    },
};
</script>

<style lang="less" scoped>
.draggable-element {
    position: absolute;
    background: #4ecdc4;
    border: 2px solid #45b7aa;
    border-radius: 6px;
    cursor: move;
    user-select: none;
    transition: box-shadow 0.2s, border-color 0.2s;
    z-index: 1;

    &:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 10;
    }

    &.dragging {
        z-index: 1000 !important;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
        opacity: 0.9;
    }

    &.resizing {
        z-index: 1000 !important;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
    }

    &.selected {
        border-color: #ff6b6b;
        box-shadow: 0 0 0 2px rgba(255, 107, 107, 0.3);

        &:hover {
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15),
                0 0 0 2px rgba(255, 107, 107, 0.3);
        }
    }

    .element-content {
        color: #fff;
        font-weight: 500;
        text-align: center;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 10px;
    }

    .size-hint {
        position: absolute;
        top: -30px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.8);
        color: #fff;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: 500;
        pointer-events: none;
        z-index: 1001;
        white-space: nowrap;

        .size-text {
            font-family: 'Courier New', monospace;
        }
    }

    .element-handles {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;

        .resize-handle {
            width: 12px;
            height: 12px;
            background: #fff;
            border: 1px solid #45b7aa;
            border-radius: 2px;
            cursor: se-resize;
            position: absolute;
            pointer-events: auto;

            &.n {
                cursor: n-resize;
                top: -6px;
                left: 50%;
                transform: translateX(-50%);
            }

            &.ne {
                cursor: ne-resize;
                top: -6px;
                right: -6px;
            }

            &.e {
                cursor: e-resize;
                top: 50%;
                right: -6px;
                transform: translateY(-50%);
            }

            &.se {
                cursor: se-resize;
                bottom: -6px;
                right: -6px;
            }

            &.s {
                cursor: s-resize;
                bottom: -6px;
                left: 50%;
                transform: translateX(-50%);
            }

            &.sw {
                cursor: sw-resize;
                bottom: -6px;
                left: -6px;
            }

            &.w {
                cursor: w-resize;
                top: 50%;
                left: -6px;
                transform: translateY(-50%);
            }

            &.nw {
                cursor: nw-resize;
                top: -6px;
                left: -6px;
            }
        }
    }
}
</style>
