import activateMapIcon from '../../../../../assets/activateMap.svg';
import deactivateMapIcon from '../../../../../assets/deactivateMap.svg';
import innerActivateMapIcon from '../../../../../assets/icon-map-region-blue-2.svg'
import innerDeactivateMapIcon from '../../../../../assets/icon-close-blue-3.svg';
import useStyles from "./mapDisplay.css";
import {useDisplayResultsMap, useSetDisplayResultsMap} from "../../../context/contextFunctions";
import mapAnalytics from "../../../../../services/gtag/mapEvents";
import {useTheme} from "react-jss";
import IDynamicThemeApp from "../../../../../types/dynamicThemeApp.ts";
import {createKeyboardHandler} from "../../../../../services/keyboardHandler";


const MapDisplay = () => {
    const displayResultsMap = useDisplayResultsMap()
    const setDisplayResultsMap = useSetDisplayResultsMap()
    const theme = useTheme<IDynamicThemeApp>();

    const classes = useStyles(theme);
    const vals = {
        text: displayResultsMap ? window.strings.results.hideMapOnDesktop : window.strings.results.showMapOnDesktop,
        icon: displayResultsMap ? deactivateMapIcon : activateMapIcon,
        altIcon: displayResultsMap ? window.strings.results.hideMapOnDesktop : window.strings.results.showMapOnDesktop,
        innerIcon: displayResultsMap ? innerDeactivateMapIcon : innerActivateMapIcon,
    }

    const onClick = () => {
        setDisplayResultsMap(!displayResultsMap)
        mapAnalytics.mapStateEvent({isOpen: !displayResultsMap});
    }

    const handleKeyDown = createKeyboardHandler(onClick);

    return <div
        onClick={onClick}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="button"
        aria-label={displayResultsMap ? "Hide map" : "Show map"}
        className={classes.root}>
        <img fetchPriority={'high'} className={classes.icon} src={vals.icon} alt={vals.altIcon}/>
        <span className={classes.text}>
                    <img className={classes.innerIcon} src={vals.innerIcon} alt={vals.altIcon}/>
            {vals.text}
                </span>
    </div>

}
export default MapDisplay;
