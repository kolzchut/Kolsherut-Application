import {IGroup} from "../../types/homepageType";
import analytics from "./analytics";

const clickOnOptionalSearch = (group: IGroup) => {
    let event = 'homepage-example-regular';
    if (group.group_link.includes('emergency'))
        event = 'homepage-example-emergency';
    analytics.logEvent({event,params:{group:group.group, responseId:group.response_id, situationId:group.situation_id}});
}
const searchInputFocusEvent = () => analytics.logEvent({event:'homepage-searchbar-focus',params:{}})

const openedSiteMapEvent = () => {analytics.logEvent({
    event: "open-sitemap",
    params: {}
})}

export default {
    clickOnOptionalSearch,
    openedSiteMapEvent,
    searchInputFocusEvent
}
