<template>
    <div
        v-if="visible"
        class="selection-box"
        :style="boxStyle"
    ></div>
</template>

<script>
import { computed } from 'vue';

export default {
    name: 'SelectionBox',
    props: {
        visible: {
            type: Boolean,
            default: false
        },
        startX: {
            type: Number,
            default: 0
        },
        startY: {
            type: Number,
            default: 0
        },
        endX: {
            type: Number,
            default: 0
        },
        endY: {
            type: Number,
            default: 0
        }
    },
    setup(props) {
        const boxStyle = computed(() => {
            const left = Math.min(props.startX, props.endX);
            const top = Math.min(props.startY, props.endY);
            const width = Math.abs(props.endX - props.startX);
            const height = Math.abs(props.endY - props.startY);
            
            return {
                left: `${left}px`,
                top: `${top}px`,
                width: `${width}px`,
                height: `${height}px`
            };
        });

        return {
            boxStyle
        };
    }
};
</script>

<style lang="less" scoped>
.selection-box {
    position: absolute;
    border: 2px dashed #4ecdc4;
    background: rgba(78, 205, 196, 0.1);
    pointer-events: none;
    z-index: 50;
    border-radius: 2px;
    
    // 添加动画效果
    animation: selectionBoxFade 0.2s ease-out;
}

@keyframes selectionBoxFade {
    from {
        opacity: 0;
        transform: scale(0.8);
    }
    to {
        opacity: 1;
        transform: scale(1);
    }
}
</style>
