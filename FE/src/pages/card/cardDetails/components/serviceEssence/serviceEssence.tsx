import {Response} from "../../../../../types/cardType";
import useStyle from "./serviceEssence.css";
import Label from "../../../../../components/label/label";
import {reRouteToResults} from "../../../../../services/routes/reRoute";
import {getHrefForResults} from "../../../../../services/href";

const ServiceEssence = ({responses}: { responses: Response[] }) => {
    const serviceEssenceTitle = window.strings.cardDetails.serviceEssence
    const classes = useStyle();

    return <div>
        <span className={classes.title}>{serviceEssenceTitle}</span>
        <div className={classes.linkList}>
            {responses.map((response: Response) => {
                const href = getHrefForResults({responseFilter: [response.id]});
                const onClick = () => {
                    reRouteToResults({responseFilter: [response.id]})
                    return false;
                }
                return <a href={href} key={response.id} className={classes.link}
                          onClick={onClick}>
                    <Label key={response.id} response={response}/>
                </a>
            })}
        </div>
    </div>
}
export default ServiceEssence;
