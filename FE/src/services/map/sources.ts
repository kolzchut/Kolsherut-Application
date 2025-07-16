import VectorSource from "ol/source/Vector";
import {XYZ} from "ol/source";


export function getSources() {
    const worldImagerySource = new XYZ(window.config.map.worldImagery);
    const poiSource = new VectorSource({});

    return {
        worldImagerySource,
        poiSource,
    };
}
