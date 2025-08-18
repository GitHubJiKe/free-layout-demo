<template>
    <Teleport to="body">
        <div
            v-if="visible"
            class="context-menu"
            :style="menuStyle"
            @click.stop
        >
            <div class="menu-header">
                <span class="menu-title">操作菜单</span>
                <button class="close-btn" @click="hideMenu">×</button>
            </div>
            
            <div class="menu-content">
                <!-- 成组选项 -->
                <div
                    v-if="canGroup"
                    class="menu-item"
                    @click="handleGroup"
                >
                    <span class="menu-icon">🔗</span>
                    <span class="menu-text">成组</span>
                </div>
                
                <!-- 解组选项 -->
                <div
                    v-if="canUngroup"
                    class="menu-item"
                    @click="handleUngroup"
                >
                    <span class="menu-icon">🔓</span>
                    <span class="menu-text">解组</span>
                </div>
                
                <!-- 分隔线 -->
                <div v-if="canGroup || canUngroup" class="menu-divider"></div>
                
                <!-- 删除选项 -->
                <div
                    class="menu-item danger"
                    @click="handleDelete"
                >
                    <span class="menu-icon">🗑️</span>
                    <span class="menu-text">删除</span>
                </div>
            </div>
        </div>
    </Teleport>
</template>

<script>
import { computed } from 'vue';

export default {
    name: 'ContextMenu',
    props: {
        visible: {
            type: Boolean,
            default: false
        },
        x: {
            type: Number,
            default: 0
        },
        y: {
            type: Number,
            default: 0
        },
        targetElements: {
            type: Array,
            default: () => []
        },
        canGroup: {
            type: Boolean,
            default: false
        },
        canUngroup: {
            type: Boolean,
            default: false
        }
    },
    emits: ['group', 'ungroup', 'delete', 'close'],
    setup(props, { emit }) {
        const menuStyle = computed(() => ({
            left: `${props.x}px`,
            top: `${props.y}px`
        }));

        const hideMenu = () => {
            emit('close');
        };

        const handleGroup = () => {
            emit('group');
            hideMenu();
        };

        const handleUngroup = () => {
            emit('ungroup');
            hideMenu();
        };

        const handleDelete = () => {
            emit('delete');
            hideMenu();
        };

        return {
            menuStyle,
            hideMenu,
            handleGroup,
            handleUngroup,
            handleDelete
        };
    }
};
</script>

<style lang="less" scoped>
.context-menu {
    position: fixed;
    z-index: 10000;
    background: #fff;
    border: 1px solid #ddd;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    min-width: 160px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    user-select: none;
}

.menu-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    border-bottom: 1px solid #eee;
    background: #f8f9fa;
    border-radius: 8px 8px 0 0;
}

.menu-title {
    font-weight: 500;
    color: #333;
}

.close-btn {
    background: none;
    border: none;
    font-size: 18px;
    color: #666;
    cursor: pointer;
    padding: 0;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    
    &:hover {
        background: #e9ecef;
        color: #333;
    }
}

.menu-content {
    padding: 4px 0;
}

.menu-item {
    display: flex;
    align-items: center;
    padding: 8px 12px;
    cursor: pointer;
    transition: background-color 0.2s;
    
    &:hover {
        background: #f8f9fa;
    }
    
    &.danger {
        color: #dc3545;
        
        &:hover {
            background: #f8d7da;
        }
    }
}

.menu-icon {
    margin-right: 8px;
    font-size: 16px;
    width: 20px;
    text-align: center;
}

.menu-text {
    color: #333;
}

.menu-divider {
    height: 1px;
    background: #eee;
    margin: 4px 0;
}
</style>
