import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";
import {MapSingleton} from "./map";
import {GetLayersParams, GetLayersReturn} from "../../types/layers";
import {createColorBasedClusterSources} from "./cluster/cluster.ts";
import {groupFeaturesByColor} from "./cluster/groupFeaturesByColor.ts";
import {setupClusterLayer, updateClusterLayerWithDebounce} from "./cluster/clusterLayer.ts";
import polygonStyle from "./style/polygonStyle.ts";


const getLayers = ({osm, poiSource,israelBorderSource, clusterSources}: GetLayersParams): GetLayersReturn => {
    const osmLayer = new TileLayer({
        source: osm,
        zIndex: 0,
        opacity: 0.6,
        background: "#FFFFFF",
    });

    const poiLayer = new VectorLayer({
        source: poiSource,
        visible: false,
        zIndex: 1
    });
    const israelBorderLayer = new VectorLayer({
        source:israelBorderSource,
        zIndex:2,
        style: polygonStyle
    });
    const layers: GetLayersReturn = [osmLayer, poiLayer, israelBorderLayer];
    setupClusterLayer({layers,clusterSources});
    return layers;
}


const initLayers = (map: MapSingleton) => {
    if (!map.sources) return;
    const {osm, poiSource, israelBorderSource} = map.sources;

    const features = poiSource.getFeatures();
    const featuresByColor = groupFeaturesByColor(features);
    const clusterSources = createColorBasedClusterSources(featuresByColor);

    map.layers = getLayers({osm, poiSource,israelBorderSource, clusterSources});

    poiSource.on('addfeature', () => updateClusterLayerWithDebounce());
    poiSource.on('removefeature', () => updateClusterLayerWithDebounce());
    poiSource.on('changefeature', () => updateClusterLayerWithDebounce());
}

export default initLayers;
