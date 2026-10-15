import Hotjar from '@hotjar/browser';
import logger from "../logger/logger";


const init = () => {
    if (/kolsherutbot/i.test(navigator.userAgent) || window.environment.state === "local") return;
    const {siteId, hotjarVersion} = window.config.hotjar;
    Hotjar.init(siteId, hotjarVersion);
    logger.log({message: `Initializing Hotjar on ${siteId} with version ${hotjarVersion}`});
}

export default {init}
