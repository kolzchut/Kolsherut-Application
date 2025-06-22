import {Situation} from "../../../../../types/cardType";
import Link from "../../../../../components/link/link"
import useStyle from "./targetAudience.css";
const TargetAudience = ({situations}: { situations: Situation[] }) => {
    const targetAudienceTitle = window.strings.cardDetails.targetAudience;
    const classes = useStyle();

    return <div>
        <span>{targetAudienceTitle}</span>
        <div className={classes.linkList}>
        {situations.map((situation => (
            <Link situation={situation} />
        )))}
        </div>
    </div>
}
export default TargetAudience;
