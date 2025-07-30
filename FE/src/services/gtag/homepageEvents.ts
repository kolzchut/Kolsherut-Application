import {IGroup} from "../../types/homepageType";
import analytics from "./analytics";

const clickOnOptionalSearch = (group: IGroup) => {
    let what = 'homepage-example-regular';
    if (group.group_link.includes('emergency'))
        what = 'homepage-example-emergency';
    analytics.interactionEvent(what, 'homepage', group.group + group.response_id + group.situation_id)
}
const searchInputFocusEvent = () => analytics.interactionEvent('homepage-searchbar', 'homepage')


export default {
    clickOnOptionalSearch,
    searchInputFocusEvent
}
