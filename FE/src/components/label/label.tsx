import {getColor} from "../../services/colorLogic";
import situationSvg from "../../assets/icon-person-blue-5.svg";
import linkSvg from "../../assets/icon-arrow-top-right-gray-4.svg";
import {Response, Situation} from "../../types/cardType";
import useStyle from "./label.css";
import { useSelector } from 'react-redux';
import {isAccessibilityActive} from "../../store/general/general.selector.ts";

const Label = ({response, situation, extra = 0}: { response?: Response, situation?: Situation, extra?: number }) => {
    const {isResponse, color} = getColor({response})
    const accessibilityActive = useSelector(isAccessibilityActive);
    const classes = useStyle({color, isResponse, accessibilityActive});
    const occasion = response || situation;
    
    if (!occasion) return <></>;
    return (
        <div className={classes.container}>
            <div className={classes.label} key={occasion.id}>
                {isResponse && <span className={classes.dot}/>}
                {!isResponse && <img alt="situation icon" src={situationSvg} className={classes.situationLinkIcon}/>}
                <span>{occasion.name}</span>
                <img alt="link icon" src={linkSvg} className={classes.linkIcon}/>
            </div>
            {extra != 0 && <span className={classes.extra}>+{extra}</span>}
        </div>);
}
export default Label;
