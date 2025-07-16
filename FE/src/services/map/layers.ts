import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";
import {MapSingleton} from "./map";
import {GetLayersParams, GetLayersReturn} from "../../types/layers";


const getLayers = ({worldImagerySource, poiSource}: GetLayersParams): GetLayersReturn => {
    const worldImageryLayer = new TileLayer({
        source: worldImagerySource,
        zIndex: 0,
        opacity: 0.6,
        background: "#FFFFFF",
    })
    const poiLayer = new VectorLayer({
        source: poiSource,
        visible: true,
        zIndex: 1
    });
    return [worldImageryLayer, poiLayer];
}
const initLayers = (map: MapSingleton) => {
    if (!map.sources) return;
    const {worldImagerySource, poiSource} = map.sources;
    map.layers = getLayers({worldImagerySource, poiSource})
}
export default initLayers;
