import {Situation} from "../../../../../types/cardType";
import useStyle from "./targetAudience.css";
import {getHref} from "../../../../../services/str";
import Label from "../../../../../components/label/label";

const TargetAudience = ({situations}: { situations: Situation[] }) => {
    const targetAudienceTitle = window.strings.cardDetails.targetAudience;
    const hrefWithMacro = window.config.redirects.situationFromCard

    const classes = useStyle();
    if (situations.length < 1) return <></>
    return <div>
        <span className={classes.title}>{targetAudienceTitle}</span>
        <div className={classes.linkList}>
            {situations.map(((situation: Situation) => (
                <a key={situation.id} className={classes.link} href={getHref(situation.name, hrefWithMacro)}>
                    <Label key={situation.id} situation={situation}/>
                </a>
            )))}
        </div>
    </div>
}
export default TargetAudience;
