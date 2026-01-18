import {IGroup, ILabel} from "../../../../types/homepageType";
import useStyles from './group.css'
import SearchLabel from "./searchLabel/searchLabel";
import linkIcon from '../../../../assets/linkIcon.svg';
import {changingPageToResults} from "../../../../store/shared/sharedSlice";
import {Response} from "../../../../types/cardType";
import {getColor} from "../../../../services/colorLogic";
import homepageAnalytics from "../../../../services/gtag/homepageEvents";
import {useTheme} from "react-jss";
import IDynamicThemeApp from "../../../../types/dynamicThemeApp";
import {createKeyboardHandler} from "../../../../services/keyboardHandler";
import buildUrlForSearchLabel from "./searchLabel/buildUrlForSearchLabel";

const Group = ({group}: { group: IGroup }) => {
    const showGroupLink = (group: IGroup) => group.group_link && (group.response_id || group.situation_id);
    const response: Response = {id: group.response_id,name: "", synonyms:[]}
    const wrapColor = getColor({response}).color
    const theme = useTheme<IDynamicThemeApp>();

    const classes = useStyles({wrapColor, showBorder: !!group.showBorder, accessibilityActive: theme.accessibilityActive});
    const onClick = (e?: React.MouseEvent<HTMLAnchorElement>) => {
        e?.preventDefault();
        const groupAsLabel: ILabel = {
            situation_id: group.situation_id,
            response_id: group.response_id,
            title: group.group,
            query: group.group_link
        }
        homepageAnalytics.clickOnOptionalSearch(group)
        changingPageToResults({value: groupAsLabel, removeOldFilters: true});
    }
    const href = buildUrlForSearchLabel({response: group.response_id, situation: group.situation_id, searchQuery:group.group_link});

    const handleKeyDown = createKeyboardHandler(onClick);

    return <div className={classes.group} key={group.group}>
        <h3 className={classes.groupTitle}>{group.group}
        {group.icon && <img src={`/icons/${group.icon}`} alt={`dynamic icon ${group.icon}`} className={classes.icon}/>}
        </h3>
        <div className={classes.optionalSearchValuesWrapper}>
            {group?.labels?.map((value: ILabel, index: number) => (
                <SearchLabel key={index} value={value}/>
            ))}
            {showGroupLink(group) && <a
                className={classes.groupLinkDiv}
                onClick={onClick}
                href={href}
                onKeyDown={handleKeyDown}
                tabIndex={0}
                role="button"
                aria-label={`Search for ${group.group_link}`}
            >
                <img src={linkIcon} alt={'Link Icon'} className={classes.linkIcon}/>
                <span>{group.group_link}</span>
            </a>}
        </div>
    </div>
}
export default Group;
