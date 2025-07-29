import {Situation} from "../../../../../types/cardType";
import useStyle from "./targetAudience.css";
import Label from "../../../../../components/label/label";
import {reRouteToResults} from "../../../../../services/routes/reRoute";
import {getHrefForResults} from "../../../../../services/href";

const TargetAudience = ({situations}: { situations: Situation[] }) => {
    const targetAudienceTitle = window.strings.cardDetails.targetAudience;

    const classes = useStyle();
    if (situations.length < 1) return <></>
    return <div>
        <span className={classes.title}>{targetAudienceTitle}</span>
        <div className={classes.linkList}>
            {situations.map((situation: Situation) => {
                const href = getHrefForResults({situationFilter: [situation.id]});
                const onClick = () => {
                    reRouteToResults({situationFilter: [situation.id]})
                    return false;
                }
                return <a href={href} key={situation.id} className={classes.link}
                          onClick={onClick}>
                    <Label key={situation.id} situation={situation}/>
                </a>
            })}
        </div>
    </div>
}
export default TargetAudience;
