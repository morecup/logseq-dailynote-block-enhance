import '@logseq/libs'

// @ts-ignore
let doc = null;
export async function register() {
    // @ts-ignore
    const observer = new MutationObserver(async (mutationList) => {
        for (const mutation of mutationList) {
            // @ts-ignore
            for (const node of mutation.addedNodes) {
                // @ts-ignore
                if (!doc){
                    var currentNode = node
                    while (currentNode.parentNode) {
                        currentNode = currentNode.parentNode;
                    }
                    console.log(currentNode); // 最终会输出 <html> 元素
                    doc = currentNode
                }
                if (node.querySelectorAll) {
                    const cmInstances  = node.querySelectorAll(".CodeMirror")
                    for (const cmElement  of cmInstances ) {
                        const cm = cmElement.CodeMirror;
                        if (cm) {
                            cm.addKeyMap({
                                "Alt-Enter": async function(cm1: any) {
                                    console.log(cm1)
                                    await insertPageBlockAfterThisBlock();
                                }
                            });
                        }
                    }
                }
            }
        }
    })

    observer.observe(parent.document.body, {
        subtree: true,
        childList: true,
    })
    logseq.beforeunload(async () => {
        observer.disconnect()
    })

    logseq.App.registerCommandPalette({
        key: 'logseq-dailynote-enhance:Insert-a-page-block-after-the-current-block',
        label: 'Insert a page block after the current block',
        keybinding: {
            mode: 'global',
            binding: 'alt+enter'
        }
    }, async () => {
        await insertPageBlockAfterThisBlock();
    });
}
async function insertPageBlockAfterThisBlock(){
    const currentBlock = await logseq.Editor.getCurrentBlock();
    console.log(currentBlock)
    if (currentBlock) {
        // @ts-ignore
        const activeElement = doc.activeElement;
        console.log(activeElement);
        await dealEmbedBlock(currentBlock.uuid,activeElement)
    }
}

async function checkIsEmbedFirstBlock(element:Element,nowBlockId:string){
    const closestTreeEmbedBlockIdObject = await getClosestTreeEmbedBlockInFirstBlockByElement(element);
    if (closestTreeEmbedBlockIdObject){
        console.log(closestTreeEmbedBlockIdObject,nowBlockId);
        const is = closestTreeEmbedBlockIdObject.blockId == nowBlockId;
        if (!is) return null;
        return closestTreeEmbedBlockIdObject.embeddedBlockInFirstBlockElement;
    }
    return null;
}


async function dealEmbedBlock(nowBlockId:string,element:Element){
    const embeddedBlockInFirstBlockElement = await checkIsEmbedFirstBlock(element, nowBlockId);
    if (embeddedBlockInFirstBlockElement){
        const temp = await getClosestTreeEmbedBlockIdByElement(embeddedBlockInFirstBlockElement);
        if (temp){
            const{ blockId:parentId,embedBlockElement:parentEle} = temp
            await dealEmbedBlock(parentId,parentEle);
            return;
        }else{
            logseq.App.showMsg('这个错误不应该出现，除非程序结构改变，因为能获取到data-embed true的节点就必然证明它有对应的内嵌块节点','error')
        }
    }else{
    //     能找到父嵌入块，但不是第一个节点，或者根本找不到父嵌入块，直接在当前块下方插入
        const newBlock = await logseq.Editor.insertBlock(nowBlockId, "", { sibling: true });
        if (newBlock) {
            await logseq.Editor.editBlock(newBlock.uuid);
        }
    }

}
async function getClosestTreeEmbedBlockInFirstBlockByElement(element:Element){
    console.log(element);
    if (element) {
        // 寻找最接近的具有 data-embed="true" 属性的块元素
        const embeddedBlockInFirstBlockElement = findClosestDataEmbedWithoutLevel(<HTMLElement>element);

        if (embeddedBlockInFirstBlockElement) {
            // 获取块ID
            const blockId = embeddedBlockInFirstBlockElement.getAttribute('blockid');
            if (blockId){
                return {blockId,embeddedBlockInFirstBlockElement};
            }
            return null;
        }
    }
    return null;
}
async function getClosestTreeEmbedBlockIdByElement(embeddedBlockElement:Element){
    if (embeddedBlockElement) {
        if (embeddedBlockElement) {
            const embedBlockElement = embeddedBlockElement.closest('.block-content');
            if (embedBlockElement) {
                // 获取块ID
                const blockId = embedBlockElement.getAttribute('blockid');
                if (blockId) {
                    return {blockId,embedBlockElement};
                }
            }
        }
    }
    return null;
}
function findClosestDataEmbedWithoutLevel(startElement: HTMLElement | null): HTMLElement | null {
    let element: HTMLElement | null = startElement;

    // 查找符合条件的元素
    while (element) {
        // 使用 closest 方法找到最近的带有 data-embed 属性的元素
        let target: HTMLElement | null = element.closest('[data-embed="true"]');

        if (!target) {
            // 如果找不到符合条件的元素，返回 null
            return null;
        }

        // 检查该元素是否不具有 level 属性
        if (!target.hasAttribute('level')) {
            // 如果没有 level 属性，返回这个元素
            return target;
        }

        // 如果元素具有 level 属性，继续从该元素的父元素开始查找
        element = target.parentElement;
    }

    // 如果循环结束还没有找到，返回 null
    return null;
}