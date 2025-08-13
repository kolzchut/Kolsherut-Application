import {useSelector} from "react-redux";
import {getFilterResultsLength} from "../../../../../store/shared/shared.selector";
import {getLocationFilter} from "../../../../../store/filter/filter.selector";
import mapIcon from '../../../../../assets/icon-map-region-blue-2.svg';
import useStyles from "./geoFilter.css";
import {store} from "../../../../../store/store";
import {setModal} from "../../../../../store/general/generalSlice";
import {useTheme} from "react-jss";
import IDynamicThemeApp from "../../../../../types/dynamicThemeApp.ts";
import {createKeyboardHandler} from "../../../../../services/keyboardHandler";

const GeoFilter = () => {
    const theme = useTheme<IDynamicThemeApp>();
    const classes = useStyles({accessibilityActive: theme.accessibilityActive});
    const resultsLength = useSelector(getFilterResultsLength)
    const location = useSelector(getLocationFilter)

    const handleClick = () => {
        store.dispatch(setModal('GeoFilterModal'));
    };

    const handleKeyDown = createKeyboardHandler(handleClick);

    return <div
        className={classes.root}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="button"
        aria-label={`Open location filter for ${location.key}, ${resultsLength} results`}
    >
        <div className={classes.textAndMapDiv}>
            <img src={mapIcon} alt={"map"}/>
            <span>{location.key}</span>
        </div>
        <span className={classes.count}>{resultsLength}</span>
    </div>

}
export default GeoFilter;
