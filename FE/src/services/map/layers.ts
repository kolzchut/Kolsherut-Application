import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";
import {MapSingleton} from "./map";
import {GetLayersParams, GetLayersReturn} from "../../types/layers";


const getLayers = ({osmSource, poiSource}: GetLayersParams): GetLayersReturn => {
    const osmLayer = new TileLayer({source: osmSource});

    const poiLayer = new VectorLayer({
        source: poiSource,
        visible: true,
        zIndex: 1
    });
    return [osmLayer, poiLayer];
}
const initLayers = (map: MapSingleton) => {
    if (!map.sources) return;
    const {osmSource, poiSource} = map.sources;
    map.layers = getLayers({osmSource, poiSource})
}
export default initLayers;
