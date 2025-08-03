import VectorSource from "ol/source/Vector";
import {XYZ} from "ol/source";


export const getSources = () => {
    const worldImagerySource = new XYZ(window.config.map.worldImagery);
    const poiSource = new VectorSource({});

    return {
        worldImagerySource,
        poiSource,
    };
};
