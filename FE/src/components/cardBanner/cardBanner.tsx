import {ICardForBanner} from "../../types/cardType";
import React, {useEffect, useRef, useState} from "react";
import { useTheme } from 'react-jss';
import Label from "../label/label";
import useStyle, {IDynamicTheme} from "./cardBanner.css";
import cardAnalytics from "../../services/gtag/cardEvents";


const CardBanner = ({card}: { card: ICardForBanner }) => {
    const theme = useTheme<IDynamicTheme>();
    const [extendText, setExtendText] = useState<boolean>(false);
    const classes = useStyle({theme});
    const buttonText = extendText ? window.strings.cardBanner.less : window.strings.cardBanner.more;
    const buttonClass = extendText ? classes.bannerDescriptionLong : classes.bannerDescriptionShort;
    const el = useRef<HTMLSpanElement | null>(null);
    const [isOverflowing, setIsOverflowing] = useState(false);

    useEffect(() => {
        if (el.current) {
            const lineHeightStr = getComputedStyle(el.current).lineHeight;
            const lineHeight = lineHeightStr === 'normal' ? 16 : parseFloat(lineHeightStr) || 16;
            const maxLines = 3;
            const maxHeight = lineHeight * maxLines;
            setIsOverflowing(el.current.scrollHeight > maxHeight);
        }
    }, []);
    const handleExtendOrMinimizeClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation();
        event.preventDefault();
        if (extendText) cardAnalytics.shrinkDescriptionEvent(card.card_id);
        else cardAnalytics.extendDescriptionEvent(card.card_id);
        setExtendText((prev) => !prev);
    };
    const responsesAmount = card.responses ? card.responses.length : 0;
    const situationsAmount = card.situations ? card.situations.length : 0;
    const displayLinks = !isOverflowing || (extendText && (responsesAmount > 0 || situationsAmount > 0));

    return (
        <div className={classes.cardBanner}>
            <h2 className={classes.bannerTitle}>
                {card.service_name}
            </h2>
            <div className={classes.bannerDescriptionDiv}>
                <span ref={el} className={buttonClass}>{card.service_description}</span>
                {isOverflowing && <button onClick={handleExtendOrMinimizeClick}
                                          className={classes.bannerDescriptionButton}>{buttonText}</button>}
            </div>
            {displayLinks && <div className={classes.linksDiv}>
                {responsesAmount !== 0 && (<Label response={card.responses[0]} extra={responsesAmount - 1}/>)}
                {situationsAmount !== 0 && (<Label situation={card.situations[0]} extra={situationsAmount - 1}/>)}
            </div>}
        </div>
    );
};

export default CardBanner;
