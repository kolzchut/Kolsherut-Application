import {Response, Situation} from "../../types/cardType";
import {getHref} from "./linkLogic";
import useStyle from "./link.css";
import linkSvg from '../../assets/icon-arrow-top-right-gray-4.svg'
import situationSvg from '../../assets/icon-person-blue-5.svg'
import getColorByResponses from "../../services/map/style/getColorByResponses";

const Link = ({response, situation, extra} :{response?: Response, situation?: Situation, extra: number}) => {
    let occasion =null;
    let hrefWithMacro = '';
    const isResponse = !!response;
    const responseColor = (response && getColorByResponses([response]).background) || "#ffffff";
    const situationColor = window.config.situationsColors;
    const color: string = isResponse ? responseColor : situationColor;
    const classes = useStyle({color, isResponse});
    if (response) {
        occasion = response;
        hrefWithMacro = window.config.redirects.responseFromCard;
    }
    if (situation) {
        occasion = situation;
        hrefWithMacro = window.config.redirects.situationFromCard
    }
    if (!occasion) return <></>;

    return (<div className={classes.container}>
        <a href={getHref(occasion.name, hrefWithMacro)} className={classes.label} key={occasion.id}>
            {isResponse && <span className={classes.dot} />}
            {!isResponse && <img alt="situation icon" src={situationSvg} className={classes.situationLinkIcon} />}
            <span>{occasion.name}</span>
            <img alt="link icon" src={linkSvg} className={classes.linkIcon} />
        </a>
            {extra && <span className={classes.extra}>+{extra}</span>}
        </div>);
}
export default Link;
