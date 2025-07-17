import {Response} from "../../../../../types/cardType";
import useStyle from "./serviceEssence.css";
import Label from "../../../../../components/label/label";
import {reRouteToResults} from "../../../../../services/routes/reRoute.ts";

const ServiceEssence = ({responses}: { responses: Response[] }) => {
    const serviceEssenceTitle = window.strings.cardDetails.serviceEssence
    const classes = useStyle();

    return <div>
        <span className={classes.title}>{serviceEssenceTitle}</span>
        <div className={classes.linkList}>
            {responses.map((response: Response) => (
                <a key={response.id} className={classes.link} onClick={() => reRouteToResults({responseFilter: [response.id]})}>
                    <Label key={response.id} response={response}/>
                </a>
            ))}
        </div>
    </div>
}
export default ServiceEssence;
