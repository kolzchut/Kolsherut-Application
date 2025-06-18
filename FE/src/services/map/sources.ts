import VectorSource from "ol/source/Vector";
import OSM from "ol/source/OSM";


export function getSources() {
    const osmSource = new OSM();
    const poiSource = new VectorSource({});

    return {
        osmSource,
        poiSource,
    };
}
