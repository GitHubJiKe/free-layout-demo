<template>
    <div
        v-if="visible"
        class="group-border"
        :style="borderStyle"
        :data-group-id="groupId"
        @mousedown="handleMouseDown"
    >
        <!-- 调整大小的手柄 -->
        <div
            v-for="handle in resizeHandles"
            :key="handle"
            :class="['resize-handle', handle]"
            @mousedown.stop="handleResizeStart($event, handle)"
        ></div>
        
        <!-- 组合信息显示 -->
        <div class="group-info">
            <span class="group-count">{{ elementCount }} 个组件</span>
        </div>
    </div>
</template>

<script>
import { computed } from 'vue';

export default {
    name: 'GroupBorder',
    props: {
        visible: {
            type: Boolean,
            default: false
        },
        bounds: {
            type: Object,
            default: () => ({ x: 0, y: 0, width: 0, height: 0 })
        },
        elementCount: {
            type: Number,
            default: 0
        },
        groupId: {
            type: [Number, String],
            required: true
        }
    },
    emits: ['mousedown', 'resize-start'],
    setup(props, { emit }) {
        const resizeHandles = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'];
        
        const borderStyle = computed(() => ({
            left: `${props.bounds.x}px`,
            top: `${props.bounds.y}px`,
            width: `${props.bounds.width}px`,
            height: `${props.bounds.height}px`
        }));

        const handleMouseDown = (event) => {
            emit('mousedown', event);
        };

        const handleResizeStart = (event, handle) => {
            emit('resize-start', event, handle);
        };

        return {
            resizeHandles,
            borderStyle,
            handleMouseDown,
            handleResizeStart
        };
    }
};
</script>

<style lang="less" scoped>
.group-border {
    position: absolute;
    border: 2px dashed #4ecdc4;
    background: rgba(78, 205, 196, 0.05);
    pointer-events: auto;
    z-index: 100;
    
    &:hover {
        border-color: #45b7aa;
        background: rgba(78, 205, 196, 0.1);
    }
}

.resize-handle {
    width: 12px;
    height: 12px;
    background: #4ecdc4;
    border: 2px solid #fff;
    border-radius: 50%;
    position: absolute;
    cursor: pointer;
    transition: all 0.2s;
    
    &:hover {
        background: #45b7aa;
        transform: scale(1.2);
    }
    
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

.group-info {
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
    white-space: nowrap;
    pointer-events: none;
}

.group-count {
    font-family: 'Courier New', monospace;
}
</style>
