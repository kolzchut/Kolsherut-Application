import useStyles from "./geoFilterModal.css";
import closeIcon from '../../../../../../assets/icon-close-black.svg'
import {useSelector} from "react-redux";
import {getFilterResultsLength} from "../../../../../../store/shared/shared.selector"
import {getLocationFilter, getSearchLocation} from "../../../../../../store/filter/filter.selector";
import {store} from "../../../../../../store/store";
import {setLocationFilter, setSearchLocation} from "../../../../../../store/filter/filterSlice";
import ILocation from "../../../../../../types/locationType";
import {centerByLocation} from "../../../../../../services/geoLogic";
import getDefaultLocations from "../../../../../../constants/defaultLocations";
import {useEffect, useRef, useState} from "react";
import israelLocation from "../../../../../../constants/israelLocation";
import locationIcon from "../../../../../../assets/location.svg"
import wideLocationIcon from "../../../../../../assets/wideLocation.svg"
import {setModal} from "../../../../../../store/general/generalSlice";
import {getOptionalLocations} from "../../../../../../store/shared/locationFilters.selector";
import resultsAnalytics from "../../../../../../services/gtag/resultsEvents";
import IDynamicThemeApp from "../../../../../../types/dynamicThemeApp.ts";
import {useTheme} from "react-jss";
import {createKeyboardHandler} from "../../../../../../services/keyboardHandler";
import LocationDiv from "./locationDiv/locationDiv";

const GeoFilterModal = () => {
    const theme = useTheme<IDynamicThemeApp>();
    const classes = useStyles({accessibilityActive: theme.accessibilityActive});
    const searchLocations = useSelector(getSearchLocation);
    const dynamicLocations = useSelector(getOptionalLocations);
    const [optionalLocations, setOptionalLocations] = useState<ILocation[]>([]);
    const resultsLength = useSelector(getFilterResultsLength);
    const location = useSelector(getLocationFilter);
    const placeholder = window.strings.results.geoFilterModalPlaceHolder;
    const focusRef = useRef<HTMLInputElement>(null);
    useEffect(() => {
        if (!focusRef.current) return;
        focusRef.current.focus()
    }, []);
    useEffect(() => {
        const setLocations = async () => {
            if (dynamicLocations && dynamicLocations.length > 0) return setOptionalLocations(dynamicLocations);
            setOptionalLocations(await getDefaultLocations());
        }
        setLocations()
    }, [dynamicLocations]);
    const close = () => {
        store.dispatch(setSearchLocation(""));
        store.dispatch(setModal(null));
    }
    const handleCloseKeyDown = createKeyboardHandler(close);
    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        store.dispatch(setSearchLocation(e.target.value));
    }
    const onClick = (location: ILocation, zoom = 12) => {
        store.dispatch(setLocationFilter(location));
        centerByLocation(location.bounds, zoom);
        resultsAnalytics.geoFilterLocationSelect(location);
        close();
    }
    return <div className={classes.root}>
        <div className={classes.searchDiv}>
            <input type={"text"} placeholder={placeholder} ref={focusRef} className={classes.input}
                   value={searchLocations} onChange={onChange}/>
            <div className={classes.currentLocationDiv}>
                <span>{location.key}</span>
                <span className={classes.count}>{resultsLength}</span>
            </div>
            <button
                className={classes.closeIcon}
                onClick={close}
                onKeyDown={handleCloseKeyDown}
                aria-label="Close location filter modal"
            >
                <img src={closeIcon} alt={"close icon"}/>
            </button>
        </div>
        <div>
            <LocationDiv
                location={israelLocation}
                icon={wideLocationIcon}
                iconAlt="wide location icon"
                onClick={onClick}
                zoom={window.config.map.zoom || 7.5}
                className={classes.locationDiv}
            />
            <div className={classes.border}/>
            {optionalLocations?.map((location, index) => (
                <LocationDiv
                    key={index}
                    location={location}
                    icon={locationIcon}
                    iconAlt="location icon"
                    onClick={onClick}
                    className={classes.locationDiv}
                />
            ))}
        </div>
    </div>
}
export default GeoFilterModal;
