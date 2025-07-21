import {IGroup} from "../../types/homepageType.ts";
import {interactionEvent} from "./analytics.ts";

export const clickOnOptionalSearch = (group: IGroup) => {
    let what = 'homepage-example-regular';
    if (group.group_link.includes('emergency'))
        what = 'homepage-example-emergency';
    interactionEvent(what, 'homepage', group.group + group.response_id + group.situation_id)
}
export const searchInputFocusEvent = () => interactionEvent('homepage-searchbar', 'homepage')
