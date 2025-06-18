import 'ol/ol.css';
import mapService from '../../services/map/map';
import {useEffect, useRef} from "react";
import useStyles from './map.css';

const Map = () => {
    const mapRef = useRef<HTMLDivElement>(null);
    const classes = useStyles();

    useEffect(() => mapService.setTarget(mapRef.current || 'map'), []);

    return <div ref={mapRef} className={classes.map}/>;
};

export default Map;
