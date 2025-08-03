import map from "../map.ts";
import {groupFeaturesByColor} from "./groupFeaturesByColor.ts";
import {createColorBasedClusterSources} from "./cluster.ts";
import VectorLayer from "ol/layer/Vector";
import {Cluster} from "ol/source";
import {createClusterStyle} from "../style/clusterStyle.ts";
import {Feature} from "ol";
import {Geometry} from "ol/geom";
import {GetLayersReturn} from "../../../types/layers.ts";

let currentClusterLayers: VectorLayer<Cluster>[] = [];


export const setupClusterLayer = ({layers,clusterSources}:{layers: GetLayersReturn,clusterSources?: { [_p: string]: Cluster<Feature<Geometry>> } | undefined
}) => {
    if (!clusterSources) return currentClusterLayers = [];
    Object.entries(clusterSources).forEach(([color, clusterSource]) => {
        const clusterLayer = new VectorLayer<Cluster>({
            source: clusterSource,
            visible: true,
            zIndex: 1,
            style: createClusterStyle(color)
        });
        layers.push(clusterLayer);
        currentClusterLayers.push(clusterLayer);
    });
}

export const updateClusterLayer = () => {
    if (!map.sources) return;

    const {poiSource} = map.sources;
    const features = poiSource.getFeatures();
    const featuresByColor = groupFeaturesByColor(features);

    currentClusterLayers.forEach((layer: VectorLayer) => {
        map.ol.removeLayer(layer);
    });

    const clusterSources = createColorBasedClusterSources(featuresByColor);

    currentClusterLayers = [];
    Object.entries(clusterSources).forEach(([color, clusterSource], index) => {
        const clusterLayer = new VectorLayer<Cluster>({
            source: clusterSource,
            visible: true,
            zIndex: 2 + index,
            style: createClusterStyle(color)
        });
        map.ol.addLayer(clusterLayer);
        currentClusterLayers.push(clusterLayer);
    });
};

