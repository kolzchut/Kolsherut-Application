import {IGroup, ILabel} from "../../../../types/homepageType";
import useStyles from './group.css'
import SearchLabel from "./searchLabel/searchLabel";
import linkIcon from '../../../../assets/linkIcon.svg';
import {settingToResults} from "../../../../store/shared/sharedSlice";
import {Response} from "../../../../types/cardType.ts";
import {getColor} from "../../../../services/colorLogic.ts";
import {clickOnOptionalSearch} from "../../../../services/gtag/homepageEvents.ts";

const Group = ({group}: { group: IGroup }) => {
    const showGroupLink = (group: IGroup) => group.group_link && (group.response_id || group.situation_id);
    const response: Response = {id: group.response_id,name: "", synonyms:[]}
    const wrapColor = getColor({response}).color
    const classes = useStyles({wrapColor, showBorder: !!group.showBorder});
    const onClick = () => {
        const groupAsLabel: ILabel = {
            situation_id: group.situation_id,
            response_id: group.response_id,
            title: group.group,
            query: group.group_link
        }
        clickOnOptionalSearch(group)
        settingToResults({value: groupAsLabel, removeOldFilters: true});
    }

    return <div className={classes.group} key={group.group}>
        <h3 className={classes.groupTitle}>{group.group}
        {group.icon && <img src={`/icons/${group.icon}`} alt={`dynamic icon ${group.icon}`} className={classes.icon}/>}
        </h3>
        <div className={classes.optionalSearchValuesWrapper}>
            {group?.labels?.map((value: ILabel, index: number) => (
                <SearchLabel key={index} value={value}/>
            ))}
            {showGroupLink(group) && <div className={classes.groupLinkDiv} onClick={onClick}>
                <img src={linkIcon} alt={'Link Icon'}/>
                <span>{group.group_link}</span>
            </div>}
        </div>
    </div>
}
export default Group;
