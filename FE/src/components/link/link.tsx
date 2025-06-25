import {Response, Situation} from "../../types/cardType";
import {getHref} from "./linkLogic";
import useStyle from "./link.css";
import linkSvg from '../../assets/icon-arrow-top-right-gray-4.svg'
import situationSvg from '../../assets/icon-person-blue-5.svg'

const Link = ({response, situation, extra} :{response?: Response, situation?: Situation, extra: number}) => {
    let occasion =null;
    let hrefWithMacro = '';
    let isResponse = false;
    if(response) {
        occasion = response;
        hrefWithMacro = window.config.redirects.responseFromCard;
        isResponse = true;
    }
    if(situation) {
        occasion = situation;
        hrefWithMacro = window.config.redirects.situationFromCard
    }
    if(!occasion) return <></>;
    const responseColors = window.config.responsesColors;
    const responseColor = responseColors[occasion.id] || '#000'
    const situationColor = window.config.situationsColors;
    const color: string = isResponse ? responseColor : situationColor;
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const classes = useStyle({color, isResponse});

    return (<div className={classes.container}>
        <a href={getHref(occasion.name, hrefWithMacro)} className={classes.label} key={occasion.id}>
            {isResponse && <span className={classes.dot} />}
            {!isResponse && <img alt="situation icon" src={situationSvg} className={classes.situationLinkIcon} />}
            <span>{occasion.name}</span>
            <img alt="link icon" src={linkSvg} className={classes.linkIcon} />
        </a>
            {extra && <span className={classes.extra}>{extra}</span>}
        </div>);
}
export default Link;
