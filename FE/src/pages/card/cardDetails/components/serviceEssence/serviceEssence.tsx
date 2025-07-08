import {Response} from "../../../../../types/cardType";
import useStyle from "./serviceEssence.css";
import {getHref} from "../../../../../services/str";
import Label from "../../../../../components/label/label";

const ServiceEssence = ({responses}: { responses: Response[] }) => {
    const serviceEssenceTitle = window.strings.cardDetails.serviceEssence
    const hrefWithMacro = window.config.redirects.responseFromCard;
    const classes = useStyle();

    return <div>
        <span className={classes.title}>{serviceEssenceTitle}</span>
        <div className={classes.linkList}>
            {responses.map((response: Response) => (
                <a key={response.id} className={classes.link} href={getHref(response.name, hrefWithMacro)}>
                    <Label key={response.id} response={response}/>
                </a>
            ))}
        </div>
    </div>
}
export default ServiceEssence;
