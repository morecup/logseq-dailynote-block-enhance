import '@logseq/libs'
import {BlockPageName} from "@logseq/libs/dist/LSPlugin";

/**
 * main entry
 */
export async function register() {
    const appUserConfig = await logseq.App.getUserConfigs()
    const inputEl = document.createElement('input')
    inputEl.type = 'text'
    inputEl.placeholder = 'Page name...'
    inputEl.classList.add('text-input-trigger')
    document.getElementById('app')!.appendChild(inputEl)

    // Function to apply theme based on Logseq theme mode
    function applyThemeStyle(mode: string) {
        const isDarkMode = mode === 'dark';
        Object.assign(inputEl.style, {
            color: isDarkMode ? '#fff' : '#000',
            backgroundColor: isDarkMode ? '#333' : '#fff',
            borderColor: isDarkMode ? '#777' : '#ccc',
            padding: '5px 10px',
            borderRadius: '5px',
            outline: 'none',
        });
    }

// Apply initial theme style
    applyThemeStyle(appUserConfig.preferredThemeMode);

    // Handle input keydown event
    inputEl.addEventListener('keydown', async (e) => {
        if (e.keyCode === 13) {  // Enter Key
            logseq.hideMainUI()
            await replaceToEmbedBlock(inputEl.value);
            // await logseq.Editor.insertAtEditingCursor(inputEl.value)
            inputEl.value = ''  // Clear input after insertion
        } else if (e.keyCode === 27) {  // ESC Key
            logseq.hideMainUI({restoreEditingCursor: true})
        }
    })

    // Register slash command to display input field
    logseq.Editor.registerSlashCommand(
        '📝 quick add non-existent embedded blocks', async () => {
            await showInputEle(inputEl);
        },
    )

    // Hide input field if click outside
    document.addEventListener('click', (e) => {
        if (!(e.target as HTMLElement).closest('.text-input-trigger')) {
            logseq.hideMainUI({restoreEditingCursor: true})
            inputEl.value = ''
            inputEl.style.display = 'none'  // Hide input field
        }
    })

    // Respond to theme changes
    logseq.App.onThemeModeChanged(({mode}) => {
        applyThemeStyle(mode);
    });

    logseq.App.registerCommandPalette(
        {
            // ToBottomOfPage
            key: "logseq-dailynote-enhance:Add non-existent embedded blocks",
            label: "Add non-existent embedded blocks",
            keybinding: {
                binding: "ctrl+q",
                mode: "global",
            },
        },
        async () => {
            await showInputEle(inputEl);
        }
    );
}
async function showInputEle(inputEl: HTMLInputElement){
    const position = await logseq.Editor.getEditingCursorPosition();
    if (position) {
        const { left, top, rect } = position;
        console.log(left, top, rect)
        Object.assign(inputEl.style, {
            position: 'absolute',
            top: `${top + rect.top + 22}px`,
            left: `${left + rect.left}px`,
            display: 'block',
            minWidth: '40px',
            minHeight: '20px',
            zIndex: 1000  // Ensure the input is on top
        });
    } else {
        Object.assign(inputEl.style, {
            position: 'fixed', // 使用 fixed 定位
            top: '50%',        // 垂直居中
            left: '50%',       // 水平居中
            transform: 'translate(-50%, -50%)', // 使用 transform 确保完全居中
            display: 'block',
            minWidth: '400px', // 设置最小宽度
            minHeight: '30px', // 设置最小高度
            zIndex: 1000 ,      // 确保输入框在最顶层
            fontSize: '14px',
        });
    }
    logseq.showMainUI()
    setTimeout(() => {
        inputEl.focus();  // Delay focus to ensure the input is visible
    }, 100);  // Adjust timing if necessary
}

async function replaceToEmbedBlock(pageName: string) {

    if (pageName) {
        const newPageBlock = await findOrCreatePage(pageName, "");
        if (!newPageBlock) {
            return null;
        }
        const nowBlockText = `{{embed ((${newPageBlock.uuid}))}}`
        const position = await logseq.Editor.getEditingCursorPosition();
        let currentBlock = null;
        if (position) {
            currentBlock = await logseq.Editor.getCurrentBlock();
        }else{
            const currentPage = await logseq.Editor.getCurrentPage();
            if (currentPage) {
                currentBlock = await logseq.Editor.insertBlock(currentPage.uuid, '', {sibling: false});
            }else{
                logseq.App.showMsg(`获取不到当前所在页面!`, 'error');
            }
        }
        // 获取当前激活的块
        if (currentBlock) {
            // 替换当前块内容
            await logseq.Editor.updateBlock(currentBlock.uuid, nowBlockText);
            console.log(currentBlock.uuid)
            // await logseq.Editor.reRenderBlocks([currentBlock.uuid]);

            await logseq.Editor.insertAtEditingCursor("")
            // await logseq.Editor.editBlock(currentBlock.uuid,{pos:0});
            await logseq.Editor.exitEditingMode(true)
            // setTimeout(()=>{
            //     logseq.Editor.exitEditingMode(true)
            // },100)
        }
    }
}

async function findOrCreatePage(pageName: BlockPageName, contentToAdd: string) {
    let page = await logseq.Editor.getPage(pageName);

    // 如果页面不存在，则创建页面
    if (!page) {
        await logseq.Editor.createPage(pageName, "", { redirect: false });
        page = await logseq.Editor.getPage(pageName);
        if (!page) {
            logseq.App.showMsg(`无法找到创建和找到${pageName}页面!`,'error')
            return null;
        }
    }

    const newBlock = await logseq.Editor.insertBlock(page!.uuid, contentToAdd, { sibling: false });
    return newBlock;
}