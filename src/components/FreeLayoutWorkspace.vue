<template>
    <div
        class="free-layout-workspace"
        @mousemove="handleMouseMove"
        @mouseleave="handleMouseLeave"
        ref="workspaceRef"
    >
        <!-- 网格背景 -->
        <div class="grid" v-if="showGrid"></div>

        <!-- 吸附线 -->
        <div class="snap-lines" v-if="snapLines.length">
            <div
                v-for="line in snapLines"
                :key="line.id"
                :class="['snap-line', line.type]"
                :style="getSnapLineStyle(line)"
            ></div>
        </div>

        <!-- 可拖拽元素 -->
        <DraggableElement
            v-for="element in elements"
            :key="element.id"
            :element="element"
            :is-dragging="element.id === draggingId"
            :is-resizing="element.id === resizingId"
            :enable-resize="enableResize"
            :resize-handles="resizeHandles"
            @mousedown="handleElementMouseDown"
            @resize-start="handleResizeStart"
        >
            <template #default="{ element }">
                <slot name="element-content" :element="element">
                    {{ element.content }}
                </slot>
            </template>
        </DraggableElement>
    </div>
</template>

<script>
import { ref, computed } from "vue";
import DraggableElement from "./DraggableElement.vue";
import { useDraggable } from "../composables/useDraggable";

export default {
    name: "FreeLayoutWorkspace",
    components: {
        DraggableElement,
    },
    props: {
        elements: {
            type: Array,
            required: true,
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
        onDragStart: Function,
        onDragMove: Function,
        onDragEnd: Function,
        onResizeStart: Function,
        onResizeMove: Function,
        onResizeEnd: Function,
    },
    emits: [
        "update:elements",
        "drag-start",
        "drag-move",
        "drag-end",
        "resize-start",
        "resize-move",
        "resize-end",
    ],
    setup(props, { emit }) {
        const workspaceRef = ref(null);
        const elementsRef = ref(props.elements);

        // 使用拖拽hook
        const {
            draggingId,
            resizingId,
            snapLines,
            mousePos,
            startDrag,
            startResize,
            handleMouseMove,
            handleMouseLeave,
        } = useDraggable({
            elements: elementsRef,
            workspaceRef,
            snapDistance: props.snapDistance,
            enableSnap: props.enableSnap,
            onDragStart: (element, event) => {
                emit("drag-start", element, event);
                props.onDragStart?.(element, event);
            },
            onDragMove: (element, event) => {
                emit("drag-move", element, event);
                props.onDragMove?.(element, event);
            },
            onDragEnd: (element) => {
                emit("drag-end", element);
                props.onDragEnd?.(element);
            },
            onResizeStart: (element, event, direction) => {
                emit("resize-start", element, event, direction);
                props.onResizeStart?.(element, event, direction);
            },
            onResizeMove: (element, event) => {
                emit("resize-move", element, event);
                props.onResizeMove?.(element, event);
            },
            onResizeEnd: (element) => {
                emit("resize-end", element);
                props.onResizeEnd?.(element);
            },
        });

        const handleElementMouseDown = (event, element) => {
            startDrag(event, element, workspaceRef.value);
        };

        const handleResizeStart = (event, element, position) => {
            startResize(event, element, position);
        };

        const getSnapLineStyle = (line) => {
            const baseStyle = {
                position: "absolute",
                pointerEvents: "none",
                zIndex: 1000,
            };

            if (line.type === "horizontal") {
                return {
                    ...baseStyle,
                    top: `${line.y}px`,
                    left: `${line.x1}px`,
                    width: `${line.x2 - line.x1}px`,
                    height: line.style === "center" ? "2px" : "1px",
                    background: line.style === "center" ? "#4ecdc4" : "#ff6b6b",
                    opacity: line.style === "center" ? "0.9" : "0.8",
                };
            } else if (line.type === "vertical") {
                return {
                    ...baseStyle,
                    left: `${line.x}px`,
                    top: `${line.y1}px`,
                    width: line.style === "center" ? "2px" : "1px",
                    height: `${line.y2 - line.y1}px`,
                    background: line.style === "center" ? "#4ecdc4" : "#ff6b6b",
                    opacity: line.style === "center" ? "0.9" : "0.8",
                };
            } else if (line.type === "width-match" || line.type === "height-match") {
                return {
                    ...baseStyle,
                    left: `${line.x}px`,
                    top: `${line.y}px`,
                    width: "20px",
                    height: "20px",
                    background: "#ffd93d",
                    borderRadius: "50%",
                    opacity: "0.9",
                    transform: "translate(-50%, -50%)",
                };
            }

            return baseStyle;
        };

        return {
            workspaceRef,
            draggingId,
            resizingId,
            snapLines,
            mousePos,
            handleElementMouseDown,
            handleResizeStart,
            handleMouseMove: (event) =>
                handleMouseMove(event, workspaceRef.value),
            handleMouseLeave,
            getSnapLineStyle,
        };
    },
};
</script>

<style lang="less" scoped>
.free-layout-workspace {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: #fff;

    .grid {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-image: linear-gradient(
                rgba(0, 0, 0, 0.1) 1px,
                transparent 1px
            ),
            linear-gradient(90deg, rgba(0, 0, 0, 0.1) 1px, transparent 1px);
        background-size: 20px 20px;
        pointer-events: none;
    }

    .snap-lines {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        pointer-events: none;
        z-index: 10;

        .snap-line {
            position: absolute;
            background: #ff6b6b;
            opacity: 0.8;

            &.horizontal {
                height: 2px;
                margin-top: -1px;
            }

            &.vertical {
                width: 2px;
                margin-left: -1px;
            }
        }
    }
}
</style>
