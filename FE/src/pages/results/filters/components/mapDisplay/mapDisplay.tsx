import activateMapIcon from '../../../../../assets/activateMap.svg';
import deactivateMapIcon from '../../../../../assets/deactivateMap.svg';
import innerActivateMapIcon from '../../../../../assets/icon-map-region-blue-2.svg'
import innerDeactivateMapIcon from '../../../../../assets/icon-close-blue-3.svg';
import useStyles from "./mapDisplay.css";
import {useDisplayResultsMap, useSetDisplayResultsMap} from "../../../context/contextFunctions";
import {useMediaQuery} from "@mui/material";
import {widthOfMobile} from "../../../../../constants/mediaQueryProps";
import {mapStateEvent} from "../../../../../services/gtag/mapEvents";

const MapDisplay = () => {
    const displayResultsMap = useDisplayResultsMap()
    const setDisplayResultsMap = useSetDisplayResultsMap()
    const isMobile = useMediaQuery(widthOfMobile);
    const classes = useStyles({isMobile});
    const vals = {
        text: displayResultsMap ? window.strings.results.hideMapOnDesktop : window.strings.results.showMapOnDesktop,
        icon: displayResultsMap ? deactivateMapIcon : activateMapIcon,
        altIcon: displayResultsMap ? window.strings.results.hideMapOnDesktop : window.strings.results.showMapOnDesktop,
        innerIcon: displayResultsMap ? innerDeactivateMapIcon : innerActivateMapIcon,
    }

    const onClick = () => {
        setDisplayResultsMap(!displayResultsMap)
        mapStateEvent({isOpen: !displayResultsMap});
    }

    return <div onClick={onClick} className={classes.root}>
                <img fetchPriority={'high'} className={classes.icon} src={vals.icon} alt={vals.altIcon} />
                <span className={classes.text}>
                    <img className={classes.innerIcon} src={vals.innerIcon} alt={vals.altIcon}/>
                    {vals.text}
                </span>
         </div>

}
export default MapDisplay;
