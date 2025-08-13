import 'ol/ol.css';
import mapService from '../../services/map/map';
import {useEffect, useRef} from "react";
import useStyles from './map.css';
import Popup from "./Popup/Popup";

const Map = () => {
    const mapRef = useRef<HTMLDivElement>(null);
    const mainPopupRef = useRef<HTMLDivElement>(null);
    const mainContentRef = useRef<HTMLDivElement>(null);
    const secondaryPopupRef = useRef<HTMLDivElement>(null);
    const secondaryContentRef = useRef<HTMLDivElement>(null);
    const classes = useStyles();

    useEffect(() => {
        mapService.setTarget(mapRef.current || 'map')
        if (mainPopupRef.current) mapService.setMainPopupOverlay(mainPopupRef.current);
        if (secondaryPopupRef.current) mapService.setSecondaryPopupOverlay(secondaryPopupRef.current);
    }, []);

    return <div ref={mapRef} className={classes.map}>
        <Popup  popupRef={mainPopupRef} contentRef={mainContentRef}/>
        <Popup popupRef={secondaryPopupRef} contentRef={secondaryContentRef}/>
    </div>;
};

export default Map;
