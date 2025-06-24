import 'ol/ol.css';
import mapService from '../../services/map/map';
import {useEffect, useRef} from "react";
import useStyles from './map.css';
import Popup from "./Popup/Popup";

const Map = () => {
    const mapRef = useRef<HTMLDivElement>(null);
    const popupRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const classes = useStyles();

    useEffect(() => {
        mapService.setTarget(mapRef.current || 'map')
        if (popupRef.current) mapService.setPopupOverlay(popupRef.current);
    }, []);

    return <div ref={mapRef} className={classes.map}>
        <Popup popupRef={popupRef} contentRef={contentRef}/>
    </div>;
};

export default Map;
