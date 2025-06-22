import {Response} from "../../../../../types/cardType";
import useStyle from "./serviceEssence.css";
import Link from "../../../../../components/link/link";

const ServiceEssence = ({responses}: { responses: Response[] }) => {
    const serviceEssenceTitle = window.strings.cardDetails.serviceEssence

    const classes = useStyle();

    return <div>
        <span className={classes.title}>{serviceEssenceTitle}</span>
        <div className={classes.linkList}>
            {responses.map((response => (
               <Link response={response}/>
            )))}
        </div>
    </div>
}
export default ServiceEssence;
