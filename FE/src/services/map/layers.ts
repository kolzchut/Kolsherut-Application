import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";
import {MapSingleton} from "./map";
import {GetLayersParams, GetLayersReturn} from "../../types/layers";
import {createColorBasedClusterSources} from "./cluster/cluster.ts";
import {groupFeaturesByColor} from "./cluster/groupFeaturesByColor.ts";
import {setupClusterLayer, updateClusterLayerWithDebounce} from "./cluster/clusterLayer.ts";


const getLayers = ({worldImagerySource, poiSource, clusterSources}: GetLayersParams): GetLayersReturn => {
    const worldImageryLayer = new TileLayer({
        source: worldImagerySource,
        zIndex: 0,
        opacity: 0.6,
        background: "#FFFFFF",
    });

    const poiLayer = new VectorLayer({
        source: poiSource,
        visible: false,
        zIndex: 1
    });
    const layers: GetLayersReturn = [worldImageryLayer, poiLayer];
    setupClusterLayer({layers,clusterSources});
    return layers;
}


const initLayers = (map: MapSingleton) => {
    if (!map.sources) return;
    const {worldImagerySource, poiSource} = map.sources;

    const features = poiSource.getFeatures();
    const featuresByColor = groupFeaturesByColor(features);
    const clusterSources = createColorBasedClusterSources(featuresByColor);

    map.layers = getLayers({worldImagerySource, poiSource, clusterSources});

    poiSource.on('addfeature', () => updateClusterLayerWithDebounce());
    poiSource.on('removefeature', () => updateClusterLayerWithDebounce());
    poiSource.on('changefeature', () => updateClusterLayerWithDebounce());
}

export default initLayers;
