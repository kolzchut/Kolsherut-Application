import {IGroup, ILabel} from "../../../../types/homepageType";
import useStyles from './group.css'
import SearchLabel from "./searchLabel/searchLabel";
import linkIcon from '../../../../assets/linkIcon.svg';
import {settingToResults} from "../../../../store/shared/sharedSlice";

const Group = ({group}: { group: IGroup }) => {
    const showGroupLink = (group: IGroup) => group.group_link && (group.response_id || group.situation_id);
    const classes = useStyles();
    const onClick = () => {
        const groupAsLabel: ILabel = {
            situation_id: group.situation_id,
            response_id: group.response_id,
            title: group.group,
            query: group.group_link
        }
        settingToResults({value: groupAsLabel});
    }

    return <div className={classes.group} key={group.group}>
        <h3 className={classes.groupTitle}>{group.group}</h3>
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
