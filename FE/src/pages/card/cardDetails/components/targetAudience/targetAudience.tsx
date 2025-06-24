import {Situation} from "../../../../../types/cardType";
import Link from "../../../../../components/link/link"
import useStyle from "./targetAudience.css";
const TargetAudience = ({situations}: { situations: Situation[] }) => {
    const targetAudienceTitle = window.strings.cardDetails.targetAudience;
    const classes = useStyle();
    if(situations.length < 1) return <></>
    return <div>
        <span className={classes.title}>{targetAudienceTitle}</span>
        <div className={classes.linkList}>
        {situations.map(((situation:Situation, index:number) => (
            <Link key={index} situation={situation} />
        )))}
        </div>
    </div>
}
export default TargetAudience;
