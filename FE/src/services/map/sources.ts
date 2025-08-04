import VectorSource from "ol/source/Vector";
import { OSM } from "ol/source";
import { GeoJSON } from "ol/format";
import borderGeoJSON from "../../assets/israel.json";

export const getSources = () => {
    const osm = new OSM({
        attributions: ["© OpenStreetMap contributors"],
    });

    const poiSource = new VectorSource({
        useSpatialIndex: true,
    });

   
    const geoJsonFormat = new GeoJSON({
        dataProjection: 'EPSG:4326',
        featureProjection: 'EPSG:3857'
    });

    const israelBorderSource = new VectorSource({
        features: geoJsonFormat.readFeatures(borderGeoJSON)
    });

    return {
        osm,
        poiSource,
        israelBorderSource, 
    };
};
