import {Situation} from "../../../../../types/cardType";
import useStyle from "./targetAudience.css";
import Label from "../../../../../components/label/label";
import {getHrefForResults} from "../../../../../services/href";
import {settingToResults} from "../../../../../store/shared/sharedSlice.ts";
import {useSelector} from 'react-redux';
import {isAccessibilityActive} from "../../../../../store/general/general.selector.ts";

const TargetAudience = ({situations}: { situations: Situation[] }) => {
    const targetAudienceTitle = window.strings.cardDetails.targetAudience;

    const accessibilityActive = useSelector(isAccessibilityActive);
    const classes = useStyle({accessibilityActive});
    if (situations.length < 1) return <></>
    return <div>
        <span className={classes.title}>{targetAudienceTitle}</span>
        <div className={classes.linkList}>
            {situations.map((situation: Situation) => {
                const href = getHrefForResults({searchQuery: situation.name, situationFilter: [situation.id]});
                const onClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
                    e.preventDefault()
                    settingToResults({
                        value: {situation_id: situation.id, query: situation.name},
                        removeOldFilters: true
                    });
                }
                return <a href={href} key={situation.id} className={classes.link}
                          onClick={(e: React.MouseEvent<HTMLAnchorElement>) => onClick(e)}>
                    <Label key={situation.id} situation={situation}/>
                </a>
            })}
        </div>
    </div>
}
export default TargetAudience;
