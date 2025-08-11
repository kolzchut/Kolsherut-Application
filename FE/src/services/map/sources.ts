import VectorSource from "ol/source/Vector";
import { OSM } from "ol/source";

export const getSources = () => {
    const osm = new OSM({
        attributions: ["© OpenStreetMap contributors"],
    });

    const poiSource = new VectorSource({
        useSpatialIndex: true,
    });


    return {
        osm,
        poiSource,
    };
};
