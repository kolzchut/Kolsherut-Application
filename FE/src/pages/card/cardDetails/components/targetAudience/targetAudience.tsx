import {Situation} from "../../../../../types/cardType";
import useStyle from "./targetAudience.css";
import Label from "../../../../../components/label/label";
import {reRouteToResults} from "../../../../../services/routes/reRoute.ts";

const TargetAudience = ({situations}: { situations: Situation[] }) => {
    const targetAudienceTitle = window.strings.cardDetails.targetAudience;

    const classes = useStyle();
    if (situations.length < 1) return <></>
    return <div>
        <span className={classes.title}>{targetAudienceTitle}</span>
        <div className={classes.linkList}>
            {situations.map(((situation: Situation) => (
                <a key={situation.id} className={classes.link} onClick={() => reRouteToResults({situationFilter: [situation.id]})}>
                    <Label key={situation.id} situation={situation}/>
                </a>
            )))}
        </div>
    </div>
}
export default TargetAudience;
