import { ref } from "vue";

export function useElementManager(options = {}) {
    const {
        initialElements = [],
        generateId = () => Date.now() + Math.random(),
    } = options;

    const elements = ref(initialElements);
    let elementCounter = 0;

    // 添加元素
    const addElement = (elementData = {}) => {
        // 获取窗口宽度，限制元素位置
        const windowWidth = window.innerWidth || 1200;
        const windowHeight = window.innerHeight || 800;
        const maxX = Math.max(0, windowWidth - 170); // 170 = 120(元素宽度) + 50(边距)
        const maxY = Math.max(0, windowHeight - 130); // 130 = 80(元素高度) + 50(边距)

        const element = {
            id: generateId(),
            x: Math.min(Math.random() * 400 + 50, maxX),
            y: Math.min(Math.random() * 300 + 50, maxY),
            width: 120,
            height: 80,
            content: `元素 ${++elementCounter}`,
            startX: 0,
            startY: 0,
            ...elementData,
        };

        elements.value.push(element);
        return element;
    };

    // 移除元素
    const removeElement = (elementId) => {
        const index = elements.value.findIndex((el) => el.id === elementId);
        if (index > -1) {
            elements.value.splice(index, 1);
            return true;
        }
        return false;
    };

    // 更新元素
    const updateElement = (elementId, updates) => {
        const element = elements.value.find((el) => el.id === elementId);
        if (element) {
            Object.assign(element, updates);
            return true;
        }
        return false;
    };

    // 获取元素
    const getElement = (elementId) => {
        return elements.value.find((el) => el.id === elementId);
    };

    // 清空所有元素
    const clearElements = () => {
        elements.value = [];
        elementCounter = 0;
    };

    // 批量添加元素
    const addElements = (elementsList) => {
        elementsList.forEach((elementData) => {
            addElement(elementData);
        });
    };

    // 获取元素数量
    const getElementCount = () => {
        return elements.value.length;
    };

    // 导出布局数据
    const exportLayout = () => {
        return elements.value.map((element) => ({
            id: element.id,
            x: element.x,
            y: element.y,
            width: element.width,
            height: element.height,
            content: element.content,
        }));
    };

    // 导入布局数据
    const importLayout = (layoutData) => {
        clearElements();
        layoutData.forEach((elementData) => {
            addElement(elementData);
        });
    };

    // 复制元素
    const duplicateElement = (elementId) => {
        const originalElement = getElement(elementId);
        if (originalElement) {
            const newElement = {
                ...originalElement,
                id: generateId(),
                x: originalElement.x + 20,
                y: originalElement.y + 20,
                content: `${originalElement.content} (副本)`,
            };
            elements.value.push(newElement);
            return newElement;
        }
        return null;
    };

    // 移动元素到最前
    const bringToFront = (elementId) => {
        const element = getElement(elementId);
        if (element) {
            const index = elements.value.findIndex((el) => el.id === elementId);
            if (index > -1) {
                elements.value.splice(index, 1);
                elements.value.push(element);
            }
        }
    };

    // 移动元素到最后
    const sendToBack = (elementId) => {
        const element = getElement(elementId);
        if (element) {
            const index = elements.value.findIndex((el) => el.id === elementId);
            if (index > -1) {
                elements.value.splice(index, 1);
                elements.value.unshift(element);
            }
        }
    };

    // 生成测试元素 - 优化版本
    const generateTestElements = (count = 1000) => {
        console.log(`开始生成 ${count} 个测试元素...`);
        clearElements();
        const testElements = [];

        // 获取窗口尺寸，限制元素位置
        const windowWidth = window.innerWidth || 1200;
        const windowHeight = window.innerHeight || 800;
        const maxX = Math.max(0, windowWidth - 170); // 170 = 120(元素宽度) + 50(边距)
        const maxY = Math.max(0, windowHeight - 130); // 130 = 80(元素高度) + 50(边距)

        // 计算网格布局参数
        const elementsPerRow = Math.floor(maxX / 140); // 140 = 120(宽度) + 20(间距)
        const elementsPerCol = Math.floor(maxY / 100); // 100 = 80(高度) + 20(间距)
        const totalGridElements = elementsPerRow * elementsPerCol;

        // 如果网格布局不够容纳所有元素，使用随机布局
        const useRandomLayout = count > totalGridElements;

        console.log(
            `使用${
                useRandomLayout ? "随机" : "网格"
            }布局，最大X: ${maxX}, 最大Y: ${maxY}`,
        );

        // 使用批量创建来提高性能
        const batchSize = 100;
        const batches = Math.ceil(count / batchSize);

        for (let batch = 0; batch < batches; batch++) {
            const batchStart = batch * batchSize;
            const batchEnd = Math.min(batchStart + batchSize, count);

            for (let i = batchStart; i < batchEnd; i++) {
                let x, y;

                if (useRandomLayout) {
                    // 随机布局
                    x = Math.random() * maxX;
                    y = Math.random() * maxY;
                } else {
                    // 网格布局
                    const row = Math.floor(i / elementsPerRow);
                    const col = i % elementsPerRow;
                    x = col * 140 + 20; // 20px 边距
                    y = row * 100 + 20; // 20px 边距
                }

                const element = {
                    id: generateId(),
                    x: Math.max(0, Math.min(x, maxX)),
                    y: Math.max(0, Math.min(y, maxY)),
                    width: 120,
                    height: 80,
                    content: `测试元素 ${i + 1}`,
                    startX: 0,
                    startY: 0,
                };

                testElements.push(element);
            }
        }

        // 批量添加元素
        elements.value = testElements;
        elementCounter = count;

        console.log(`成功生成 ${testElements.length} 个测试元素`);
        return testElements;
    };

    return {
        elements,
        addElement,
        removeElement,
        updateElement,
        getElement,
        clearElements,
        addElements,
        getElementCount,
        exportLayout,
        importLayout,
        duplicateElement,
        bringToFront,
        sendToBack,
        generateTestElements,
    };
}
