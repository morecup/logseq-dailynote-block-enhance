import '@logseq/libs'
import {register as quickDailyBlockRegister} from "./quickDailyBlock";
import {register as embedBlockShowPageNameRegister} from "./embedBlockShowPageName";
import {register as quickInsertAndCursorBlockAfterThisBlockRegister} from "./insertPageBlockAfterThisBlock";

/**
 * main entry
 */
async function main () {
  await quickDailyBlockRegister();
  await embedBlockShowPageNameRegister();
  await quickInsertAndCursorBlockAfterThisBlockRegister();
}

// bootstrap
logseq.ready(main).catch(console.error)