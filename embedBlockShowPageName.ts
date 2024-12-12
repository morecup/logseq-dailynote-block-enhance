import '@logseq/libs'

export async function register() {

    const observer = new MutationObserver(async (mutationList) => {
        for (const mutation of mutationList) {
            // @ts-ignore
            for (const node of mutation.addedNodes) {
                if (node.querySelectorAll) {
                    const nodes = node.querySelectorAll(".ls-block")
                    for (const n of nodes) {
                        const dataEmbed = n.getAttribute('data-embed');
                        if (!dataEmbed) continue

                        const level = n.getAttribute('level');
                        if (level) continue

                        const blockid = n.getAttribute('blockid');
                        const block = await logseq.Editor.getBlock(blockid);
                        if (!block || !block.page) continue;

                        const page = await logseq.Editor.getPage(block.page.id);
                        if (!page) continue;

                        const pageNameSpan = document.createElement('a');
                        pageNameSpan.textContent = `${page.name}`;
                        // 设置半透明效果
                        pageNameSpan.style.opacity = '0.4';
// 设置字体尺寸比父元素小，这里假设父元素的字体大小为父级定义的 100%，我们设为 90%
                        pageNameSpan.style.fontSize = '90%';
                        // pageNameSpan.style.cssText = "font-size: smaller; color: gray; margin-left: 8px;";
                        // 添加点击事件监听器
                        pageNameSpan.addEventListener('click', function() {
                            // 使用 Logseq API 跳转到指定的页面
                            logseq.App.pushState('page', { name: page.name });
                        });
                        // n 是已存在的父节点
// pageNameSpan 是您想要添加的新元素
                        if (n.firstChild) {
                            // 如果 n 有子节点，将 pageNameSpan 插入为第一个子节点
                            n.insertBefore(pageNameSpan, n.firstChild);
                        } else {
                            // 如果 n 没有任何子节点，直接追加
                            n.appendChild(pageNameSpan);
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
}