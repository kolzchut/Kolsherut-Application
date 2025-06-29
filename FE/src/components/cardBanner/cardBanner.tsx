import {ICard} from "../../types/cardType";
import useStyle from "./cardBanner.css";
import emergencyIcon from "../../assets/emergency-icon.svg";
import {getLinkToCard, isEmergency as checkIfEmergency} from "./cardBannerLogic";
import React, {useState} from "react";
import Link from "../link/link";
import {extendDescriptionEvent, shrinkDescriptionEvent} from "../../services/gtag/cardEvents";

const CardBanner = ({card}: { card: ICard }) => {
    const [extendText, setExtendText] = useState<boolean>(false);
    const classes = useStyle();
    const linkToCard = getLinkToCard(card.card_id)
    const isEmergency = checkIfEmergency(card.responses)
    const buttonText = extendText ? window.strings.cardBanner.less : window.strings.cardBanner.more;
    const buttonClass = extendText ? classes.bannerDescriptionLong : classes.bannerDescriptionShort;
    const handleExtendOrMinimizeClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation();
        event.preventDefault();
        if (extendText) shrinkDescriptionEvent(card.card_id);
        else extendDescriptionEvent(card.card_id);
        setExtendText((prev) => !prev);
    };
    const responsesAmount = card.responses ? card.responses.length : 0;
    const situationsAmount = card.situations ? card.situations.length : 0;
    const displayLinks = extendText && (responsesAmount > 0 || situationsAmount > 0);
    return (
        <a href={linkToCard} className={classes.aTag}>
            <div className={classes.cardBanner}>
                {isEmergency && <img src={emergencyIcon} alt={"Emergency Icon"} className={classes.emergencyIcon}/>}
                <h4 className={classes.bannerTitle}>
                    {card.service_name}
                </h4>
                <div className={classes.bannerDescriptionDiv}>
                    <span className={buttonClass}>{card.service_description}</span>
                    <button onClick={handleExtendOrMinimizeClick}
                            className={classes.bannerDescriptionButton}>{buttonText}</button>
                </div>
                {displayLinks && <div className={classes.linksDiv}>
                    {responsesAmount !== 0 && (<Link response={card.responses[0]} extra={responsesAmount - 1}/>)}
                    {situationsAmount !== 0 && (<Link situation={card.situations[0]} extra={situationsAmount - 1}/>)}
                </div>}
            </div>
        </a>)
}

export default CardBanner
