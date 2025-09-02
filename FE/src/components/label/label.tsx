import {getColor} from "../../services/colorLogic";
import situationSvg from "../../assets/icon-person-blue-5.svg";
import linkSvg from "../../assets/icon-arrow-top-right-gray-4.svg";
import {Response, Situation} from "../../types/cardType";
import useStyle from "./label.css";
import { useTheme } from 'react-jss';
import IDynamicThemeApp from "../../types/dynamicThemeApp.ts";
import React from "react";

const Label = ({response, situation, extra = 0}: { response?: Response, situation?: Situation, extra?: number }) => {
    const {isResponse, color: rawColor} = getColor({response});
    const theme = useTheme<IDynamicThemeApp>();

    const color = rawColor || "#ffffff";
    const styleProps = React.useMemo(
        () => ({
            color,
            isResponse,
            accessibilityActive: theme.accessibilityActive
        }),
        [color, isResponse, theme.accessibilityActive]
    );

    const classes = useStyle(styleProps);
    const occasion = response || situation;

    if (!occasion) return null;

    return (
        <div className={classes.container}>
            <div className={classes.label} key={occasion.id}>
                {isResponse && <span className={classes.dot}/>}
                {!isResponse && <img alt="situation icon" src={situationSvg} className={classes.situationLinkIcon}/>}
                <span>{occasion.name}</span>
                <img alt="link icon" src={linkSvg} className={classes.linkIcon}/>
            </div>
            {extra !== 0 && <span className={classes.extra}>+{extra}</span>}
        </div>
    );
};

export default Label;
