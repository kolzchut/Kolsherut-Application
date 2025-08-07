import sendMessage from "./sendMessage/sendMessage.ts";
import {setSitemap} from "../store/data/dataSlice.ts";
import {store} from "../store/store.ts";

const setSiteMapInStore = async()=>{
    const response = await sendMessage({requestURL: window.config.routes.siteMapForModal, method:'get'});
    if (!response.success) throw new Error(`Failed to fetch sitemap: ${response.statusText}`);
    store.dispatch(setSitemap(response.data))
}

export default setSiteMapInStore;
